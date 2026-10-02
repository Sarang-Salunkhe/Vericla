import { useState } from 'react'
import type { EvidenceReference } from '../services/analysis'
import type { SessionDocument } from '../types'
import type { CompareResponse } from '../services/compare'
import { compareDocuments } from '../services/compare'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { EvidenceInspector } from '../components/EvidenceInspector'

interface ComparePageProps {
  sessionDocuments: SessionDocument[]
  onNavigateToDashboard: () => void
}

export function ComparePage({ sessionDocuments, onNavigateToDashboard }: ComparePageProps) {
  const [doc1Id, setDoc1Id] = useState<string>(sessionDocuments[0]?.metadata.document_id || '')
  const [doc2Id, setDoc2Id] = useState<string>(sessionDocuments[1]?.metadata.document_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference[]>([])

  const handleCompareSubmit = async () => {
    if (!doc1Id || !doc2Id || doc1Id === doc2Id) {
      setError('Please select two distinct documents from your active session to compare.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await compareDocuments(doc1Id, doc2Id)
      setResult(res)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to execute document comparison.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionDocuments.length < 2) {
    return (
      <div className="v-page v-compare-page">
        <EmptyState
          icon="⇄"
          title="Comparison Requires 2 Documents"
          description="You currently have fewer than 2 active documents in this session. Upload a second document to compare structural and substantive differences."
          actionLabel="Upload Documents on Dashboard"
          onAction={onNavigateToDashboard}
        />
      </div>
    )
  }

  const documentA = sessionDocuments.find((doc) => doc.metadata.document_id === doc1Id) || sessionDocuments[0]
  const documentB = sessionDocuments.find((doc) => doc.metadata.document_id === doc2Id) || sessionDocuments[1]
  const evidenceDocumentName = sessionDocuments.find(
    (doc) => doc.metadata.document_id === selectedEvidence[0]?.document_id,
  )?.metadata.filename || 'Comparison document'

  return (
    <div className="v-page v-compare-page">
      <div className="v-section-header v-page-intro">
        <span className="v-page-eyebrow">Workspace / Compare</span>
        <h2>Document comparison</h2>
        <p>Compare two session documents side-by-side to classify the differences in language and obligations.</p>
      </div>

      <div className="v-compare-selector-card">
        <div className="v-grid-2col">
          <div className="v-select-box">
            <span className="v-compare-index">DOCUMENT A</span>
            <label htmlFor="doc1-select">Document A</label>
            <select
              id="doc1-select"
              className="v-role-select"
              value={doc1Id}
              onChange={(e) => setDoc1Id(e.target.value)}
            >
              {sessionDocuments.map((d) => (
                <option key={d.metadata.document_id} value={d.metadata.document_id}>
                  {d.metadata.filename} ({d.metadata.document_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="v-select-box">
            <span className="v-compare-index">DOCUMENT B</span>
            <label htmlFor="doc2-select">Document B</label>
            <select
              id="doc2-select"
              className="v-role-select"
              value={doc2Id}
              onChange={(e) => setDoc2Id(e.target.value)}
            >
              {sessionDocuments.map((d) => (
                <option key={d.metadata.document_id} value={d.metadata.document_id}>
                  {d.metadata.filename} ({d.metadata.document_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="v-upload-actions">
          <button
            type="button"
            className="v-btn v-btn-primary"
            onClick={handleCompareSubmit}
            disabled={isLoading || !doc1Id || !doc2Id || doc1Id === doc2Id}
          >
            {isLoading ? 'Comparing Documents...' : 'Compare Selected Documents'}
          </button>
        </div>
      </div>

      {error && <ErrorBanner title="Comparison failed" message={error} onDismiss={() => setError(null)} />}

      {result && (
        <div className="v-compare-results-section">
          <div className="v-card v-span-full">
            <h3>Comparison Summary</h3>
            <p className="v-summary-text">{result.summary}</p>
          </div>

          <div className="v-comparison-grid">
            {result.changes.map((item, idx) => (
              <div key={idx} className="v-change-card">
                <div className="v-change-header">
                  <span className={`v-badge v-change-${item.change_type.toLowerCase()}`}>
                    {item.change_type}
                  </span>
                  <h4>{item.category}</h4>
                </div>
                <p className="v-change-desc">{item.description}</p>

                <div className="v-compare-evidence-grid">
                  <div>
                    <h5>{documentA?.metadata.filename || 'Document A'}</h5>
                    {item.doc1_evidence.length > 0 ? (
                      item.doc1_evidence.map((ev, evIdx) => (
                        <button key={`${idx}-a-${evIdx}`} type="button" className="v-ev-tag" onClick={() => setSelectedEvidence([ev])}>
                          <span className="v-ev-icon">📍</span>
                          <span>View evidence</span>
                        </button>
                      ))
                    ) : (
                      <p className="v-empty-inline">No evidence provided.</p>
                    )}
                  </div>

                  <div>
                    <h5>{documentB?.metadata.filename || 'Document B'}</h5>
                    {item.doc2_evidence.length > 0 ? (
                      item.doc2_evidence.map((ev, evIdx) => (
                        <button key={`${idx}-b-${evIdx}`} type="button" className="v-ev-tag" onClick={() => setSelectedEvidence([ev])}>
                          <span className="v-ev-icon">📍</span>
                          <span>View evidence</span>
                        </button>
                      ))
                    ) : (
                      <p className="v-empty-inline">No evidence provided.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EvidenceInspector
        isOpen={selectedEvidence.length > 0}
        documentName={evidenceDocumentName}
        references={selectedEvidence}
        onClose={() => setSelectedEvidence([])}
      />
    </div>
  )
}
