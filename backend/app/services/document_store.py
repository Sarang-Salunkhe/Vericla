from datetime import UTC, datetime, timedelta
from typing import Protocol

from app.models import Document, DocumentChunk


class DocumentStore(Protocol):
    def put(self, document: Document, chunks: list[DocumentChunk]) -> None: ...

    def get_document(self, document_id: str) -> Document | None: ...

    def get_chunks(self, document_id: str) -> list[DocumentChunk] | None: ...


class InMemoryDocumentStore:
    """Ephemeral storage implementation for document sessions."""

    def __init__(self) -> None:
        self._documents: dict[str, Document] = {}
        self._chunks: dict[str, list[DocumentChunk]] = {}

    def put(self, document: Document, chunks: list[DocumentChunk]) -> None:
        self._documents[document.document_id] = document
        self._chunks[document.document_id] = chunks

    def get_document(self, document_id: str) -> Document | None:
        document = self._documents.get(document_id)
        if document is None:
            return None
        if document.expires_at <= datetime.now(UTC):
            self._documents.pop(document_id, None)
            self._chunks.pop(document_id, None)
            return None
        return document

    def get_chunks(self, document_id: str) -> list[DocumentChunk] | None:
        if self.get_document(document_id) is None:
            return None
        return self._chunks.get(document_id)
