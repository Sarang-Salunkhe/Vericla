from fastapi import APIRouter, status

from app.schemas.analysis import AnalysisRequest, AnalysisResponse

router = APIRouter()


@router.post(
    "/analysis",
    response_model=AnalysisResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def analyze_document(payload: AnalysisRequest) -> AnalysisResponse:
    """Accept the Stage 1 JSON contract without processing document content."""

    response = AnalysisResponse(
        status="not_available",
        message="Document analysis is not available yet.",
    )
    return response
