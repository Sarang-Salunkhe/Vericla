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

            chunk = chunk_map.get(chunk_id)

            if excerpt:
                found_offset = document.normalized_text.find(excerpt)
                if found_offset != -1:
                    start_offset = found_offset
                    end_offset = found_offset + len(excerpt)
                    chunk = next(
                        (c for c in chunks if c.start_offset <= start_offset < c.end_offset),
                        chunk or chunks[0],
                    )
                else:
                    # Unresolvable fabricated excerpt -> skip unverified citation
                    continue

            if chunk is None:
                if start_offset < len(document.normalized_text):
                    chunk = next(
                        (c for c in chunks if c.start_offset <= start_offset < c.end_offset),
                        chunks[0],
                    )
                else:
                    continue

            # Ensure offsets fall within document text bounds
            start_offset = max(0, min(start_offset, len(document.normalized_text)))
            end_offset = max(start_offset, min(end_offset, len(document.normalized_text)))

            verified.append(
                EvidenceReference(
                    document_id=document.document_id,
                    chunk_id=chunk.chunk_id,
                    page_numbers=chunk.page_numbers,
                    start_offset=start_offset,
                    end_offset=end_offset,
                    excerpt=excerpt,
                )
            )

        return verified


_evidence_verification_service = EvidenceVerificationService()


def get_evidence_verification_service() -> EvidenceVerificationService:
    return _evidence_verification_service
