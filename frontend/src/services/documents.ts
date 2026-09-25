export type DocumentType = 'pdf' | 'txt'
export type DocumentProcessingStatus = 'ready'

export interface SourceMetadata {
  declared_content_type: string | null
  detected_document_type: DocumentType
  page_count: number | null
}

export interface DocumentMetadataResponse {
  document_id: string
  filename: string
  document_type: DocumentType
  media_type: string
  processing_status: DocumentProcessingStatus
  created_at: string
  expires_at: string
  source_metadata: SourceMetadata
  page_count: number | null
  text_length: number
  chunk_count: number
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function uploadDocument(file: File): Promise<DocumentMetadataResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${apiBaseUrl}/documents`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let errorDetail = 'Failed to upload document.'
    try {
      const errorJson = (await response.json()) as { detail?: string }
      if (errorJson.detail) {
        errorDetail = errorJson.detail
      }
    } catch {
      // Fallback to generic message if JSON parsing fails
    }
    throw new Error(errorDetail)
  }

  return (await response.json()) as DocumentMetadataResponse
}

export async function getDocumentMetadata(
  documentId: string,
): Promise<DocumentMetadataResponse> {
  const response = await fetch(`${apiBaseUrl}/documents/${encodeURIComponent(documentId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let errorDetail = 'Failed to retrieve document metadata.'
    try {
      const errorJson = (await response.json()) as { detail?: string }
      if (errorJson.detail) {
        errorDetail = errorJson.detail
      }
    } catch {
      // Fallback
    }
    throw new Error(errorDetail)
  }

  return (await response.json()) as DocumentMetadataResponse
}
