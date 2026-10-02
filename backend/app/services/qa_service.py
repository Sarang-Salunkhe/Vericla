from datetime import UTC, datetime
from uuid import uuid4

from app.models import QAResult
from app.schemas.ai_provider import QAProviderOutput
from app.services.ai_provider import (
    AIProvider,
    AIProviderError,
    get_ai_provider,
    validate_provider_output,
)
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
            raw_output = validate_provider_output(
                QAProviderOutput,
                self._ai_provider.answer_question(prompt, context),
            )
        except AIProviderError as exc:
            raise DocumentProcessingError(exc.status_code, exc.message) from None
        except Exception:
            raise DocumentProcessingError(500, "AI provider Q&A failed.") from None

        raw_ev = raw_output["evidence"]
        verified_ev = self._evidence_service.verify_evidence_references(raw_ev, doc, chunks)

        answer = raw_output["simple_answer"]
        uncertainty = raw_output["uncertainty"]
        not_stated = raw_output.get("not_stated")
        if uncertainty in {"NOT_FOUND", "UNSUPPORTED"}:
            answer = "The supplied document context does not state an answer to this question."
            not_stated = "No supporting statement was found in the selected document context."
            verified_ev = []
        elif uncertainty in {"SUPPORTED", "PARTIAL", "AMBIGUOUS"}:
            verified_ev = self._evidence_service.anchor_claim_evidence(
                answer, verified_ev, chunks
            )
            if not verified_ev:
                answer = "The supplied document does not contain verified evidence sufficient to answer this question."
                uncertainty = "NOT_FOUND"
                not_stated = "No verified source passage supported the generated answer."

        return QAResult(
            qa_id=uuid4().hex,
            document_id=document_id,
            question=question,
            simple_answer=answer,
            evidence=verified_ev,
            uncertainty=uncertainty,
            not_stated=not_stated,
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
