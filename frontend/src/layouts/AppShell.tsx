import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  onReturnToSite: () => void
}

export function AppShell({
  children,
  activeTab,
  activeDocument,
  sessionDocCount,
  onTabChange,
  onReturnToSite,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasMobileNavOpen = useRef(false)

  useEffect(() => {
    if (!mobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    const desktopQuery = window.matchMedia('(min-width: 1021px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileNavOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      desktopQuery.removeEventListener('change', closeOnDesktop)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen && wasMobileNavOpen.current) menuButtonRef.current?.focus()
    wasMobileNavOpen.current = mobileNavOpen
  }, [mobileNavOpen])

  return (
    <div className="v-app-shell">
      <div className="v-mobile-header" inert={mobileNavOpen}>
        <div className="v-mobile-brand" aria-label="Vericla Legal Intelligence">
          <span className="v-brand-logo" aria-hidden="true"><span>V</span></span>
          <span className="v-brand-text">
            <span className="v-brand-title">Vericla</span>
            <span className="v-brand-sub">Legal Intelligence</span>
          </span>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="v-mobile-menu-button"
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
        >
          <span aria-hidden="true"><i /><i /><i /></span>
        </button>
      </div>

      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        sessionDocCount={sessionDocCount}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onReturnToSite={() => {
          setMobileNavOpen(false)
          onReturnToSite()
        }}
      />
      {mobileNavOpen && (
        <button
          type="button"
          className="v-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main App Workspace */}
      <div className="v-main-wrapper" inert={mobileNavOpen}>
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
