from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.schemas.compare import CompareCreateRequest, CompareResponse
from app.services.compare_service import get_compare_service
from app.services.document_processing import DocumentProcessingError

router = APIRouter()


@router.post(
    "/compare",
    response_model=CompareResponse,
    status_code=status.HTTP_200_OK,
)
async def compare_documents(payload: CompareCreateRequest) -> CompareResponse | JSONResponse:
    service = get_compare_service()
    try:
        result = service.compare_documents(payload.doc1_id, payload.doc2_id)
    except DocumentProcessingError as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    return CompareResponse.model_validate(result.model_dump())
