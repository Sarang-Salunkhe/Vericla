import { useEffect } from 'react'
import type { EvidenceReference } from '../services/analysis'

interface EvidenceInspectorProps {
  isOpen: boolean
  documentName: string
  references: EvidenceReference[]
  onClose: () => void
}

const formatPages = (pages?: number[]) => {
  if (!pages || pages.length === 0) return 'Not provided'
  return pages.join(', ')
}

const formatOffsets = (start?: number, end?: number) => {
  if (typeof start !== 'number' || typeof end !== 'number') return 'Not provided'
  return `${start} - ${end}`
}

export function EvidenceInspector({
  isOpen,
  documentName,
  references,
  onClose,
}: EvidenceInspectorProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const evidence = references.length > 0 ? references : []
  const primaryEvidence = evidence[0]

  return (
    <div className="v-evidence-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside
        className="v-evidence-drawer"
        onClick={(event) => event.stopPropagation()}
        aria-label="Evidence inspector"
      >
        <div className="v-evidence-header">
          <div>
            <p className="v-evidence-kicker">Source record</p>
            <h3>Verified evidence</h3>
          </div>
          <button type="button" className="v-btn v-btn-ghost v-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {primaryEvidence ? (
          <div className="v-evidence-body">
            <div className="v-evidence-meta">
              <p className="v-evidence-kicker">Source</p>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Status</span>
                <span className="v-meta-val">Verified evidence</span>
              </div>
              <p className="v-evidence-kicker">Location</p>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Document</span>
                <span className="v-meta-val">{documentName}</span>
              </div>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Page</span>
                <span className="v-meta-val">{formatPages(primaryEvidence.page_numbers)}</span>
              </div>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Section</span>
                <span className="v-meta-val">{primaryEvidence.section || 'Not provided'}</span>
              </div>
            </div>

            <div className="v-evidence-section">
              <h4>Excerpt</h4>
              <blockquote className="v-source-quote">
                {primaryEvidence.excerpt || 'No excerpt provided for this evidence reference.'}
              </blockquote>
            </div>

            <div className="v-evidence-section">
              <h4>Reference</h4>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Source offsets</span>
                <span className="v-meta-val font-mono">
                  {formatOffsets(primaryEvidence.start_offset, primaryEvidence.end_offset)}
                </span>
              </div>
              <div className="v-evidence-row">
                <span className="v-meta-lbl">Chunk ID</span>
                <span className="v-meta-val font-mono">{primaryEvidence.chunk_id || 'Not provided'}</span>
              </div>
            </div>

            {evidence.length > 1 && (
              <div className="v-evidence-section">
                <h4>Additional references</h4>
                <ul className="v-evidence-list">
                  {evidence.slice(1).map((item, idx) => (
                    <li key={`${item.chunk_id}-${idx}`}>
                      <span className="v-meta-lbl">Page</span>
                      <span className="v-meta-val">{formatPages(item.page_numbers)}</span>
                      <span className="v-meta-lbl">Chunk</span>
                      <span className="v-meta-val font-mono">{item.chunk_id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="v-empty-card compact">
            <div className="v-empty-icon" aria-hidden="true">📍</div>
            <h4 className="v-empty-title">Evidence unavailable</h4>
            <p className="v-empty-desc">
              No verified evidence reference was provided for this item.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
