from typing import Any, Protocol

from app.config import get_settings


class AIProvider(Protocol):
    """Vendor-agnostic AI Provider interface."""

    def analyze(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]: ...

    def answer_question(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]: ...

    def compare(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]: ...


class FakeAIProvider:
    """Deterministic, zero-network Fake AI Provider for testing and offline execution."""

    def analyze(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]:
        document_text = context.get("document_text", "").lower()
        role = context.get("role", "General Analysis")
        chunks = context.get("chunks", [])

        evidence_list = []
        if chunks:
            first_chunk = chunks[0]
            evidence_list.append(
                {
                    "document_id": first_chunk.document_id,
                    "chunk_id": first_chunk.chunk_id,
                    "page_numbers": first_chunk.page_numbers,
                    "start_offset": first_chunk.start_offset,
                    "end_offset": min(first_chunk.start_offset + 100, first_chunk.end_offset),
                    "excerpt": first_chunk.text[:100],
                }
            )

        parties = []
        if "between" in document_text or "party" in document_text or "landlord" in document_text:
            parties = ["Party A", "Party B"]

        clauses = []
        obligations = []
        review_signals = []
        dates = []

        if "confidential" in document_text:
            clauses.append(
                {
                    "title": "Confidentiality Clause",
                    "text": "The receiving party shall maintain strictly confidential treatment of disclosed information.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                }
            )

        if "terminate" in document_text or "termination" in document_text:
            clauses.append(
                {
                    "title": "Termination Clause",
                    "text": "Either party may terminate this agreement upon written notice.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                }
            )
            obligations.append(
                {
                    "party": "Terminating Party",
                    "description": "Must provide written notice prior to termination.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                }
            )

        if "rent" in document_text or "payment" in document_text or "deposit" in document_text:
            obligations.append(
                {
                    "party": "Payer / Tenant",
                    "description": "Shall remit payment on or before the due date specified.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                }
            )

        if "notice" in document_text:
            review_signals.append(
                {
                    "category": "attention",
                    "title": "Notice Requirement",
                    "description": "Review the specific notice period required for termination or renewal.",
                    "evidence": evidence_list,
                }
            )

        if not clauses:
            clauses.append(
                {
                    "title": "General Terms",
                    "text": "The document contains general binding terms and conditions.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                }
            )

        summary = f"Summary of document analyzed under {role} context."
        if role == "Tenant":
            summary += " Key focus on lease terms, rent payment, deposit, and termination notice."
        elif role == "Employee":
            summary += " Key focus on employment duties, compensation, non-compete, and termination."

        return {
            "summary": summary,
            "document_type": context.get("document_type", "txt"),
            "parties": parties,
            "clauses": clauses,
            "obligations": obligations,
            "dates": dates,
            "review_signals": review_signals,
            "questions": [
                "What is the effective start date?",
                "Are there any penalty fees for early termination?",
            ],
        }

    def answer_question(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]:
        question = context.get("question", "").strip().lower()
        document_text = context.get("document_text", "").lower()
        chunks = context.get("chunks", [])

        evidence_list = []
        if chunks:
            first_chunk = chunks[0]
            evidence_list.append(
                {
                    "document_id": first_chunk.document_id,
                    "chunk_id": first_chunk.chunk_id,
                    "page_numbers": first_chunk.page_numbers,
                    "start_offset": first_chunk.start_offset,
                    "end_offset": min(first_chunk.start_offset + 100, first_chunk.end_offset),
                    "excerpt": first_chunk.text[:100],
                }
            )

        if "swiss" in question or "arbitration" in question or "jurisdiction" in question:
            if "swiss" in document_text or "jurisdiction" in document_text:
                return {
                    "simple_answer": "Jurisdiction is specified in the document text.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                    "not_stated": None,
                }
            else:
                return {
                    "simple_answer": "The document does not state jurisdiction or arbitration procedures for this query.",
                    "evidence": [],
                    "uncertainty": "UNSUPPORTED",
                    "not_stated": "The document makes no mention of Swiss law or arbitration.",
                }

        if "terminate" in question or "termination" in question:
            if "terminate" in document_text or "termination" in document_text:
                return {
                    "simple_answer": "Yes, termination terms are specified in the agreement requiring advance written notice.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                    "not_stated": None,
                }
            else:
                return {
                    "simple_answer": "The document does not explicitly state termination conditions.",
                    "evidence": [],
                    "uncertainty": "NOT_FOUND",
                    "not_stated": "No termination clause was found in the text.",
                }

        if "pay" in question or "rent" in question or "fee" in question:
            if "pay" in document_text or "rent" in document_text or "fee" in document_text:
                return {
                    "simple_answer": "Payment obligations are outlined in the document text.",
                    "evidence": evidence_list,
                    "uncertainty": "SUPPORTED",
                    "not_stated": None,
                }
            else:
                return {
                    "simple_answer": "The document does not specify payment details.",
                    "evidence": [],
                    "uncertainty": "NOT_FOUND",
                    "not_stated": "No payment terms were identified in the document.",
                }

        return {
            "simple_answer": "Based on the document text, details regarding your query were found.",
            "evidence": evidence_list,
            "uncertainty": "SUPPORTED",
            "not_stated": None,
        }

    def compare(self, prompt: str, context: dict[str, Any]) -> dict[str, Any]:
        doc1_chunks = context.get("doc1_chunks", [])
        doc2_chunks = context.get("doc2_chunks", [])

        doc1_evidence = []
        if doc1_chunks:
            c = doc1_chunks[0]
            doc1_evidence.append(
                {
                    "document_id": c.document_id,
                    "chunk_id": c.chunk_id,
                    "page_numbers": c.page_numbers,
                    "start_offset": c.start_offset,
                    "end_offset": min(c.start_offset + 50, c.end_offset),
                    "excerpt": c.text[:50],
                }
            )

        doc2_evidence = []
        if doc2_chunks:
            c = doc2_chunks[0]
            doc2_evidence.append(
                {
                    "document_id": c.document_id,
                    "chunk_id": c.chunk_id,
                    "page_numbers": c.page_numbers,
                    "start_offset": c.start_offset,
                    "end_offset": min(c.start_offset + 50, c.end_offset),
                    "excerpt": c.text[:50],
                }
            )

        changes = [
            {
                "category": "Termination Rights",
                "change_type": "MODIFIED",
                "description": "Document 2 modifies notice period requirements compared to Document 1.",
                "doc1_evidence": doc1_evidence,
                "doc2_evidence": doc2_evidence,
            },
            {
                "category": "Confidentiality Scope",
                "change_type": "ADDED",
                "description": "Document 2 introduces an additional non-solicitation provision.",
                "doc1_evidence": [],
                "doc2_evidence": doc2_evidence,
            },
        ]

        return {
            "summary": "Comparison of legal terms between Document 1 and Document 2.",
            "changes": changes,
        }


_fake_ai_provider = FakeAIProvider()


def get_ai_provider() -> AIProvider:
    return _fake_ai_provider
