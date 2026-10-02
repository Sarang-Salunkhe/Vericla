import type { EvidenceReference, FullAnalysisResult } from '../services/analysis'

interface ActionCenterProps {
  analysis: FullAnalysisResult
  onViewEvidence: (references: EvidenceReference[]) => void
}

export function ActionCenter({ analysis, onViewEvidence }: ActionCenterProps) {
  const items = [
    ...(analysis.review_signals || []).map((signal) => ({
      type: signal.category === 'missing_information' ? 'Missing information' : 'Review',
      title: signal.title,
      description: signal.description,
      evidence: signal.evidence,
    })),
    ...(analysis.dates || []).map((date) => ({
      type: 'Date',
      title: date.label,
      description: date.date_text,
      evidence: date.evidence,
    })),
    ...(analysis.questions || []).map((question) => ({
      type: 'Question',
      title: 'Question to clarify',
      description: question,
      evidence: [] as EvidenceReference[],
    })),
  ]

  if (items.length === 0) {
    return (
      <div className="v-card v-span-full">
        <div className="v-card-header">
          <span className="v-card-icon">✅</span>
          <h3>Action Center</h3>
        </div>
        <p className="v-empty-inline">No action items were identified from the current analysis.</p>
      </div>
    )
  }

  return (
    <div className="v-card v-span-full">
      <div className="v-card-header">
        <span className="v-card-icon">⚡</span>
        <h3>Action Center</h3>
      </div>

      <div className="v-action-list">
        {items.map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="v-action-item">
            <div className="v-action-header">
              <span className={`v-action-type v-action-${item.type.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.type}
              </span>
              <h4>{item.title}</h4>
            </div>
            <p>{item.description}</p>
            {item.evidence && item.evidence.length > 0 && (
              <button type="button" className="v-ev-tag" onClick={() => onViewEvidence(item.evidence)}>
                <span className="v-ev-icon">📍</span>
                <span>View evidence</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
