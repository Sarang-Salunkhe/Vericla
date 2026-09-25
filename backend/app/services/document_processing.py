from dataclasses import dataclass
from io import BytesIO
import re

from pypdf import PdfReader

from app.models import DocumentChunk, DocumentType, SourcePage


class DocumentProcessingError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int | None
    text: str


@dataclass(frozen=True)
class ExtractedSource:
    document_type: DocumentType
    pages: list[ExtractedPage]


@dataclass(frozen=True)
class NormalizedSource:
    text: str
    source_pages: list[SourcePage]


def normalize_text(text: str) -> str:
    """Normalize layout noise without changing substantive wording."""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    normalized_lines: list[str] = []
    previous_blank = False
    for line in lines:
        is_blank = not line
        if is_blank and previous_blank:
            continue
        normalized_lines.append(line)
        previous_blank = is_blank
    return "\n".join(normalized_lines).strip()


def normalize_source(source: ExtractedSource) -> NormalizedSource:
    parts: list[str] = []
    source_pages: list[SourcePage] = []
    cursor = 0

    for index, page in enumerate(source.pages):
        if index:
            parts.append("\n\n")
            cursor += 2
        normalized_page = normalize_text(page.text)
        start_offset = cursor
        parts.append(normalized_page)
        cursor += len(normalized_page)
        source_pages.append(
            SourcePage(
                page_number=page.page_number,
                start_offset=start_offset,
                end_offset=cursor,
            )
        )

    return NormalizedSource(text="".join(parts).strip(), source_pages=source_pages)


def extract_pdf(content: bytes, max_pages: int) -> ExtractedSource:
    try:
        reader = PdfReader(BytesIO(content), strict=False)
        if not reader.pages:
            raise DocumentProcessingError(422, "The PDF does not contain any pages.")
        if len(reader.pages) > max_pages:
            raise DocumentProcessingError(413, "The PDF exceeds the page limit.")
        pages = [
            ExtractedPage(page_number=index, text=page.extract_text() or "")
            for index, page in enumerate(reader.pages, start=1)
        ]
    except DocumentProcessingError:
        raise
    except Exception as exc:
        raise DocumentProcessingError(422, "The PDF could not be processed.") from exc

    return ExtractedSource(document_type="pdf", pages=pages)


def extract_text(content: bytes) -> ExtractedSource:
    if b"\x00" in content:
        raise DocumentProcessingError(422, "The text file is not valid UTF-8 text.")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise DocumentProcessingError(422, "The text file is not valid UTF-8 text.") from exc
    return ExtractedSource(document_type="txt", pages=[ExtractedPage(None, text)])


def chunk_source(
    document_id: str,
    source: NormalizedSource,
    chunk_size: int,
    overlap: int,
) -> list[DocumentChunk]:
    if overlap >= chunk_size:
        raise ValueError("Chunk overlap must be smaller than the chunk size.")

    chunks: list[DocumentChunk] = []
    start_offset = 0
    index = 0
    while start_offset < len(source.text):
        end_offset = min(start_offset + chunk_size, len(source.text))
        page_numbers = [
            page.page_number
            for page in source.source_pages
            if page.page_number is not None
            and page.start_offset < end_offset
            and page.end_offset > start_offset
        ]
        chunks.append(
            DocumentChunk(
                document_id=document_id,
                chunk_id=f"{document_id}:chunk:{index:04d}",
                text=source.text[start_offset:end_offset],
                start_offset=start_offset,
                end_offset=end_offset,
                page_numbers=page_numbers,
            )
        )
        if end_offset == len(source.text):
            break
        start_offset = end_offset - overlap
        index += 1
    return chunks
