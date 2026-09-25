from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.schemas.qa import QACreateRequest, QAResponse
from app.services.document_processing import DocumentProcessingError
from app.services.qa_service import get_qa_service

router = APIRouter()


@router.post(
    "/qa",
    response_model=QAResponse,
    status_code=status.HTTP_200_OK,
)
async def answer_question(payload: QACreateRequest) -> QAResponse | JSONResponse:
    service = get_qa_service()
    try:
        result = service.answer_question(payload.document_id, payload.question)
    except DocumentProcessingError as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    return QAResponse.model_validate(result.model_dump())
