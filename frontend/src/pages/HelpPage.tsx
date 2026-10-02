export function HelpPage() {
  return (
    <div className="v-page v-help-page">
      <div className="v-section-header">
        <h2>Help, AI Safety & Disclaimers</h2>
        <p>Vericla analyzes supplied documents, identifies important information, and links explanations back to source evidence.</p>
      </div>

      <div className="v-help-grid">
        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">§</span>
            <h3>What Vericla does</h3>
          </div>
          <ul className="v-help-list">
            <li>Analyzes supplied documents to identify important clauses and obligations.</li>
            <li>Provides grounded Q&A based on the document content that was uploaded.</li>
            <li>Compares two documents in the current session and highlights differences.</li>
            <li>Links explanations to text evidence wherever available.</li>
          </ul>
        </div>

        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">◇</span>
            <h3>What Vericla does not do</h3>
          </div>
          <ul className="v-help-list">
            <li>Does not replace a lawyer.</li>
            <li>Does not guarantee legal outcomes.</li>
            <li>Does not determine legality from unsupported context.</li>
            <li>Does not invent missing facts when the document does not say them.</li>
          </ul>
        </div>

        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">⌖</span>
            <h3>Evidence-first model</h3>
          </div>
          <p className="v-card-desc">
            Explanations are grounded in the supplied document. Where evidence is available, the UI shows the source excerpt and the relevant reference points.
          </p>
          <div className="v-disclaimer-box">
            <strong>Important:</strong> AI output can have uncertainty. Vericla is designed to prioritize source-backed statements and transparent uncertainty levels.
          </div>
        </div>

        <div className="v-card">
          <div className="v-card-header">
            <span className="v-card-icon" aria-hidden="true">◌</span>
            <h3>Session privacy behavior</h3>
          </div>
          <p className="v-card-desc">
            Uploaded documents and analysis results are currently handled in ephemeral session storage only. They are not presented as permanent cloud history.
          </p>
          <p className="v-card-desc">
            Document text is treated as untrusted input and is never rendered as executable HTML.
          </p>
        </div>
      </div>
    </div>
  )
}
