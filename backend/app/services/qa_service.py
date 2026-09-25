from datetime import UTC, datetime
from uuid import uuid4

from app.models import QAResult
from app.services.ai_provider import AIProvider, get_ai_provider
from app.services.context_selection import (
    ContextSelectionService,
    get_context_selection_service,
)
from app.services.document_processing import DocumentProcessingError
from app.services.document_service import DocumentService, get_document_service
from app.services.evidence_service import (
    EvidenceVerificationService,
    get_evidence_verification_service,
)
from app.services.prompt_builder import PromptBuilder


class QAService:
    def __init__(
        self,
        doc_service: DocumentService,
        ai_provider: AIProvider,
        context_service: ContextSelectionService,
        evidence_service: EvidenceVerificationService,
    ) -> None:
        self._doc_service = doc_service
        self._ai_provider = ai_provider
        self._context_service = context_service
        self._evidence_service = evidence_service

    def answer_question(self, document_id: str, question: str) -> QAResult:
        doc = self._doc_service.get_document(document_id)
        chunks = self._doc_service.get_chunks(document_id)
        if doc is None or chunks is None:
            raise DocumentProcessingError(404, "Document session was not found.")

        selected_chunks = self._context_service.select_context(chunks, query=question)
        prompt = PromptBuilder.build_qa_prompt(selected_chunks, question)

        context = {
            "document_id": document_id,
            "document_text": doc.normalized_text,
            "question": question,
            "chunks": selected_chunks,
        }

        try:
            raw_output = self._ai_provider.answer_question(prompt, context)
        except Exception as exc:
            raise DocumentProcessingError(500, "AI provider Q&A failed.") from exc

        raw_ev = raw_output.get("evidence", [])
        verified_ev = self._evidence_service.verify_evidence_references(raw_ev, doc, chunks)

        uncertainty = raw_output.get("uncertainty", "SUPPORTED")
        if not verified_ev and uncertainty == "SUPPORTED":
            uncertainty = "NOT_FOUND"

        return QAResult(
            qa_id=uuid4().hex,
            document_id=document_id,
            question=question,
            simple_answer=raw_output.get("simple_answer", "No answer could be generated."),
            evidence=verified_ev,
            uncertainty=uncertainty,
            not_stated=raw_output.get("not_stated"),
            created_at=datetime.now(UTC),
        )


_qa_service = QAService(
    get_document_service(),
    get_ai_provider(),
    get_context_selection_service(),
    get_evidence_verification_service(),
)


def get_qa_service() -> QAService:
    return _qa_service
