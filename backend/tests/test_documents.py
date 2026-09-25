from datetime import UTC, datetime
from io import BytesIO
from unittest.mock import patch
from fastapi.testclient import TestClient
import pytest
from pypdf import PdfWriter

from app.models import DocumentChunk
from app.services.document_processing import (
    DocumentProcessingError,
    ExtractedPage,
    ExtractedSource,
    chunk_source,
    normalize_source,
    normalize_text,
)
from app.services.document_service import get_document_service
from app.services.document_store import InMemoryDocumentStore


def create_pdf_bytes(page_texts: list[str]) -> bytes:
    """Helper to generate valid PDF byte content with text and standard xref table."""

    buf = BytesIO()
    buf.write(b"%PDF-1.4\n")

    offsets: list[int] = []

    # Obj 1: Catalog
    offsets.append(buf.tell())
    buf.write(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

    # Obj 2: Pages
    offsets.append(buf.tell())
    kids = " ".join(f"{4 + i * 2} 0 R" for i in range(len(page_texts)))
    buf.write(
        f"2 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {len(page_texts)} >>\nendobj\n".encode()
    )

    # Obj 3: Font
    offsets.append(buf.tell())
    buf.write(b"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    for i, text in enumerate(page_texts):
        page_idx = 4 + i * 2
        stream_idx = page_idx + 1

        # Obj page
        offsets.append(buf.tell())
        buf.write(
            f"{page_idx} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {stream_idx} 0 R >>\nendobj\n".encode()
        )

        # Obj stream
        offsets.append(buf.tell())
        escaped_text = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content = f"BT /F1 12 Tf 50 700 Td ({escaped_text}) Tj ET\n".encode("latin-1")
        buf.write(f"{stream_idx} 0 obj\n<< /Length {len(content)} >>\nstream\n".encode())
        buf.write(content)
        buf.write(b"endstream\nendobj\n")

    xref_start = buf.tell()
    buf.write(f"xref\n0 {len(offsets) + 1}\n0000000000 65535 f \n".encode())
    for off in offsets:
        buf.write(f"{off:010d} 00000 n \n".encode())

    buf.write(
        f"trailer\n<< /Size {len(offsets) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode()
    )

    return buf.getvalue()


def create_empty_pdf_bytes() -> bytes:
    """Creates a PDF with zero pages using pypdf PdfWriter."""
    writer = PdfWriter()
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


def create_blank_page_pdf_bytes() -> bytes:
    """Creates a valid PDF with 1 page but no text stream (image/blank page)."""
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


# -----------------------------------------------------------------------------
# Unit Tests for Normalization & Chunking
# -----------------------------------------------------------------------------

def test_10_txt_normalization() -> None:
    raw = "  Header   Line  \r\n\r\n   Second   Line  \n\n\n  Third Line  "
    normalized = normalize_text(raw)
    assert normalized == "Header Line\n\nSecond Line\n\nThird Line"


def test_11_pdf_normalization_page_offsets() -> None:
    source = ExtractedSource(
        document_type="pdf",
        pages=[
            ExtractedPage(page_number=1, text="Page One Content"),
            ExtractedPage(page_number=2, text="Page Two Content"),
        ],
    )
    norm = normalize_source(source)
    assert norm.text == "Page One Content\n\nPage Two Content"
    assert len(norm.source_pages) == 2
    assert norm.source_pages[0].page_number == 1
    assert norm.source_pages[0].start_offset == 0
    assert norm.source_pages[0].end_offset == 16
    assert norm.source_pages[1].page_number == 2
    assert norm.source_pages[1].start_offset == 18
    assert norm.source_pages[1].end_offset == 34


def test_12_13_14_15_deterministic_chunking_ids_offsets_and_exact_text() -> None:
    source = ExtractedSource(
        document_type="pdf",
        pages=[
            ExtractedPage(page_number=1, text="0123456789"),  # 10 chars, offset 0..10
            ExtractedPage(page_number=2, text="abcdefghij"),  # 10 chars, offset 12..22
        ],
    )
    norm = normalize_source(source)  # "0123456789\n\nabcdefghij" (len = 22)
    chunks = chunk_source("doc123", norm, chunk_size=10, overlap=2)

    assert len(chunks) == 3

    # Chunk 0
    assert chunks[0].chunk_id == "doc123:chunk:0000"
    assert chunks[0].document_id == "doc123"
    assert chunks[0].text == norm.text[chunks[0].start_offset : chunks[0].end_offset]
    assert chunks[0].text == "0123456789"
    assert chunks[0].start_offset == 0
    assert chunks[0].end_offset == 10
    assert chunks[0].page_numbers == [1]

    # Chunk 1
    assert chunks[1].chunk_id == "doc123:chunk:0001"
    assert chunks[1].document_id == "doc123"
    assert chunks[1].text == norm.text[chunks[1].start_offset : chunks[1].end_offset]
    assert chunks[1].text == "89\n\nabcdef"
    assert chunks[1].start_offset == 8
    assert chunks[1].end_offset == 18
    assert chunks[1].page_numbers == [1, 2]

    # Chunk 2
    assert chunks[2].chunk_id == "doc123:chunk:0002"
    assert chunks[2].document_id == "doc123"
    assert chunks[2].text == norm.text[chunks[2].start_offset : chunks[2].end_offset]
    assert chunks[2].text == "efghij"
    assert chunks[2].start_offset == 16
    assert chunks[2].end_offset == 22
    assert chunks[2].page_numbers == [2]


def test_18_ephemeral_storage_expiration() -> None:
    store = InMemoryDocumentStore()
    doc_service = get_document_service()
    doc = doc_service.create_document("test.txt", "text/plain", b"Hello world")

    fetched = doc_service.get_document(doc.document_id)
    assert fetched is not None
    assert fetched.document_id == doc.document_id

    # Expire document manually
    doc.expires_at = datetime.now(UTC)
    expired_doc = store.get_document(doc.document_id)
    assert expired_doc is None
    assert store.get_chunks(doc.document_id) is None


def test_19_document_isolation() -> None:
    doc_service = get_document_service()
    doc1 = doc_service.create_document("doc1.txt", "text/plain", b"First document text.")
    doc2 = doc_service.create_document("doc2.txt", "text/plain", b"Second document text.")

    fetched1 = doc_service.get_document(doc1.document_id)
    fetched2 = doc_service.get_document(doc2.document_id)

    assert fetched1 is not None and fetched2 is not None
    assert fetched1.document_id != fetched2.document_id
    assert fetched1.filename == "doc1.txt"
    assert fetched2.filename == "doc2.txt"

    chunks1 = doc_service.get_chunks(doc1.document_id)
    chunks2 = doc_service.get_chunks(doc2.document_id)

    assert chunks1 is not None and chunks2 is not None
    assert all(c.document_id == doc1.document_id for c in chunks1)
    assert all(c.document_id == doc2.document_id for c in chunks2)


def test_20_parser_exception_safety() -> None:
    pdf_bytes = create_pdf_bytes(["Test page"])
    with patch("app.services.document_processing.PdfReader", side_effect=Exception("Internal pypdf crash")):
        doc_service = get_document_service()
        with pytest.raises(DocumentProcessingError) as exc_info:
            doc_service.create_document("test.pdf", "application/pdf", pdf_bytes)
        assert exc_info.value.status_code == 422
        assert exc_info.value.message == "The PDF could not be processed."


# -----------------------------------------------------------------------------
# Integration Tests for Document Upload & Retrieval API
# -----------------------------------------------------------------------------

def test_01_21_upload_valid_txt_document(client: TestClient) -> None:
    content = b"This is a valid legal agreement text file."
    response = client.post(
        "/api/v1/documents",
        files={"file": ("contract.txt", content, "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "contract.txt"
    assert data["document_type"] == "txt"
    assert data["media_type"] == "text/plain"
    assert data["processing_status"] == "ready"
    assert data["page_count"] is None
    assert data["text_length"] == len(content)
    assert data["chunk_count"] > 0
    assert "document_id" in data
    assert "created_at" in data
    assert "expires_at" in data


def test_02_09_upload_valid_pdf_document_with_page_metadata(client: TestClient) -> None:
    pdf_bytes = create_pdf_bytes(["Clause 1: Confidentiality.", "Clause 2: Termination."])
    response = client.post(
        "/api/v1/documents",
        files={"file": ("agreement.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "agreement.pdf"
    assert data["document_type"] == "pdf"
    assert data["media_type"] == "application/pdf"
    assert data["processing_status"] == "ready"
    assert data["page_count"] == 2
    assert data["chunk_count"] >= 1
    assert data["source_metadata"]["page_count"] == 2
    assert data["source_metadata"]["detected_document_type"] == "pdf"


def test_03_upload_unsupported_extension(client: TestClient) -> None:
    response = client.post(
        "/api/v1/documents",
        files={"file": ("malicious.exe", b"MZ...", "application/x-msdownload")},
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "Only PDF and TXT files are supported."}


def test_04_upload_unsupported_mime_type(client: TestClient) -> None:
    # PDF extension but unsupported image MIME type
    pdf_bytes = create_pdf_bytes(["Sample"])
    response = client.post(
        "/api/v1/documents",
        files={"file": ("document.pdf", pdf_bytes, "image/png")},
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "The file type does not match its extension."}


def test_upload_mismatched_file_extension(client: TestClient) -> None:
    pdf_bytes = create_pdf_bytes(["Sample"])
    response = client.post(
        "/api/v1/documents",
        files={"file": ("document.txt", pdf_bytes, "text/plain")},
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "The file type does not match its extension."}


def test_06_upload_empty_file(client: TestClient) -> None:
    response = client.post(
        "/api/v1/documents",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "The uploaded file is empty."}


def test_05_upload_oversized_file(client: TestClient) -> None:
    large_content = b"A" * (11 * 1024 * 1024)
    response = client.post(
        "/api/v1/documents",
        files={"file": ("large.txt", large_content, "text/plain")},
    )
    assert response.status_code == 413
    assert response.json() == {"detail": "The uploaded file exceeds the size limit."}


def test_07_upload_malformed_pdf(client: TestClient) -> None:
    corrupt_pdf = b"%PDF-1.4\ncorrupted bytes content here..."
    response = client.post(
        "/api/v1/documents",
        files={"file": ("corrupt.pdf", corrupt_pdf, "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "The PDF could not be processed."}


def test_08_upload_valid_empty_pdf_no_pages(client: TestClient) -> None:
    empty_pdf = create_empty_pdf_bytes()
    response = client.post(
        "/api/v1/documents",
        files={"file": ("nopages.pdf", empty_pdf, "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "The PDF does not contain any pages."}


def test_08_upload_valid_pdf_no_extractable_text(client: TestClient) -> None:
    blank_pdf = create_blank_page_pdf_bytes()
    response = client.post(
        "/api/v1/documents",
        files={"file": ("blank.pdf", blank_pdf, "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "The document does not contain extractable text."}


def test_16_get_document_metadata(client: TestClient) -> None:
    content = b"Sample document text for retrieval test."
    upload_res = client.post(
        "/api/v1/documents",
        files={"file": ("test.txt", content, "text/plain")},
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document_id"]

    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    fetched_data = get_res.json()
    assert fetched_data["document_id"] == doc_id
    assert fetched_data["filename"] == "test.txt"
    assert "normalized_text" not in fetched_data


def test_17_get_missing_document_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/documents/non_existent_id_12345")
    assert response.status_code == 404
    assert response.json() == {"detail": "Document session was not found."}


def test_22_safe_error_responses_contain_no_traceback(client: TestClient) -> None:
    res = client.get("/api/v1/documents/invalid_id")
    data = res.json()
    assert "detail" in data
    assert "traceback" not in data
    assert "stack" not in data
    assert "exception" not in data
