import type { SessionDocument } from '../types'
import { EmptyState } from '../components/EmptyState'

interface HistoryPageProps {
  sessionDocuments: SessionDocument[]
  onSelectDocument: (docId: string) => void
  onNavigateToDashboard: () => void
}

export function HistoryPage({
  sessionDocuments,
  onSelectDocument,
  onNavigateToDashboard,
}: HistoryPageProps) {
  return (
    <div className="v-page v-history-page">
      <div className="v-section-header">
        <h2>Session Document History</h2>
        <p>Current active document sessions stored in ephemeral in-memory storage.</p>
      </div>

      <div className="v-ephemeral-banner">
        <span className="v-ephemeral-badge">Session Only</span>
        <p>
          Vericla operates with zero persistent database storage by default. Uploaded documents and
          analysis results remain active only for your current session (TTL: 1 hour) and are automatically
          purged upon expiration.
        </p>
      </div>

      {sessionDocuments.length === 0 ? (
        <EmptyState
          icon="⏱️"
          title="No Active Documents in Session"
          description="Your session has no active documents. Upload a new PDF or TXT file to create a session."
          actionLabel="Go to Dashboard"
          onAction={onNavigateToDashboard}
        />
      ) : (
        <div className="v-history-grid">
          {sessionDocuments.map((docItem) => {
            const meta = docItem.metadata
            return (
              <div key={meta.document_id} className="v-card v-history-card">
                <div className="v-history-card-header">
                  <span className="v-doc-icon">📄</span>
                  <div>
                    <h4>{meta.filename}</h4>
                    <span className="v-text-muted text-xs font-mono">
                      ID: {meta.document_id}
                    </span>
                  </div>
                </div>

                <div className="v-meta-grid">
                  <div className="v-meta-item">
                    <span className="v-meta-lbl">Type</span>
                    <span className="v-meta-val">{meta.document_type.toUpperCase()}</span>
                  </div>
                  <div className="v-meta-item">
                    <span className="v-meta-lbl">Pages</span>
                    <span className="v-meta-val">{meta.page_count ?? 'N/A (TXT)'}</span>
                  </div>
                  <div className="v-meta-item">
                    <span className="v-meta-lbl">Chunks</span>
                    <span className="v-meta-val">{meta.chunk_count}</span>
                  </div>
                  <div className="v-meta-item">
                    <span className="v-meta-lbl">Expires At</span>
                    <span className="v-meta-val">
                      {new Date(meta.expires_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="v-btn v-btn-primary v-btn-sm"
                  onClick={() => onSelectDocument(meta.document_id)}
                >
                  Open Workspace
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
