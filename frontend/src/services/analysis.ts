export type AnalysisRequest = {
  document_text: string
}

export type AnalysisResponse = {
  status: 'not_available'
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function requestDocumentAnalysis(
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const response = await fetch(`${apiBaseUrl}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (response.status !== 501) {
    throw new Error('Unable to request document analysis.')
  }

  return (await response.json()) as AnalysisResponse
}
