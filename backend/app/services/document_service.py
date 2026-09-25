from datetime import UTC, datetime, timedelta
from pathlib import PurePath
from uuid import uuid4

from app.config import Settings, get_settings
from app.models import Document, DocumentChunk, DocumentType, SourceMetadata
from app.services.document_processing import (
    DocumentProcessingError,
    chunk_source,
    extract_pdf,
    extract_text,
    normalize_source,
)
from app.services.document_store import DocumentStore, InMemoryDocumentStore

_ALLOWED_EXTENSIONS: dict[str, DocumentType] = {".pdf": "pdf", ".txt": "txt"}
_ALLOWED_MEDIA_TYPES: dict[DocumentType, set[str]] = {
    "pdf": {"application/pdf", "application/octet-stream"},
    "txt": {"text/plain", "application/octet-stream"},
}


class DocumentService:
    def __init__(self, store: DocumentStore, settings: Settings) -> None:
        self._store = store
        self._settings = settings

    def create_document(
        self,
        filename: str,
        declared_content_type: str | None,
        content: bytes,
    ) -> Document:
        safe_filename = PurePath(filename.replace("\\", "/")).name
        extension = PurePath(safe_filename).suffix.lower()
        document_type = _ALLOWED_EXTENSIONS.get(extension)
        if not safe_filename or document_type is None:
            raise DocumentProcessingError(415, "Only PDF and TXT files are supported.")
        if declared_content_type:
            clean_content_type = declared_content_type.split(";")[0].strip().lower()
            if clean_content_type not in _ALLOWED_MEDIA_TYPES[document_type]:
                raise DocumentProcessingError(415, "The file type does not match its extension.")
        if not content:
            raise DocumentProcessingError(422, "The uploaded file is empty.")
        if len(content) > self._settings.max_upload_size_bytes:
            raise DocumentProcessingError(413, "The uploaded file exceeds the size limit.")

        if document_type == "pdf":
            if not content.startswith(b"%PDF-"):
                raise DocumentProcessingError(422, "The file is not a valid PDF.")
            extracted = extract_pdf(content, self._settings.max_pdf_pages)
        else:
            if content.startswith(b"%PDF-"):
                raise DocumentProcessingError(415, "The file type does not match its extension.")
            extracted = extract_text(content)

        normalized = normalize_source(extracted)
        if not normalized.text.strip():
            raise DocumentProcessingError(422, "The document does not contain extractable text.")
        if len(normalized.text) > self._settings.max_extracted_text_chars:
            raise DocumentProcessingError(413, "The document contains too much extractable text.")

        document_id = uuid4().hex
        chunks = chunk_source(
            document_id,
            normalized,
            self._settings.document_chunk_size,
            self._settings.document_chunk_overlap,
        )
        now = datetime.now(UTC)
        page_count = len(extracted.pages) if document_type == "pdf" else None
        document = Document(
            document_id=document_id,
            filename=safe_filename,
            document_type=document_type,
            media_type="application/pdf" if document_type == "pdf" else "text/plain",
            processing_status="ready",
            created_at=now,
            expires_at=now + timedelta(seconds=self._settings.document_session_ttl_seconds),
            source_metadata=SourceMetadata(
                declared_content_type=declared_content_type,
                detected_document_type=document_type,
                page_count=page_count,
            ),
            page_count=page_count,
            text_length=len(normalized.text),
            chunk_count=len(chunks),
            normalized_text=normalized.text,
            source_pages=normalized.source_pages,
        )
        self._store.put(document, chunks)
        return document

    def get_document(self, document_id: str) -> Document | None:
        return self._store.get_document(document_id)

    def get_chunks(self, document_id: str) -> list[DocumentChunk] | None:
        return self._store.get_chunks(document_id)


_document_service = DocumentService(InMemoryDocumentStore(), get_settings())


def get_document_service() -> DocumentService:
    return _document_service
