from datetime import UTC, datetime
import re
from uuid import uuid4

from app.models import ComparisonItem, CompareResult, Document, DocumentChunk
from app.schemas.ai_provider import CompareProviderOutput
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

_COMPARISON_LANGUAGE = re.compile(
    r"\b(?:change(?:s|d)?|increase(?:s|d|ing)?|decrease(?:s|d|ing)?|"
    r"rise|rises|rose|rising|fall|falls|fell|falling|raise(?:s|d|ing)?|"
    r"lower(?:s|ed|ing)?|higher|greater|less|more|fewer|from|to|versus|vs\.?|"
    r"go(?:es)?|went|up|down)\b",
    re.IGNORECASE,
)
_VALUE_TRANSITION = re.compile(
    r"(?P<before>(?:[$£€]\s*)?\d[\d,]*(?:\.\d+)?(?:\s+[A-Za-z][A-Za-z-]*){0,2})\s*"
    r"(?:→|->|\bto\b)\s*"
    r"(?P<after>(?:[$£€]\s*)?\d[\d,]*(?:\.\d+)?(?:\s+[A-Za-z][A-Za-z-]*){0,2})",
    re.IGNORECASE,
)
_NUMERIC_VALUE = re.compile(
    r"(?<![\w.])(?:[$£€]\s*)?(\d[\d,]*(?:\.\d+)?)(?!\w|\.(?=\d))"
)
_LABELED_VALUE = re.compile(
    r"^\s*(?P<label>[^:\r\n]{1,80}?)\s*:\s*(?P<value>[^:\r\n]+?)\s*[.;]?\s*$"
)


def _comparison_claim_text(claim: str) -> str:
    return _COMPARISON_LANGUAGE.sub(" ", claim)


def _normalized_number(value: str) -> str:
    return value.replace(",", "").replace("$", "").replace("£", "").replace("€", "").strip()


def _contains_number(text: str, value: str) -> bool:
    number = _NUMERIC_VALUE.search(value)
    if number is None:
        return False
    expected = _normalized_number(number.group(0))
    return any(_normalized_number(match.group(0)) == expected for match in _NUMERIC_VALUE.finditer(text))


