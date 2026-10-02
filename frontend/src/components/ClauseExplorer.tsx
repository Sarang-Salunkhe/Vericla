import { useMemo, useState } from 'react'
import type { ClauseInsight, EvidenceReference } from '../services/analysis'

interface ClauseExplorerProps {
  clauses: ClauseInsight[]
  onViewEvidence: (references: EvidenceReference[]) => void
}

const uncertaintyLabels: Record<string, string> = {
  SUPPORTED: 'Supported',
  PARTIAL: 'Partial',
  AMBIGUOUS: 'Ambiguous',
  NOT_FOUND: 'Not found',
  UNSUPPORTED: 'Unsupported',
}

export function ClauseExplorer({ clauses, onViewEvidence }: ClauseExplorerProps) {
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})

  const filteredClauses = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clauses

    return clauses.filter((clause) => {
      const haystack = `${clause.title} ${clause.text}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [clauses, query])

  if (!clauses || clauses.length === 0) {
    return (
      <div className="v-card v-span-full">
        <div className="v-card-header">
          <span className="v-card-icon" aria-hidden="true">§</span>
          <h3>Clause Explorer</h3>
        </div>
        <p className="v-empty-inline">No key clauses were identified in this analysis.</p>
      </div>
    )
  }

  const toggleExpanded = (index: number) => {
    setExpandedIds((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="v-card v-span-full">
      <div className="v-card-header">
        <span className="v-card-icon" aria-hidden="true">§</span>
        <h3>Clause Explorer</h3>
      </div>

      <div className="v-filter-row">
        <label className="v-filter-label" htmlFor="clause-search">
          Search clauses
        </label>
        <input
          id="clause-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or text"
          className="v-search-input"
        />
      </div>

      <div className="v-clause-list">
        {filteredClauses.length === 0 ? (
          <p className="v-empty-inline">No matching clauses found.</p>
        ) : (
          filteredClauses.map((clause, idx) => {
            const isOpen = !!expandedIds[idx]
            const evidence = clause.evidence || []

            return (
              <article key={`${clause.title}-${idx}`} className="v-clause-card">
                <div className="v-clause-card-header">
                  <div>
                    <h4>{clause.title}</h4>
                    <span className={`v-unc-badge v-unc-${clause.uncertainty.toLowerCase()}`}>
                      {uncertaintyLabels[clause.uncertainty] || clause.uncertainty}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="v-btn v-btn-ghost v-btn-sm"
                    onClick={() => toggleExpanded(idx)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'Hide details' : 'View details'}
                  </button>
                </div>

                {isOpen && <p className="v-clause-body">{clause.text}</p>}

                {evidence.length > 0 && (
                  <div className="v-evidence-tags">
                    <button
                      type="button"
                      className="v-ev-tag"
                      onClick={() => onViewEvidence(evidence)}
                    >
                      <span className="v-ev-icon">📍</span>
                      <span>View evidence</span>
                    </button>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
