from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    document_text: str = Field(min_length=1, max_length=100_000)


class AnalysisResponse(BaseModel):
    status: Literal["not_available"]
    message: str
