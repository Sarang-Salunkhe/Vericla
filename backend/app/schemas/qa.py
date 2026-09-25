from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models import EvidenceReference, UncertaintyState


class QACreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    document_id: str = Field(min_length=1)
    question: str = Field(min_length=1, max_length=1000)


class QAResponse(BaseModel):
    qa_id: str
    document_id: str
    question: str
    simple_answer: str
    evidence: list[EvidenceReference] = Field(default_factory=list)
    uncertainty: UncertaintyState = "SUPPORTED"
    not_stated: str | None = None
    created_at: datetime
