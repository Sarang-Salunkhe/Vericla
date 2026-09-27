import { useState } from 'react'
import type { FullAnalysisResult, EvidenceReference } from '../services/analysis'
import { ReviewSignalsList } from './ReviewSignalsList'

interface AnalysisOverviewProps {
  analysis: FullAnalysisResult
  filename: string
}

export function AnalysisOverview({ analysis }: AnalysisOverviewProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null)

  const clausesCount = analysis.clauses?.length || 0
  const obligationsCount = analysis.obligations?.length || 0
  const datesCount = analysis.dates?.length || 0
  const signalsCount = analysis.review_signals?.length || 0

  return (
    <div className="v-analysis-workspace">
      {/* Metrics Counter Bar */}
      <div className="v-metrics-bar">
        <div className="v-metric-card">
          <span className="v-metric-val">{clausesCount}</span>
          <span className="v-metric-lbl">Key Clauses</span>
        </div>
        <div className="v-metric-card">
          <span className="v-metric-val">{obligationsCount}</span>
          <span className="v-metric-lbl">Obligations</span>
        </div>
        <div className="v-metric-card">
          <span className="v-metric-val">{datesCount}</span>
          <span className="v-metric-lbl">Important Dates</span>
        </div>
        <div className="v-metric-card">
          <span className="v-metric-val">{signalsCount}</span>
          <span className="v-metric-lbl">Review Signals</span>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="v-overview-grid">
        {/* Executive Summary */}
        <div className="v-card v-span-full">
          <div className="v-card-header">
            <span className="v-card-icon">📌</span>
            <h3>Executive Summary</h3>
            <span className="v-role-badge">Role: {analysis.role}</span>
          </div>
          <p className="v-summary-text">{analysis.summary}</p>
        </div>

        {/* Identified Parties */}
        {analysis.parties && analysis.parties.length > 0 && (
          <div className="v-card">
            <div className="v-card-header">
              <span className="v-card-icon">👥</span>
              <h3>Identified Parties</h3>
            </div>
            <div className="v-parties-list">
              {analysis.parties.map((p, idx) => (
                <span key={idx} className="v-party-chip">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review Signals */}
        <div className="v-card v-span-full">
          <div className="v-card-header">
            <span className="v-card-icon">🛡️</span>
            <h3>Review Signals & Neutral Observations</h3>
          </div>
          <ReviewSignalsList
            signals={analysis.review_signals}
            onSelectEvidence={(ev) => setSelectedEvidence(ev)}
          />
        </div>

        {/* Key Clauses */}
        <div className="v-card v-span-full">
          <div className="v-card-header">
            <span className="v-card-icon">📜</span>
            <h3>Key Clauses & Terms</h3>
          </div>
          <div className="v-clauses-grid">
            {analysis.clauses && analysis.clauses.length > 0 ? (
              analysis.clauses.map((clause, idx) => (
                <div key={idx} className="v-clause-item">
                  <div className="v-clause-header">
                    <h4>{clause.title}</h4>
                    <span className={`v-unc-badge v-unc-${clause.uncertainty.toLowerCase()}`}>
                      {clause.uncertainty}
                    </span>
                  </div>
                  <p className="v-clause-body">{clause.text}</p>

                  {/* Evidence Tag */}
                  {clause.evidence && clause.evidence.length > 0 && (
                    <div className="v-evidence-tags">
                      {clause.evidence.map((ev, eIdx) => (
                        <button
                          key={eIdx}
                          type="button"
                          className="v-ev-tag"
                          onClick={() => setSelectedEvidence(ev)}
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
              ))
            ) : (
              <p className="v-text-muted">No specific key clauses identified.</p>
            )}
          </div>
        </div>

        {/* Obligations */}
        {analysis.obligations && analysis.obligations.length > 0 && (
          <div className="v-card">
            <div className="v-card-header">
              <span className="v-card-icon">⚖️</span>
              <h3>Party Obligations</h3>
            </div>
            <div className="v-obligations-list">
              {analysis.obligations.map((ob, idx) => (
                <div key={idx} className="v-ob-item">
                  <span className="v-ob-party">{ob.party}</span>
                  <p className="v-ob-desc">{ob.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Dates */}
        {analysis.dates && analysis.dates.length > 0 && (
          <div className="v-card">
            <div className="v-card-header">
              <span className="v-card-icon">📅</span>
              <h3>Important Dates & Deadlines</h3>
            </div>
            <div className="v-dates-list">
              {analysis.dates.map((d, idx) => (
                <div key={idx} className="v-date-item">
                  <span className="v-date-lbl">{d.label}:</span>
                  <span className="v-date-val">{d.date_text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        {analysis.questions && analysis.questions.length > 0 && (
          <div className="v-card v-span-full">
            <div className="v-card-header">
              <span className="v-card-icon">❓</span>
              <h3>Suggested Follow-up Questions</h3>
            </div>
            <ul className="v-questions-list">
              {analysis.questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Stage 5B Evidence Inspection Modal Preview */}
      {selectedEvidence && (
        <div className="v-modal-overlay" onClick={() => setSelectedEvidence(null)}>
          <div className="v-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="v-modal-header">
              <h4>Evidence Citation Reference</h4>
              <button
                type="button"
                className="v-btn v-btn-ghost v-btn-sm"
                onClick={() => setSelectedEvidence(null)}
              >
                ✕
              </button>
            </div>
            <div className="v-modal-body">
              <div className="v-meta-row">
                <span className="v-meta-lbl">Chunk ID:</span>
                <span className="v-meta-val font-mono">{selectedEvidence.chunk_id}</span>
              </div>
              <div className="v-meta-row">
                <span className="v-meta-lbl">Page(s):</span>
                <span className="v-meta-val">
                  {selectedEvidence.page_numbers?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="v-meta-row">
                <span className="v-meta-lbl">Character Offsets:</span>
                <span className="v-meta-val font-mono">
                  {selectedEvidence.start_offset} – {selectedEvidence.end_offset}
                </span>
              </div>
              {selectedEvidence.excerpt && (
                <div className="v-excerpt-box">
                  <span className="v-meta-lbl">Excerpt Quote:</span>
                  <blockquote className="v-excerpt-text">"{selectedEvidence.excerpt}"</blockquote>
                </div>
              )}
              <div className="v-affordance-note">
                ℹ️ Full interactive Evidence View and side-by-side snippet highlighter will be enabled in Stage 5B.
              </div>
            </div>
            <div className="v-modal-footer">
              <button
                type="button"
                className="v-btn v-btn-primary v-btn-sm"
                onClick={() => setSelectedEvidence(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
