import { useState } from 'react'
import type { FullAnalysisResult, EvidenceReference } from '../services/analysis'
import { ClauseExplorer } from './ClauseExplorer'
import { EvidenceInspector } from './EvidenceInspector'
import { ReviewSignalsList } from './ReviewSignalsList'
import { ActionCenter } from './ActionCenter'
import { AskVericla } from './AskVericla'

interface AnalysisOverviewProps {
  analysis: FullAnalysisResult
  filename: string
}

export function AnalysisOverview({ analysis, filename }: AnalysisOverviewProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference[]>([])

  const clausesCount = analysis.clauses?.length || 0
  const obligationsCount = analysis.obligations?.length || 0
  const datesCount = analysis.dates?.length || 0
  const signalsCount = analysis.review_signals?.length || 0

  return (
    <div className="v-analysis-workspace">
      <div className="v-overview-grid">
        <section className="v-summary-panel v-span-full">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">✦</span>
            <div><span className="v-summary-eyebrow">AI analysis</span><h3>Executive summary</h3></div>
            <span className="v-role-badge">{analysis.role}</span>
          </div>
          <p className="v-summary-text">{analysis.summary}</p>
        </section>

        <div className="v-metrics-bar v-span-full">
          <div className="v-metric-card"><span className="v-metric-val">{clausesCount}</span><span className="v-metric-lbl">Key clauses</span></div>
          <div className="v-metric-card"><span className="v-metric-val">{obligationsCount}</span><span className="v-metric-lbl">Obligations</span></div>
          <div className="v-metric-card"><span className="v-metric-val">{datesCount}</span><span className="v-metric-lbl">Important dates</span></div>
          <div className="v-metric-card"><span className="v-metric-val">{signalsCount}</span><span className="v-metric-lbl">Review signals</span></div>
        </div>

        <ClauseExplorer
          clauses={analysis.clauses || []}
          onViewEvidence={(references) => setSelectedEvidence(references)}
        />

        {analysis.parties && analysis.parties.length > 0 && (
          <div className="v-card">
            <div className="v-card-header">
              <span className="v-card-icon" aria-hidden="true">◉</span>
              <h3>Identified Parties</h3>
            </div>
            <div className="v-parties-list">
              {analysis.parties.map((p, idx) => (
                <span key={idx} className="v-party-chip">{p}</span>
              ))}
            </div>
          </div>
        )}

        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">§</span>
            <h3>Obligations</h3>
          </div>
          {analysis.obligations && analysis.obligations.length > 0 ? (
            <div className="v-obligations-list">
              {analysis.obligations.map((ob, idx) => (
                <div key={idx} className="v-ob-item">
                  <span className="v-ob-party">{ob.party}</span>
                  <p className="v-ob-desc">{ob.description}</p>
                  {ob.evidence && ob.evidence.length > 0 && (
                    <button type="button" className="v-ev-tag" onClick={() => setSelectedEvidence(ob.evidence)}>
                      <span className="v-ev-icon">📍</span>
                      <span>View evidence</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="v-empty-inline">No obligations were identified in this analysis.</p>
          )}
        </div>

        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">◷</span>
            <h3>Important Dates</h3>
          </div>
          {analysis.dates && analysis.dates.length > 0 ? (
            <div className="v-dates-list">
              {analysis.dates.map((d, idx) => (
                <div key={idx} className="v-date-item">
                  <span className="v-date-lbl">{d.label}:</span>
                  <span className="v-date-val">{d.date_text}</span>
                  {d.evidence && d.evidence.length > 0 && (
                    <button type="button" className="v-ev-tag" onClick={() => setSelectedEvidence(d.evidence)}>
                      <span className="v-ev-icon">📍</span>
                      <span>View evidence</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="v-empty-inline">No dates were identified in this analysis.</p>
          )}
        </div>

        <div className="v-card v-span-full">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">◇</span>
            <h3>Review Signals & Neutral Observations</h3>
          </div>
          <ReviewSignalsList
            signals={analysis.review_signals}
            onSelectEvidence={(ev) => setSelectedEvidence([ev])}
          />
        </div>

        {analysis.questions && analysis.questions.length > 0 && (
          <div className="v-card v-span-full">
            <div className="v-card-header">
              <span className="v-card-icon" aria-hidden="true">?</span>
              <h3>Suggested Follow-up Questions</h3>
            </div>
            <ul className="v-questions-list">
              {analysis.questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <AskVericla
          documentId={analysis.document_id}
          documentName={filename}
          onViewEvidence={(references) => setSelectedEvidence(references)}
        />

        <ActionCenter analysis={analysis} onViewEvidence={(references) => setSelectedEvidence(references)} />
      </div>

      <EvidenceInspector
        isOpen={selectedEvidence.length > 0}
        documentName={filename}
        references={selectedEvidence}
        onClose={() => setSelectedEvidence([])}
      />
    </div>
  )
}
