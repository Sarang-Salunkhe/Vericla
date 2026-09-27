interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon = '📁',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="v-empty-card">
      <div className="v-empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="v-empty-title">{title}</h3>
      <p className="v-empty-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="v-btn v-btn-primary v-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
