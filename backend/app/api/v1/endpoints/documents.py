from typing import Annotated

from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import JSONResponse

from app.schemas.documents import DocumentMetadataResponse
from app.services.document_processing import DocumentProcessingError
from app.services.document_service import get_document_service

router = APIRouter()


@router.post(
    "/documents",
    response_model=DocumentMetadataResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: Annotated[UploadFile, File(description="A PDF or UTF-8 text document")],
) -> DocumentMetadataResponse | JSONResponse:
    service = get_document_service()
    try:
        content = await file.read(service._settings.max_upload_size_bytes + 1)
        document = service.create_document(file.filename or "", file.content_type, content)
    except DocumentProcessingError as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})
    finally:
        await file.close()

    return DocumentMetadataResponse.from_document(document)


@router.get("/documents/{document_id}", response_model=DocumentMetadataResponse)
async def get_document_metadata(document_id: str) -> DocumentMetadataResponse | JSONResponse:
    document = get_document_service().get_document(document_id)
    if document is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Document session was not found."},
        )
    return DocumentMetadataResponse.from_document(document)
