import type { EvidenceReference, UncertaintyState } from './analysis'

export interface QAResponse {
  qa_id: string
  document_id: string
  question: string
  simple_answer: string
  evidence: EvidenceReference[]
  uncertainty: UncertaintyState
  not_stated?: string | null
  created_at: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function askQuestion(
  documentId: string,
  question: string,
): Promise<QAResponse> {
  const response = await fetch(`${apiBaseUrl}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, question }),
  })

  if (!response.ok) {
    let detail = 'Failed to answer question.'
    try {
      const err = (await response.json()) as { detail?: string }
      if (err.detail) detail = err.detail
    } catch {
      // Fallback
    }
    throw new Error(detail)
  }

  return (await response.json()) as QAResponse
}
