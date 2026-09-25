from typing import Any

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisResponse,
    Stage1AnalysisResponse,
)
from app.services.analysis_service import get_analysis_service
from app.services.document_processing import DocumentProcessingError

router = APIRouter()


@router.post(
    "/analysis",
    response_model=AnalysisResponse | Stage1AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        501: {"description": "Document analysis is not available yet."},
    },
)
async def analyze_document(
    request: Request,
) -> AnalysisResponse | JSONResponse | Stage1AnalysisResponse:
    try:
        body: dict[str, Any] = await request.json()
    except Exception:
        return JSONResponse(status_code=422, content={"detail": "Request validation failed."})

    # Stage 1 backward compatibility check
    if "document_text" in body and "document_id" not in body:
        doc_text = body.get("document_text")
        if (
            not isinstance(doc_text, str)
            or not doc_text.strip()
            or len(body) > 1
        ):
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": "Request validation failed."},
            )
        return JSONResponse(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            content={
                "status": "not_available",
                "message": "Document analysis is not available yet.",
            },
        )

    try:
        payload = AnalysisCreateRequest.model_validate(body)
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Request validation failed."},
        )

    service = get_analysis_service()
    try:
        result = service.create_analysis(payload.document_id, role=payload.role)
    except DocumentProcessingError as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    return AnalysisResponse.model_validate(result.model_dump())


@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_result(analysis_id: str) -> AnalysisResponse | JSONResponse:
    result = get_analysis_service().get_analysis(analysis_id)
    if result is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Analysis session was not found."},
        )
    return AnalysisResponse.model_validate(result.model_dump())
