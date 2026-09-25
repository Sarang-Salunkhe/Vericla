from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.config import get_settings
from app.models import (
    AnalysisResult,
    ClauseInsight,
    ImportantDate,
    ObligationItem,
    ReviewSignal,
    UserRole,
)
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


class InMemoryAnalysisStore:
    def __init__(self) -> None:
        self._analyses: dict[str, AnalysisResult] = {}

    def put(self, analysis: AnalysisResult) -> None:
        self._analyses[analysis.analysis_id] = analysis

    def get(self, analysis_id: str) -> AnalysisResult | None:
        analysis = self._analyses.get(analysis_id)
        if analysis is None:
            return None
        if analysis.expires_at <= datetime.now(UTC):
            self._analyses.pop(analysis_id, None)
            return None
        return analysis


class AnalysisService:
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
        self._store = InMemoryAnalysisStore()
        self._settings = get_settings()

    def create_analysis(
        self,
        document_id: str,
        role: UserRole = "General Analysis",
    ) -> AnalysisResult:
        doc = self._doc_service.get_document(document_id)
        chunks = self._doc_service.get_chunks(document_id)
        if doc is None or chunks is None:
            raise DocumentProcessingError(404, "Document session was not found.")

        selected_chunks = self._context_service.select_context(chunks, role=role)
        prompt = PromptBuilder.build_analysis_prompt(selected_chunks, role=role)

        context = {
            "document_id": document_id,
            "document_text": doc.normalized_text,
            "document_type": doc.document_type,
            "role": role,
            "chunks": selected_chunks,
        }

        try:
            raw_output = self._ai_provider.analyze(prompt, context)
        except Exception as exc:
            raise DocumentProcessingError(500, "AI provider analysis failed.") from exc

        # Verify evidence for clauses
        clauses = []
        for c in raw_output.get("clauses", []):
            verified_ev = self._evidence_service.verify_evidence_references(
                c.get("evidence", []), doc, chunks
            )
            clauses.append(
                ClauseInsight(
                    title=c.get("title", "Clause"),
                    text=c.get("text", ""),
                    evidence=verified_ev,
                    uncertainty=c.get("uncertainty", "SUPPORTED"),
                )
            )

        # Verify evidence for obligations
        obligations = []
        for o in raw_output.get("obligations", []):
            verified_ev = self._evidence_service.verify_evidence_references(
                o.get("evidence", []), doc, chunks
            )
            obligations.append(
                ObligationItem(
                    party=o.get("party", "Party"),
                    description=o.get("description", ""),
                    evidence=verified_ev,
                    uncertainty=o.get("uncertainty", "SUPPORTED"),
                )
            )

        # Verify evidence for dates
        dates = []
        for d in raw_output.get("dates", []):
            verified_ev = self._evidence_service.verify_evidence_references(
                d.get("evidence", []), doc, chunks
            )
            dates.append(
                ImportantDate(
                    label=d.get("label", "Date"),
                    date_text=d.get("date_text", ""),
                    evidence=verified_ev,
                )
            )

        # Verify evidence for review signals
        review_signals = []
        for rs in raw_output.get("review_signals", []):
            verified_ev = self._evidence_service.verify_evidence_references(
                rs.get("evidence", []), doc, chunks
            )
            review_signals.append(
                ReviewSignal(
                    category=rs.get("category", "review"),
                    title=rs.get("title", "Review Item"),
                    description=rs.get("description", ""),
                    evidence=verified_ev,
                )
            )

        analysis_id = uuid4().hex
        now = datetime.now(UTC)
        result = AnalysisResult(
            analysis_id=analysis_id,
            document_id=document_id,
            role=role,
            summary=raw_output.get("summary", "Document Analysis Summary"),
            document_type=doc.document_type,
            parties=raw_output.get("parties", []),
            clauses=clauses,
            obligations=obligations,
            dates=dates,
            review_signals=review_signals,
            questions=raw_output.get("questions", []),
            created_at=now,
            expires_at=now + timedelta(seconds=self._settings.document_session_ttl_seconds),
        )

        self._store.put(result)
        return result

    def get_analysis(self, analysis_id: str) -> AnalysisResult | None:
        return self._store.get(analysis_id)


_analysis_service = AnalysisService(
    get_document_service(),
    get_ai_provider(),
    get_context_selection_service(),
    get_evidence_verification_service(),
)


def get_analysis_service() -> AnalysisService:
    return _analysis_service
