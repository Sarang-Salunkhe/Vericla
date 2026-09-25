import type { EvidenceReference } from './analysis'

export type ComparisonChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED'

export interface ComparisonItem {
  category: string
  change_type: ComparisonChangeType
  description: string
  doc1_evidence: EvidenceReference[]
  doc2_evidence: EvidenceReference[]
}

export interface CompareResponse {
  compare_id: string
  doc1_id: string
  doc2_id: string
  summary: string
  changes: ComparisonItem[]
  created_at: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function compareDocuments(
  doc1Id: string,
  doc2Id: string,
): Promise<CompareResponse> {
  const response = await fetch(`${apiBaseUrl}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc1_id: doc1Id, doc2_id: doc2Id }),
  })

  if (!response.ok) {
    let detail = 'Failed to compare documents.'
    try {
      const err = (await response.json()) as { detail?: string }
      if (err.detail) detail = err.detail
    } catch {
      // Fallback
    }
    throw new Error(detail)
  }

  return (await response.json()) as CompareResponse
}
