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
    <div className="v-page v-dashboard-page">
      {/* Welcome Hero Banner */}
      <section className="v-hero-card">
        <div className="v-hero-content">
          <span className="v-hero-tag">GenAI Document Intelligence</span>
          <h2 className="v-hero-title">
            Understand your documents. Ask grounded questions. Review important clauses and actions.
          </h2>
          <p className="v-hero-desc">
            Vericla provides traceable legal document insights, deterministic layout normalization,
            and evidence-backed clause extraction.
          </p>
          <div className="v-hero-ctas">
            <a href="#upload-section" className="v-btn v-btn-primary">
              Analyze a Document
            </a>
            <button
              type="button"
              className="v-btn v-btn-secondary"
              onClick={() => onNavigateToTab('help')}
            >
              Learn About Safety & Disclaimers
            </button>
          </div>
        </div>
      </section>

      {/* Upload & Context Selector Section */}
      <section id="upload-section" className="v-section">
        <div className="v-section-header">
          <h3>Ingest Document for Analysis</h3>
          <p>Upload a PDF or TXT legal file and select your perspective.</p>
        </div>

        <div className="v-grid-2col">
          <UploadCard onSuccess={handleUploadSuccess} />
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>
      </section>

      {/* Session Documents / Recent Activity Section */}
      <section className="v-section">
        <div className="v-section-header">
          <h3>Active Session Documents</h3>
          <p>Documents loaded in ephemeral memory during this session.</p>
        </div>

        {sessionDocuments.length === 0 ? (
          <EmptyState
            icon="📄"
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
                    <span className="v-doc-icon">📄</span>
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
