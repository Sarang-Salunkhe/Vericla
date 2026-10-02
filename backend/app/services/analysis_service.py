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
from app.schemas.ai_provider import AnalysisProviderOutput
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
            raw_output = validate_provider_output(
                AnalysisProviderOutput,
                self._ai_provider.analyze(prompt, context),
            )
        except AIProviderError as exc:
            raise DocumentProcessingError(exc.status_code, exc.message) from None
        except Exception:
            raise DocumentProcessingError(500, "AI provider analysis failed.") from None

        # Verify evidence for clauses
        clauses = []
        for c in raw_output["clauses"]:
            verified_ev = self._evidence_service.verify_evidence_references(
                c["evidence"], doc, chunks
            )
            verified_ev = self._evidence_service.anchor_claim_evidence(
                f"{c['title']} {c['text']}", verified_ev, chunks
            )
            if not verified_ev:
                continue
            clauses.append(
                ClauseInsight(
                    title=c["title"],
                    text=c["text"],
                    evidence=verified_ev,
                    uncertainty=c["uncertainty"],
                )
            )

        # Verify evidence for obligations
        obligations = []
        for o in raw_output["obligations"]:
            verified_ev = self._evidence_service.verify_evidence_references(
                o["evidence"], doc, chunks
            )
            verified_ev = self._evidence_service.anchor_claim_evidence(
                o["description"], verified_ev, chunks
            )
            if not verified_ev:
                continue
            obligations.append(
                ObligationItem(
                    party=o["party"],
                    description=o["description"],
                    evidence=verified_ev,
                    uncertainty=o["uncertainty"],
                )
            )

        # Verify evidence for dates
        dates = []
        for d in raw_output["dates"]:
            verified_ev = self._evidence_service.verify_evidence_references(
                d["evidence"], doc, chunks
            )
            verified_ev = self._evidence_service.anchor_claim_evidence(
                f"{d['label']} {d['date_text']}", verified_ev, chunks
            )
            if not verified_ev:
                continue
            dates.append(
                ImportantDate(
                    label=d["label"],
                    date_text=d["date_text"],
                    evidence=verified_ev,
                )
            )

        # Verify evidence for review signals
        review_signals = []
        for rs in raw_output["review_signals"]:
            verified_ev = self._evidence_service.verify_evidence_references(
                rs["evidence"], doc, chunks
            )
            verified_ev = self._evidence_service.anchor_claim_evidence(
                f"{rs['title']} {rs['description']}", verified_ev, chunks
            )
            if not verified_ev:
                continue
            review_signals.append(
                ReviewSignal(
                    category=rs["category"],
                    title=rs["title"],
                    description=rs["description"],
                    evidence=verified_ev,
                )
            )

        all_evidence = [
            reference
            for item in [*clauses, *obligations, *dates, *review_signals]
            for reference in item.evidence
        ]
        summary = raw_output["summary"]
        if not self._evidence_service.claim_is_anchored(summary, all_evidence, chunks):
            summary = "No document claims could be verified against the supplied source evidence."

        analysis_id = uuid4().hex
        now = datetime.now(UTC)
        result = AnalysisResult(
            analysis_id=analysis_id,
            document_id=document_id,
            role=role,
            summary=summary,
            document_type=doc.document_type,
            parties=[
                party
                for party in raw_output["parties"]
                if party.casefold() in doc.normalized_text.casefold()
            ],
            clauses=clauses,
            obligations=obligations,
            dates=dates,
            review_signals=review_signals,
            questions=raw_output["questions"],
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
