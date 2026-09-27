import type { NavTab } from '../types'

interface SidebarProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  sessionDocCount: number
}

interface NavItem {
  id: NavTab
  label: string
  icon: string
  badge?: string
}

export function Sidebar({ activeTab, onTabChange, sessionDocCount }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: '🔎',
      badge: sessionDocCount > 0 ? `${sessionDocCount}` : undefined,
    },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
    { id: 'history', label: 'History', icon: '⏱️' },
    { id: 'help', label: 'Help & Safety', icon: '🛡️' },
  ]

  return (
    <aside className="v-sidebar">
      {/* Brand */}
      <button
        type="button"
        className="v-sidebar-brand"
        onClick={() => onTabChange('dashboard')}
        aria-label="Go to dashboard"
      >
        <div className="v-brand-logo" aria-hidden="true">V</div>
        <div className="v-brand-text">
          <span className="v-brand-title">Vericla</span>
          <span className="v-brand-sub">Legal Intelligence</span>
        </div>
      </button>

      {/* Nav Menu */}
      <nav className="v-sidebar-nav" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`v-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="v-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="v-nav-label">{item.label}</span>
              {item.badge && <span className="v-nav-badge">{item.badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* Ephemeral Memory Notice */}
      <div className="v-sidebar-footer">
        <div className="v-ephemeral-box">
          <div className="v-ephemeral-header">
            <span className="v-ephemeral-icon">⚡</span>
            <span className="v-ephemeral-title">Session Storage</span>
          </div>
          <p className="v-ephemeral-text">
            Documents exist only in memory for this session and expire after 1 hour.
          </p>
        </div>
      </div>
    </aside>
  )
}
