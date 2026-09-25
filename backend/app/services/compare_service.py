from datetime import UTC, datetime
from uuid import uuid4

from app.models import ComparisonItem, CompareResult
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


class CompareService:
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

    def compare_documents(self, doc1_id: str, doc2_id: str) -> CompareResult:
        doc1 = self._doc_service.get_document(doc1_id)
        chunks1 = self._doc_service.get_chunks(doc1_id)
        doc2 = self._doc_service.get_document(doc2_id)
        chunks2 = self._doc_service.get_chunks(doc2_id)

        if doc1 is None or chunks1 is None or doc2 is None or chunks2 is None:
            raise DocumentProcessingError(404, "One or both document sessions were not found.")

        selected1 = self._context_service.select_context(chunks1)
        selected2 = self._context_service.select_context(chunks2)

        prompt = PromptBuilder.build_compare_prompt(selected1, selected2)

        context = {
            "doc1_id": doc1_id,
            "doc1_text": doc1.normalized_text,
            "doc1_chunks": selected1,
            "doc2_id": doc2_id,
            "doc2_text": doc2.normalized_text,
            "doc2_chunks": selected2,
        }

        try:
            raw_output = self._ai_provider.compare(prompt, context)
        except Exception as exc:
            raise DocumentProcessingError(500, "AI provider comparison failed.") from exc

        verified_changes: list[ComparisonItem] = []
        for change in raw_output.get("changes", []):
            v_doc1_ev = self._evidence_service.verify_evidence_references(
                change.get("doc1_evidence", []), doc1, chunks1
            )
            v_doc2_ev = self._evidence_service.verify_evidence_references(
                change.get("doc2_evidence", []), doc2, chunks2
            )

            verified_changes.append(
                ComparisonItem(
                    category=change.get("category", "General"),
                    change_type=change.get("change_type", "MODIFIED"),
                    description=change.get("description", ""),
                    doc1_evidence=v_doc1_ev,
                    doc2_evidence=v_doc2_ev,
                )
            )

        return CompareResult(
            compare_id=uuid4().hex,
            doc1_id=doc1_id,
            doc2_id=doc2_id,
            summary=raw_output.get("summary", "Document comparison summary."),
            changes=verified_changes,
            created_at=datetime.now(UTC),
        )


_compare_service = CompareService(
    get_document_service(),
    get_ai_provider(),
    get_context_selection_service(),
    get_evidence_verification_service(),
)


def get_compare_service() -> CompareService:
    return _compare_service
