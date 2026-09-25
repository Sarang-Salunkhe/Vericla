from typing import Sequence

from app.models import DocumentChunk, UserRole

_ROLE_KEYWORDS: dict[UserRole, set[str]] = {
    "Tenant": {"rent", "lease", "deposit", "tenant", "landlord", "maintenance", "notice", "premises", "sublet"},
    "Employee": {"employment", "salary", "wage", "employee", "employer", "duties", "non-compete", "termination", "leave", "severance"},
    "Freelancer": {"contractor", "deliverable", "milestone", "payment", "ip", "intellectual property", "ownership", "invoicing"},
    "Customer": {"refund", "warranty", "liability", "cancellation", "subscription", "terms", "privacy", "data"},
    "Employer": {"employee", "compliance", "policy", "termination", "confidentiality", "restrictive covenant"},
    "Business Owner": {"indemnification", "governing law", "arbitration", "liability", "warranty", "breach", "assignment"},
    "Other": set(),
    "General Analysis": set(),
}


class ContextSelectionService:
    """Service to rank, score, and bound document context for AI prompt generation."""

    def __init__(self, max_context_chars: int = 50_000) -> None:
        self._max_context_chars = max_context_chars

    def select_context(
        self,
        chunks: Sequence[DocumentChunk],
        role: UserRole = "General Analysis",
        query: str | None = None,
    ) -> list[DocumentChunk]:
        if not chunks:
            return []

        role_keywords = _ROLE_KEYWORDS.get(role, set())
        query_keywords = set()
        if query:
            query_keywords = {word.lower() for word in query.split() if len(word) > 2}

        scored_chunks: list[tuple[float, int, DocumentChunk]] = []

        for index, chunk in enumerate(chunks):
            text_lower = chunk.text.lower()
            score = 0.0

            # Role relevance score
            for kw in role_keywords:
                if kw in text_lower:
                    score += 2.0

            # Query relevance score
            for qkw in query_keywords:
                if qkw in text_lower:
                    score += 3.0

            # Base score to preserve natural document order
            score += 0.1

            scored_chunks.append((score, index, chunk))

        # Sort by score descending, then by original index ascending
        scored_chunks.sort(key=lambda item: (-item[0], item[1]))

        selected: list[DocumentChunk] = []
        accumulated_chars = 0

        for _, _, chunk in scored_chunks:
            chunk_length = len(chunk.text)
            if accumulated_chars + chunk_length > self._max_context_chars and selected:
                break
            selected.append(chunk)
            accumulated_chars += chunk_length

        # Re-sort selected chunks by original offset to preserve document flow
        selected.sort(key=lambda c: c.start_offset)
        return selected


_context_selection_service = ContextSelectionService()


def get_context_selection_service() -> ContextSelectionService:
    return _context_selection_service
