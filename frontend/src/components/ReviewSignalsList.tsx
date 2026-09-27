import type { ReviewSignal, EvidenceReference } from '../services/analysis'

interface ReviewSignalsListProps {
  signals: ReviewSignal[]
  onSelectEvidence?: (evidence: EvidenceReference) => void
}

const CATEGORY_STYLES: Record<string, { label: string; badgeClass: string; icon: string }> = {
  attention: { label: 'Attention Required', badgeClass: 'v-badge-amber', icon: '⚡' },
  review: { label: 'Recommended Review', badgeClass: 'v-badge-indigo', icon: '🔍' },
  uncertain: { label: 'Uncertain Wording', badgeClass: 'v-badge-purple', icon: '❓' },
  missing_information: { label: 'Missing Information', badgeClass: 'v-badge-rose', icon: '⚠️' },
}

export function ReviewSignalsList({ signals, onSelectEvidence }: ReviewSignalsListProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="v-signals-empty">
        <p className="v-text-muted">No neutral review signals flagged for this document.</p>
      </div>
    )
  }

  return (
    <div className="v-signals-list">
      {signals.map((sig, idx) => {
        const catInfo = CATEGORY_STYLES[sig.category] || {
          label: sig.category,
          badgeClass: 'v-badge-gray',
          icon: '📌',
        }

        return (
          <div key={idx} className="v-signal-card">
            <div className="v-signal-header">
              <span className={`v-badge ${catInfo.badgeClass}`}>
                <span className="v-badge-icon">{catInfo.icon}</span>
                {catInfo.label}
              </span>
              <h4 className="v-signal-title">{sig.title}</h4>
            </div>

            <p className="v-signal-desc">{sig.description}</p>

            {/* Evidence References Tag Affordance */}
            {sig.evidence && sig.evidence.length > 0 && (
              <div className="v-evidence-tags">
                <span className="v-ev-label">Source Evidence:</span>
                {sig.evidence.map((ev, eIdx) => (
                  <button
                    key={eIdx}
                    type="button"
                    className="v-ev-tag"
                    title={`Chunk: ${ev.chunk_id} | Offsets: ${ev.start_offset}-${ev.end_offset}`}
                    onClick={() => onSelectEvidence && onSelectEvidence(ev)}
                  >
                    <span className="v-ev-icon">📍</span>
                    <span>
                      {ev.page_numbers && ev.page_numbers.length > 0
                        ? `Page ${ev.page_numbers.join(', ')}`
                        : `Offsets ${ev.start_offset}-${ev.end_offset}`}
                    </span>
                    <span className="v-ev-affordance">View evidence</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
