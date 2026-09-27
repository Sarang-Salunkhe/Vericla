import type { NavTab } from '../types'
import type { DocumentMetadataResponse } from '../services/documents'

interface HeaderProps {
  activeTab: NavTab
  activeDocument: DocumentMetadataResponse | null
  onTabChange: (tab: NavTab) => void
}

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Dashboard',
  analyze: 'Analysis Workspace',
  compare: 'Document Comparison',
  history: 'Session History',
  help: 'Help & AI Safety',
}

export function Header({ activeTab, activeDocument, onTabChange }: HeaderProps) {
  return (
    <header className="v-header">
      <div className="v-header-left">
        <h1 className="v-header-title">{TAB_TITLES[activeTab]}</h1>
        {activeDocument && activeTab === 'analyze' && (
          <div className="v-header-doc-badge">
            <span className="v-doc-dot" />
            <span className="v-doc-name">{activeDocument.filename}</span>
            <span className="v-doc-type">{activeDocument.document_type.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="v-header-right">
        {activeDocument && activeTab !== 'analyze' && (
          <button
            type="button"
            className="v-btn v-btn-ghost v-btn-sm"
            onClick={() => onTabChange('analyze')}
          >
            Return to Active Document
          </button>
        )}
        <div className="v-disclaimer-pill" title="Vericla provides information assistance, not definitive legal advice.">
          <span className="v-pill-dot" />
          <span>AI Legal Assistant • Not Legal Advice</span>
        </div>
      </div>
    </header>
  )
}
