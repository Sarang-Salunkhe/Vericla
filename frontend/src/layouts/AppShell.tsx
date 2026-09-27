import type { ReactNode } from 'react'
import type { NavTab } from '../types'
import type { DocumentMetadataResponse } from '../services/documents'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'

interface AppShellProps {
  children: ReactNode
  activeTab: NavTab
  activeDocument: DocumentMetadataResponse | null
  sessionDocCount: number
  onTabChange: (tab: NavTab) => void
}

export function AppShell({
  children,
  activeTab,
  activeDocument,
  sessionDocCount,
  onTabChange,
}: AppShellProps) {
  return (
    <div className="v-app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        sessionDocCount={sessionDocCount}
      />

      {/* Main App Workspace */}
      <div className="v-main-wrapper">
        <Header
          activeTab={activeTab}
          activeDocument={activeDocument}
          onTabChange={onTabChange}
        />

        <main className="v-main-content">{children}</main>
      </div>
    </div>
  )
}
