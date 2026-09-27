interface ErrorBannerProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorBanner({
  title = 'Processing Error',
  message,
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  return (
    <div className="v-error-banner" role="alert" aria-live="assertive">
      <div className="v-error-icon" aria-hidden="true">
        ⚠️
      </div>
      <div className="v-error-body">
        <h4 className="v-error-title">{title}</h4>
        <p className="v-error-message">{message}</p>
      </div>
      <div className="v-error-actions">
        {onRetry && (
          <button type="button" className="v-btn v-btn-sm v-btn-outline-danger" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button type="button" className="v-btn v-btn-sm v-btn-ghost" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
