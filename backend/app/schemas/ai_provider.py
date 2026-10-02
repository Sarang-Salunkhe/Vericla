from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models import ComparisonChangeType, ReviewSignalCategory, UncertaintyState


class ProviderOutputModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class ProviderEvidence(ProviderOutputModel):
    document_id: str | None = None
    chunk_id: str | None = None
    page_numbers: list[int] = Field(default_factory=list)
    start_offset: int = 0
    end_offset: int = 0
    excerpt: str | None = None
    section: str | None = None


class ProviderClause(ProviderOutputModel):
    title: str = Field(min_length=1)
    text: str = Field(min_length=1)
    evidence: list[ProviderEvidence] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"


class ProviderObligation(ProviderOutputModel):
    party: str = Field(min_length=1)
    description: str = Field(min_length=1)
    evidence: list[ProviderEvidence] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"


class ProviderDate(ProviderOutputModel):
    label: str = Field(min_length=1)
    date_text: str = Field(min_length=1)
    evidence: list[ProviderEvidence] = Field(default_factory=list)


class ProviderReviewSignal(ProviderOutputModel):
    category: ReviewSignalCategory
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    evidence: list[ProviderEvidence] = Field(default_factory=list)


class AnalysisProviderOutput(ProviderOutputModel):
    summary: str = Field(min_length=1)
    document_type: str | None = None
    parties: list[str] = Field(default_factory=list)
    clauses: list[ProviderClause] = Field(default_factory=list)
    obligations: list[ProviderObligation] = Field(default_factory=list)
    dates: list[ProviderDate] = Field(default_factory=list)
    review_signals: list[ProviderReviewSignal] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)


class QAProviderOutput(ProviderOutputModel):
    simple_answer: str = Field(min_length=1)
    evidence: list[ProviderEvidence] = Field(default_factory=list)
    uncertainty: UncertaintyState
    not_stated: str | None = None


class ProviderComparisonItem(ProviderOutputModel):
    category: str = Field(min_length=1)
    change_type: ComparisonChangeType
    description: str = Field(min_length=1)
    doc1_evidence: list[ProviderEvidence] = Field(default_factory=list)
    doc2_evidence: list[ProviderEvidence] = Field(default_factory=list)


class CompareProviderOutput(ProviderOutputModel):
    summary: str = Field(min_length=1)
    changes: list[ProviderComparisonItem]