def _normalized_label(label: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", label.casefold()))


def _labeled_values(
    document: Document,
    chunks: list[DocumentChunk],
) -> dict[str, tuple[str, str, dict[str, object]]]:
    values: dict[str, tuple[str, str, dict]] = {}
    duplicate_labels: set[str] = set()
    offset = 0

    for source_line in document.normalized_text.splitlines(keepends=True):
        line = source_line.rstrip("\r\n")
        match = _LABELED_VALUE.fullmatch(line)
        if match is not None:
            label = match.group("label").strip()
            value = match.group("value").strip().rstrip(".;").strip()
            normalized_label = _normalized_label(label)
            if label and value and normalized_label and re.search(r"[a-z]", normalized_label):
                start_offset = offset + len(line) - len(line.lstrip())
                end_offset = offset + len(line.rstrip())
                chunk = next(
                    (
                        item
                        for item in chunks
                        if item.start_offset <= start_offset and end_offset <= item.end_offset
                    ),
                    None,
                )
                if chunk is not None:
                    reference = {
                        "document_id": document.document_id,
                        "chunk_id": chunk.chunk_id,
                        "page_numbers": chunk.page_numbers,
                        "start_offset": start_offset,
                        "end_offset": end_offset,
                        "excerpt": document.normalized_text[start_offset:end_offset],
                    }
                    if normalized_label in values:
                        duplicate_labels.add(normalized_label)
                    else:
                        values[normalized_label] = (label, value, reference)
        offset += len(source_line)

    for normalized_label in duplicate_labels:
        values.pop(normalized_label, None)
    return values


def _labeled_value_changes(
    doc1: Document,
    chunks1: list[DocumentChunk],
    doc2: Document,
    chunks2: list[DocumentChunk],
) -> list[dict[str, object]]:
    values1 = _labeled_values(doc1, chunks1)
    values2 = _labeled_values(doc2, chunks2)
    changes = []

    for normalized_label in values1.keys() & values2.keys():
        label1, value1, evidence1 = values1[normalized_label]
        _, value2, evidence2 = values2[normalized_label]
        if value1.casefold() == value2.casefold():
            continue
        changes.append(
            {
                "category": label1,
                "change_type": "MODIFIED",
                "description": f"{label1} changed from {value1} to {value2}.",
                "doc1_evidence": [evidence1],
                "doc2_evidence": [evidence2],
            }
        )
    return changes


def _transition_matches_document_order(
    description: str,
    doc1_evidence: list,
    doc2_evidence: list,
) -> bool:
    transition = _VALUE_TRANSITION.search(description)
    if transition is None:
        return True

    doc1_text = " ".join(reference.excerpt or "" for reference in doc1_evidence)
    doc2_text = " ".join(reference.excerpt or "" for reference in doc2_evidence)
    before = transition.group("before")
    after = transition.group("after")
    if not _contains_number(doc1_text, before) or not _contains_number(doc2_text, after):
        return False

    for value, source_text in ((before, doc1_text), (after, doc2_text)):
        currency = next((symbol for symbol in "$£€" if symbol in value), None)
        if currency and currency not in source_text:
            return False
    return True


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
            raw_output = validate_provider_output(
                CompareProviderOutput,
                self._ai_provider.compare(prompt, context),
            )
        except AIProviderError as exc:
            raise DocumentProcessingError(exc.status_code, exc.message) from None
        except Exception:
            raise DocumentProcessingError(500, "AI provider comparison failed.") from None

        verified_changes: list[ComparisonItem] = []
        verified_categories: set[str] = set()
        candidate_changes = [
            *raw_output["changes"],
            *_labeled_value_changes(doc1, chunks1, doc2, chunks2),
        ]
        for change in candidate_changes:
            category_key = _normalized_label(change["category"])
            if category_key in verified_categories:
                continue

            v_doc1_ev = self._evidence_service.verify_evidence_references(
                change["doc1_evidence"], doc1, chunks1
            )
            v_doc2_ev = self._evidence_service.verify_evidence_references(
                change["doc2_evidence"], doc2, chunks2
            )

            if change["change_type"] == "ADDED":
                supporting_evidence = v_doc2_ev
                supporting_chunks = chunks2
            elif change["change_type"] == "REMOVED":
                supporting_evidence = v_doc1_ev
                supporting_chunks = chunks1
            else:
                if not v_doc1_ev or not v_doc2_ev:
                    continue
                if not self._evidence_service.claim_is_anchored(
                    change["category"], v_doc1_ev, chunks1
                ) or not self._evidence_service.claim_is_anchored(
                    change["category"], v_doc2_ev, chunks2
                ):
                    continue
                if not _transition_matches_document_order(
                    change["description"], v_doc1_ev, v_doc2_ev
                ):
                    continue
                supporting_evidence = [*v_doc1_ev, *v_doc2_ev]
                supporting_chunks = [*chunks1, *chunks2]

            supporting_evidence = self._evidence_service.anchor_claim_evidence(
                _comparison_claim_text(f"{change['category']} {change['description']}"),
                supporting_evidence,
                supporting_chunks,
            )
            if not supporting_evidence:
                continue

            if change["change_type"] == "ADDED":
                v_doc2_ev = supporting_evidence
            elif change["change_type"] == "REMOVED":
                v_doc1_ev = supporting_evidence
            else:
                v_doc1_ev = [
                    reference
                    for reference in supporting_evidence
                    if reference.document_id == doc1.document_id
                ]
                v_doc2_ev = [
                    reference
                    for reference in supporting_evidence
                    if reference.document_id == doc2.document_id
                ]

            verified_changes.append(
                ComparisonItem(
                    category=change["category"],
                    change_type=change["change_type"],
                    description=change["description"],
                    doc1_evidence=v_doc1_ev,
                    doc2_evidence=v_doc2_ev,
                )
            )
            verified_categories.add(category_key)

        summary = raw_output["summary"]
        if not verified_changes:
            summary = "No supported changes were identified in the cited document text."
        elif not self._evidence_service.claim_is_anchored(
            _comparison_claim_text(summary),
            [
                reference
                for change in verified_changes
                for reference in [*change.doc1_evidence, *change.doc2_evidence]
            ],
            [*chunks1, *chunks2],
        ):
            summary = "Comparison includes only changes supported by the cited document text."

        return CompareResult(
            compare_id=uuid4().hex,
            doc1_id=doc1_id,
            doc2_id=doc2_id,
            summary=summary,
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
