import { useEffect, useState } from 'react'
import type { NavTab, SessionDocument } from './types'
import type { DocumentMetadataResponse } from './services/documents'
import type { FullAnalysisResult, UserRole } from './services/analysis'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyzePage } from './pages/AnalyzePage'
import { ComparePage } from './pages/ComparePage'
import { HistoryPage } from './pages/HistoryPage'
import { HelpPage } from './pages/HelpPage'
import { PublicLandingPage } from './pages/PublicLandingPage'
import './App.css'

export default function App() {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [focusWorkspaceUpload, setFocusWorkspaceUpload] = useState(false)
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)

  const openWorkspace = (tab: NavTab = 'dashboard') => {
    setActiveTab(tab)
    setFocusWorkspaceUpload(tab === 'dashboard')
    setIsWorkspaceOpen(true)
  }

  useEffect(() => {
    if (!isWorkspaceOpen || !focusWorkspaceUpload) return

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setFocusWorkspaceUpload(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusWorkspaceUpload, isWorkspaceOpen])

  // Document uploaded handler
  const handleDocumentUploaded = (docMeta: DocumentMetadataResponse, role: UserRole) => {
    setSessionDocuments((prev) => {
      const exists = prev.some((d) => d.metadata.document_id === docMeta.document_id)
      if (exists) return prev
      return [...prev, { metadata: docMeta, selectedRole: role }]
    })
    setActiveDocumentId(docMeta.document_id)
    setActiveTab('analyze')
  }

  // Analysis complete handler
  const handleAnalysisComplete = (
    docId: string,
    analysis: FullAnalysisResult,
    role: UserRole,
  ) => {
    setSessionDocuments((prev) =>
      prev.map((item) =>
        item.metadata.document_id === docId
          ? { ...item, analysis, selectedRole: role }
          : item,
      ),
    )
  }

  // Select active document from dashboard or history
  const handleSelectDocument = (docId: string) => {
    setActiveDocumentId(docId)
    setActiveTab('analyze')
  }

  const activeDocItem = sessionDocuments.find(
    (d) => d.metadata.document_id === activeDocumentId,
  ) || (sessionDocuments.length > 0 ? sessionDocuments[sessionDocuments.length - 1] : null)

  const activeDocMeta = activeDocItem ? activeDocItem.metadata : null

  if (!isWorkspaceOpen) {
    return <PublicLandingPage onOpenWorkspace={openWorkspace} />
  }

  return (
    <AppShell
      activeTab={activeTab}
      activeDocument={activeDocMeta}
      sessionDocCount={sessionDocuments.length}
      onTabChange={setActiveTab}
      onReturnToSite={() => setIsWorkspaceOpen(false)}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage
          sessionDocuments={sessionDocuments}
          onDocumentUploaded={handleDocumentUploaded}
          onSelectDocument={handleSelectDocument}
          onNavigateToTab={setActiveTab}
        />
      )}

      {activeTab === 'analyze' && (
        <AnalyzePage
          key={activeDocumentId ?? 'none'}
          sessionDocument={activeDocItem}
          onAnalysisComplete={handleAnalysisComplete}
          onNavigateToDashboard={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'compare' && (
        <ComparePage
          sessionDocuments={sessionDocuments}
          onNavigateToDashboard={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'history' && (
        <HistoryPage
          sessionDocuments={sessionDocuments}
          onSelectDocument={handleSelectDocument}
          onNavigateToDashboard={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'help' && <HelpPage />}
    </AppShell>
  )
}
