from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models import ComparisonItem


class CompareCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    doc1_id: str = Field(min_length=1)
    doc2_id: str = Field(min_length=1)


class CompareResponse(BaseModel):
    compare_id: str
    doc1_id: str
    doc2_id: str
    summary: str
    changes: list[ComparisonItem] = Field(default_factory=list)
    created_at: datetime
