import type { DocumentMetadataResponse } from '../services/documents'
import type { FullAnalysisResult, UserRole } from '../services/analysis'

export type NavTab = 'dashboard' | 'analyze' | 'compare' | 'history' | 'help'

export interface SessionDocument {
  metadata: DocumentMetadataResponse
  analysis?: FullAnalysisResult | null
  selectedRole?: UserRole
}

export interface AppState {
  activeTab: NavTab
  documents: SessionDocument[]
  activeDocumentId: string | null
}
