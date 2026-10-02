import { useState, useEffect, useCallback, useRef } from 'react'
import type { SessionDocument } from '../types'
import type { UserRole, FullAnalysisResult } from '../services/analysis'
import { createAnalysis } from '../services/analysis'
import { RoleSelector } from '../components/RoleSelector'
import { AnalysisOverview } from '../components/AnalysisOverview'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'

interface AnalyzePageProps {
  sessionDocument: SessionDocument | null
  onAnalysisComplete: (docId: string, analysis: FullAnalysisResult, role: UserRole) => void
  onNavigateToDashboard: () => void
}

export function AnalyzePage({
  sessionDocument,
  onAnalysisComplete,
  onNavigateToDashboard,
}: AnalyzePageProps) {
  const [role, setRole] = useState<UserRole>(
    sessionDocument?.selectedRole || 'General Analysis',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stagedStep, setStagedStep] = useState(0)

  const steps = ['Preparing document', 'Analyzing document', 'Verifying evidence']

  const handleRunAnalysis = useCallback(
    async (overrideRole?: UserRole) => {
      if (!sessionDocument) return

      const targetRole = overrideRole || role
      setIsLoading(true)
      setError(null)

      try {
        const result = await createAnalysis(sessionDocument.metadata.document_id, targetRole)
        onAnalysisComplete(sessionDocument.metadata.document_id, result, targetRole)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unexpected error occurred during document analysis.')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [sessionDocument, role, onAnalysisComplete],
  )

  // Role is initialized from sessionDocument.selectedRole in useState above.
  // When the user navigates to a different document, App.tsx re-mounts AnalyzePage
  // via a key prop, so the initial useState value naturally reflects the new role.

  // Automatically trigger analysis if document has no cached result
  const analysisTriggeredRef = useRef(false)
  useEffect(() => {
    if (
      sessionDocument &&
      !sessionDocument.analysis &&
      !isLoading &&
      !error &&
      !analysisTriggeredRef.current
    ) {
      analysisTriggeredRef.current = true
      handleRunAnalysis()
    }
    if (!sessionDocument) {
      analysisTriggeredRef.current = false
    }
  }, [sessionDocument, isLoading, error, handleRunAnalysis])

  // Honest loading cues: these describe the stages without pretending to know backend progress percentages.
  const prevLoadingRef = useRef(false)
  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      setStagedStep(0)
    }
    prevLoadingRef.current = isLoading

    if (!isLoading) return
    const interval = setInterval(() => {
      setStagedStep((prev) => (prev + 1) % steps.length)
    }, 900)
    return () => clearInterval(interval)
  }, [isLoading, steps.length])

  if (!sessionDocument) {
    return (
      <div className="v-page v-analyze-page">
        <EmptyState
          icon="◉"
          title="No Document Selected"
          description="Choose an existing document from your active session or upload a new file on the Dashboard."
          actionLabel="Go to Dashboard"
          onAction={onNavigateToDashboard}
        />
      </div>
    )
  }

  const meta = sessionDocument.metadata
  const analysis = sessionDocument.analysis

  return (
    <div className="v-page v-analyze-page">
      {/* Workspace Header Bar */}
      <div className="v-workspace-header">
        <div className="v-workspace-title-box">
          <span className="v-doc-big-icon" aria-hidden="true">▤</span>
          <div>
            <h2>{meta.filename}</h2>
            <div className="v-doc-meta-row">
              <span className="v-badge v-badge-indigo">{meta.document_type.toUpperCase()}</span>
              <span>{meta.page_count ? `${meta.page_count} pages` : 'TXT document'}</span>
              <span>•</span>
              <span>{meta.text_length.toLocaleString()} chars</span>
              <span>•</span>
              <span>{meta.chunk_count} chunks</span>
              <span>•</span>
              <span className="font-mono text-xs">ID: {meta.document_id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="v-workspace-actions">
          <button
            type="button"
            className="v-btn v-btn-outline v-btn-sm"
            onClick={() => handleRunAnalysis(role)}
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Re-Run Analysis'}
          </button>
        </div>
      </div>

      {/* Role Context Bar */}
      <div className="v-section-compact">
        <RoleSelector
          value={role}
          onChange={(newRole) => {
            setRole(newRole)
            handleRunAnalysis(newRole)
          }}
          disabled={isLoading}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="v-analysis-loading-card" aria-live="polite" aria-busy="true">
          <div className="v-spinner-lg" aria-hidden="true" />
          <div className="v-loading-steps">
            <h4>Analyzing document</h4>
            <p className="v-step-current">{steps[stagedStep]}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorBanner
          title="Analysis Unsuccessful"
          message={error}
          onRetry={() => handleRunAnalysis(role)}
        />
      )}

      {/* Analysis Workspace Result */}
      {analysis && !isLoading && (
        <AnalysisOverview analysis={analysis} filename={meta.filename} />
      )}
    </div>
  )
}
