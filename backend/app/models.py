from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DocumentType = Literal["pdf", "txt"]
DocumentProcessingStatus = Literal["ready"]

UncertaintyState = Literal["SUPPORTED", "PARTIAL", "AMBIGUOUS", "NOT_FOUND", "UNSUPPORTED"]
UserRole = Literal[
    "Tenant",
    "Employee",
    "Freelancer",
    "Customer",
    "Employer",
    "Business Owner",
    "Other",
    "General Analysis",
]
ReviewSignalCategory = Literal["review", "attention", "uncertain", "missing_information"]
ComparisonChangeType = Literal["ADDED", "REMOVED", "MODIFIED", "UNCHANGED"]


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
    excerpt: str | None = None
    section: str | None = None


class ClauseInsight(BaseModel):
    title: str
    text: str
    evidence: list[EvidenceReference] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"


class ObligationItem(BaseModel):
    party: str
    description: str
    evidence: list[EvidenceReference] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"


class ImportantDate(BaseModel):
    label: str
    date_text: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class ReviewSignal(BaseModel):
    category: ReviewSignalCategory
    title: str
    description: str
    evidence: list[EvidenceReference] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    analysis_id: str
    document_id: str
    role: UserRole = "General Analysis"
    summary: str
    document_type: str
    parties: list[str] = Field(default_factory=list)
    clauses: list[ClauseInsight] = Field(default_factory=list)
    obligations: list[ObligationItem] = Field(default_factory=list)
    dates: list[ImportantDate] = Field(default_factory=list)
    review_signals: list[ReviewSignal] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)
    created_at: datetime
    expires_at: datetime


class QAResult(BaseModel):
    qa_id: str
    document_id: str
    question: str
    simple_answer: str
    evidence: list[EvidenceReference] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"
    not_stated: str | None = None
    created_at: datetime


class ComparisonItem(BaseModel):
    category: str
    change_type: ComparisonChangeType
    description: str
    doc1_evidence: list[EvidenceReference] = Field(default_factory=list)
    doc2_evidence: list[EvidenceReference] = Field(default_factory=list)


class CompareResult(BaseModel):
    compare_id: str
    doc1_id: str
    doc2_id: str
    summary: str
    changes: list[ComparisonItem] = Field(default_factory=list)
    created_at: datetime
