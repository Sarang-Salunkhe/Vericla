import { useState } from 'react'
import type { DocumentMetadataResponse } from '../services/documents'
import type { UserRole } from '../services/analysis'
import type { SessionDocument } from '../types'
import { UploadCard } from '../components/UploadCard'
import { RoleSelector } from '../components/RoleSelector'
import { EmptyState } from '../components/EmptyState'

interface DashboardPageProps {
  sessionDocuments: SessionDocument[]
  onDocumentUploaded: (doc: DocumentMetadataResponse, role: UserRole) => void
  onSelectDocument: (docId: string) => void
  onNavigateToTab: (tab: 'analyze' | 'compare' | 'history' | 'help') => void
}

export function DashboardPage({
  sessionDocuments,
  onDocumentUploaded,
  onSelectDocument,
  onNavigateToTab,
}: DashboardPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('General Analysis')

  const handleUploadSuccess = (doc: DocumentMetadataResponse) => {
    onDocumentUploaded(doc, selectedRole)
  }

  return (
    <div className="v-page v-dashboard-page v-workspace-dashboard">
      <header className="v-workspace-welcome">
        <div>
          <span className="v-page-eyebrow">Workspace / Overview</span>
          <h2>Your document workspace</h2>
          <p>Upload a document to begin, or return to a file from this session.</p>
        </div>
        <a href="#upload-section" className="v-btn v-btn-primary">Analyze a document <span aria-hidden="true">↗</span></a>
      </header>

      <section className="v-workspace-tools" aria-label="Available workspace tools">
        <button type="button" className="v-workspace-tool" onClick={() => onNavigateToTab('analyze')}>
          <span className="v-workspace-tool-icon" aria-hidden="true">◉</span><strong>Analyze</strong><small>Review a document</small><span className="v-tool-arrow" aria-hidden="true">↗</span>
        </button>
        <button type="button" className="v-workspace-tool" onClick={() => onNavigateToTab('compare')}>
          <span className="v-workspace-tool-icon" aria-hidden="true">⇄</span><strong>Compare</strong><small>Find document changes</small><span className="v-tool-arrow" aria-hidden="true">↗</span>
        </button>
        <button type="button" className="v-workspace-tool" onClick={() => onNavigateToTab('history')}>
          <span className="v-workspace-tool-icon" aria-hidden="true">◷</span><strong>Session history</strong><small>Return to a current file</small><span className="v-tool-arrow" aria-hidden="true">↗</span>
        </button>
        <button type="button" className="v-workspace-tool" onClick={() => onNavigateToTab('help')}>
          <span className="v-workspace-tool-icon" aria-hidden="true">§</span><strong>Help & Safety</strong><small>Evidence and limitations</small><span className="v-tool-arrow" aria-hidden="true">↗</span>
        </button>
      </section>

      {/* Upload & Context Selector Section */}
      <section id="upload-section" className="v-section v-upload-section">
        <div className="v-section-header">
          <h3>Analyze a document</h3>
          <p>Upload a supported file and choose the perspective for your review.</p>
        </div>

        <div className="v-grid-2col">
          <UploadCard onSuccess={handleUploadSuccess} />
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>
      </section>

      {/* Session Documents / Recent Activity Section */}
      <section className="v-section">
        <div className="v-section-header">
          <h3>Recent session documents</h3>
          <p>Files and analyses available during this session.</p>
        </div>

        {sessionDocuments.length === 0 ? (
          <EmptyState
            icon="▤"
            title="No documents yet."
            description="Upload a document to start your first analysis."
          />
        ) : (
          <div className="v-doc-list">
            {sessionDocuments.map((docItem) => {
              const meta = docItem.metadata
              const hasAnalysis = !!docItem.analysis

              return (
                <div key={meta.document_id} className="v-doc-card">
                  <div className="v-doc-card-info">
                    <span className="v-doc-icon" aria-hidden="true">▤</span>
                    <div>
                      <h4 className="v-doc-title">{meta.filename}</h4>
                      <div className="v-doc-meta-row">
                        <span className="v-badge v-badge-indigo">
                          {meta.document_type.toUpperCase()}
                        </span>
                        <span>{meta.page_count ? `${meta.page_count} pages` : 'TXT'}</span>
                        <span>•</span>
                        <span>{meta.text_length.toLocaleString()} chars</span>
                        <span>•</span>
                        <span>{meta.chunk_count} chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="v-doc-card-actions">
                    <span className={`v-status-badge ${hasAnalysis ? 'ready' : 'pending'}`}>
                      {hasAnalysis ? 'Analyzed' : 'Ready'}
                    </span>
                    <button
                      type="button"
                      className="v-btn v-btn-primary v-btn-sm"
                      onClick={() => onSelectDocument(meta.document_id)}
                    >
                      {hasAnalysis ? 'View Workspace' : 'Analyze Document'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
