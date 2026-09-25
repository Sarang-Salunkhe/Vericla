from datetime import datetime

from pydantic import BaseModel, Field

from app.models import Document, DocumentProcessingStatus, DocumentType, SourceMetadata


class DocumentMetadataResponse(BaseModel):
    document_id: str
    filename: str
    document_type: DocumentType
    media_type: str
    processing_status: DocumentProcessingStatus
    created_at: datetime
    expires_at: datetime
    source_metadata: SourceMetadata
    page_count: int | None = Field(default=None, ge=1)
    text_length: int = Field(ge=0)
    chunk_count: int = Field(ge=0)

    @classmethod
    def from_document(cls, document: Document) -> "DocumentMetadataResponse":
        return cls(
            document_id=document.document_id,
            filename=document.filename,
            document_type=document.document_type,
            media_type=document.media_type,
            processing_status=document.processing_status,
            created_at=document.created_at,
            expires_at=document.expires_at,
            source_metadata=document.source_metadata,
            page_count=document.page_count,
            text_length=document.text_length,
            chunk_count=document.chunk_count,
        )
