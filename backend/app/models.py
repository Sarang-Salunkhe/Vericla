from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DocumentType = Literal["pdf", "txt"]
DocumentProcessingStatus = Literal["ready"]


class SourceMetadata(BaseModel):
    declared_content_type: str | None
    detected_document_type: DocumentType
    page_count: int | None = Field(default=None, ge=1)


class SourcePage(BaseModel):
    page_number: int | None = Field(default=None, ge=1)
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)


class Document(BaseModel):
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
    normalized_text: str = Field(repr=False)
    source_pages: list[SourcePage] = Field(repr=False)


class DocumentChunk(BaseModel):
    document_id: str
    chunk_id: str
    text: str
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)
    page_numbers: list[int] = Field(default_factory=list)


class EvidenceReference(BaseModel):
    document_id: str
    chunk_id: str
    page_numbers: list[int] = Field(default_factory=list)
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)
