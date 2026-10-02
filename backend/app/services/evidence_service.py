import re
from typing import Any, Sequence

from app.models import Document, DocumentChunk, EvidenceReference


class EvidenceVerificationService:
    """Independent Anti-Hallucination verification service for evidence citations."""

    def verify_evidence_references(
        self,
        raw_references: Sequence[dict[str, Any] | EvidenceReference],
        document: Document,
        chunks: Sequence[DocumentChunk],
    ) -> list[EvidenceReference]:
        if not raw_references or not chunks:
            return []

        chunk_map: dict[str, DocumentChunk] = {c.chunk_id: c for c in chunks}
        verified: list[EvidenceReference] = []

        for ref in raw_references:
            if isinstance(ref, EvidenceReference):
                ref_dict = ref.model_dump()
            else:
                ref_dict = dict(ref)

            chunk_id = ref_dict.get("chunk_id", "")
            excerpt = ref_dict.get("excerpt")
            start_offset = ref_dict.get("start_offset", 0)
            end_offset = ref_dict.get("end_offset", 0)

            if ref_dict.get("document_id") not in {None, document.document_id}:
                continue

            chunk = chunk_map.get(chunk_id)
            if chunk is None:
                continue

            if excerpt:
                if not isinstance(excerpt, str):
                    continue
                found_offset = document.normalized_text.find(excerpt)
                if found_offset != -1:
                    start_offset = found_offset
                    end_offset = found_offset + len(excerpt)
                    chunk = next(
                        (
                            c
                            for c in chunks
                            if c.start_offset <= start_offset
                            and end_offset <= c.end_offset
                        ),
                        None,
                    )
                else:
                    # Unresolvable fabricated excerpt -> skip unverified citation
                    continue
            else:
                if (
                    not isinstance(start_offset, int)
                    or not isinstance(end_offset, int)
                    or start_offset < chunk.start_offset
                    or end_offset > chunk.end_offset
                    or end_offset <= start_offset
                ):
                    continue

            if chunk is None or start_offset < chunk.start_offset or end_offset > chunk.end_offset:
                continue

            canonical_excerpt = document.normalized_text[start_offset:end_offset]
            if not canonical_excerpt:
                continue

            verified.append(
                EvidenceReference(
                    document_id=document.document_id,
                    chunk_id=chunk.chunk_id,
                    page_numbers=chunk.page_numbers,
                    start_offset=start_offset,
                    end_offset=end_offset,
                    excerpt=canonical_excerpt,
                )
            )

        return verified

    def claim_is_anchored(
        self,
        claim: str,
        evidence: Sequence[EvidenceReference],
        source_chunks: Sequence[DocumentChunk] = (),
    ) -> bool:
        if not claim.strip() or not evidence:
            return False

        chunks_by_id = {chunk.chunk_id: chunk for chunk in source_chunks}
        evidence_text = " ".join(
            chunks_by_id[reference.chunk_id].text
            if reference.chunk_id in chunks_by_id
            else reference.excerpt or ""
            for reference in evidence
        ).casefold()
        claim_tokens = self._content_tokens(claim)
        evidence_tokens = self._content_tokens(evidence_text)
        distinctive_tokens = {token for token in claim_tokens if len(token) >= 6}
        if (
            not claim_tokens.intersection(evidence_tokens)
            or not distinctive_tokens.issubset(evidence_tokens)
        ):
            return False

        claim_numbers = {int(value) for value in re.findall(r"\d+", claim)}
        evidence_numbers = {int(value) for value in re.findall(r"\d+", evidence_text)}
        if not claim_numbers.issubset(evidence_numbers):
            return False

        for currency in "$£€":
            if currency in claim and currency not in evidence_text:
                return False

        return True

    def anchor_claim_evidence(
        self,
        claim: str,
        evidence: Sequence[EvidenceReference],
        source_chunks: Sequence[DocumentChunk],
    ) -> list[EvidenceReference]:
        if self.claim_is_anchored(claim, evidence):
            return list(evidence)
        if not self.claim_is_anchored(claim, evidence, source_chunks):
            return []

        chunks_by_id = {chunk.chunk_id: chunk for chunk in source_chunks}
        expanded: list[EvidenceReference] = []
        for reference in evidence:
            chunk = chunks_by_id.get(reference.chunk_id)
            if chunk is None:
                continue
            expanded.append(
                EvidenceReference(
                    document_id=chunk.document_id,
                    chunk_id=chunk.chunk_id,
                    page_numbers=chunk.page_numbers,
                    start_offset=chunk.start_offset,
                    end_offset=chunk.end_offset,
                    excerpt=chunk.text,
                )
            )

        if not self.claim_is_anchored(claim, expanded):
            return []
        return expanded

    @staticmethod
    def _content_tokens(text: str) -> set[str]:
        stop_words = {
            "a", "about", "added", "advance", "also", "an", "and", "agreement", "are", "as", "be",
            "been", "being", "before", "between", "both", "by", "can", "change", "changed",
            "changes", "clause", "clauses", "compared", "could", "date", "dates", "described", "did", "do",
            "does", "document", "either", "for", "from", "general", "has", "have",
            "in", "into", "is", "it", "its", "may", "modified", "modifies", "not", "of",
            "on", "or", "party", "parties", "period", "prior", "provided", "provides",
            "renewal", "requirement", "requirements", "required", "requires", "requiring",
            "removed", "review", "rights", "same", "shall", "should", "shows", "specified",
            "specific", "states", "stated", "terms", "that", "the", "their", "this", "to",
            "terminate", "under", "unchanged", "upon", "was", "were", "will", "with", "would",
            "yes",
        }
        tokens = set(re.findall(r"[a-z0-9]+", text.casefold())) - stop_words
        normalized: set[str] = set()
        for token in tokens:
            if token in {"termination", "terminates", "terminated", "terminating"}:
                token = "terminate"
            elif token == "solicitation":
                token = "solicit"
            elif token in {"payment", "payments"}:
                token = "pay"
            elif token == "monthly":
                token = "month"
            elif token.endswith("ies") and len(token) > 4:
                token = token[:-3] + "y"
            elif token.endswith("s") and len(token) > 4:
                token = token[:-1]
            if token not in stop_words:
                normalized.add(token)
        return normalized


_evidence_verification_service = EvidenceVerificationService()


def get_evidence_verification_service() -> EvidenceVerificationService:
    return _evidence_verification_service
