export type UserRole =
  | 'Tenant'
  | 'Employee'
  | 'Freelancer'
  | 'Customer'
  | 'Employer'
  | 'Business Owner'
  | 'Other'
  | 'General Analysis'

export type UncertaintyState = 'SUPPORTED' | 'PARTIAL' | 'AMBIGUOUS' | 'NOT_FOUND' | 'UNSUPPORTED'
export type ReviewSignalCategory = 'review' | 'attention' | 'uncertain' | 'missing_information'

export interface EvidenceReference {
  document_id: string
  chunk_id: string
  page_numbers: number[]
  start_offset: number
  end_offset: number
  excerpt?: string | null
  section?: string | null
}

export interface ClauseInsight {
  title: string
  text: string
  evidence: EvidenceReference[]
  uncertainty: UncertaintyState
}

export interface ObligationItem {
  party: string
  description: string
  evidence: EvidenceReference[]
  uncertainty: UncertaintyState
}

export interface ImportantDate {
  label: string
  date_text: string
  evidence: EvidenceReference[]
}

export interface ReviewSignal {
  category: ReviewSignalCategory
  title: string
  description: string
  evidence: EvidenceReference[]
}

export interface FullAnalysisResult {
  analysis_id: string
  document_id: string
  role: UserRole
  summary: string
  document_type: string
  parties: string[]
  clauses: ClauseInsight[]
  obligations: ObligationItem[]
  dates: ImportantDate[]
  review_signals: ReviewSignal[]
  questions: string[]
  created_at: string
  expires_at: string
}

export type AnalysisRequest = {
  document_text: string
}

export type Stage1AnalysisResponse = {
  status: 'not_available'
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function createAnalysis(
  documentId: string,
  role: UserRole = 'General Analysis',
): Promise<FullAnalysisResult> {
  const response = await fetch(`${apiBaseUrl}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, role }),
  })

  if (!response.ok) {
    let detail = 'Failed to analyze document.'
    try {
      const err = (await response.json()) as { detail?: string }
      if (err.detail) detail = err.detail
    } catch {
      // Fallback
    }
    throw new Error(detail)
  }

  return (await response.json()) as FullAnalysisResult
}

export async function getAnalysisResult(analysisId: string): Promise<FullAnalysisResult> {
  const response = await fetch(`${apiBaseUrl}/analysis/${encodeURIComponent(analysisId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let detail = 'Failed to retrieve analysis result.'
    try {
      const err = (await response.json()) as { detail?: string }
      if (err.detail) detail = err.detail
    } catch {
      // Fallback
    }
    throw new Error(detail)
  }

  return (await response.json()) as FullAnalysisResult
}

export async function requestDocumentAnalysis(
  request: AnalysisRequest,
): Promise<Stage1AnalysisResponse> {
  const response = await fetch(`${apiBaseUrl}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (response.status !== 501) {
    throw new Error('Unable to request document analysis.')
  }

  return (await response.json()) as Stage1AnalysisResponse
}
