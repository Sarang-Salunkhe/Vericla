from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models import (
    ClauseInsight,
    ImportantDate,
    ObligationItem,
    ReviewSignal,
    UserRole,
)


class AnalysisCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    document_id: str = Field(min_length=1)
    role: UserRole = Field(default="General Analysis")


# Backward compatibility for Stage 1 JSON test contract
class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    document_text: str = Field(min_length=1, max_length=100_000)


class Stage1AnalysisResponse(BaseModel):
    status: str
    message: str


class AnalysisResponse(BaseModel):
    analysis_id: str
    document_id: str
    role: UserRole
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
