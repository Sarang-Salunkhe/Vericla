import { useState } from 'react'
import { askQuestion } from '../services/qa'
import type { EvidenceReference, UncertaintyState } from '../services/analysis'

interface AskVericlaProps {
  documentId: string
  documentName: string
  onViewEvidence: (references: EvidenceReference[]) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  evidence?: EvidenceReference[]
  uncertainty?: UncertaintyState
  notStated?: string | null
}

const helperText = 'Ask Vericla about this document...'

export function AskVericla({ documentId, documentName, onViewEvidence }: AskVericlaProps) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: `Ask about ${documentName} and Vericla will answer using the supplied document evidence.`,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setError(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setQuestion('')

    try {
      const result = await askQuestion(documentId, trimmed)
      const answerMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.simple_answer,
        evidence: result.evidence,
        uncertainty: result.uncertainty,
        notStated: result.not_stated,
      }

      setMessages((prev) => [...prev, answerMessage])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to answer this question.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section className="v-ask-panel v-span-full" aria-labelledby="ask-vericla-heading">
      <div className="v-card-header">
        <span className="v-card-icon" aria-hidden="true">?</span>
        <div><h3 id="ask-vericla-heading">Ask Vericla</h3><p>Get an answer grounded in this document.</p></div>
      </div>

      <form className="v-qa-form" onSubmit={handleSubmit}>
        <div className="v-qa-composer">
          <label className="v-visually-hidden" htmlFor="qa-question">Ask a question about this document</label>
          <textarea
            id="qa-question"
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={helperText}
            onKeyDown={handleQuestionKeyDown}
            aria-label="Question about the selected document"
            disabled={isLoading}
          />
          <div className="v-qa-composer-footer">
            <span>Answers are grounded in the supplied document evidence.</span>
            <button type="submit" className="v-btn v-btn-primary" disabled={isLoading || !question.trim()}>
              {isLoading ? <><span className="v-spinner" aria-hidden="true" /> Checking</> : <>Ask <span aria-hidden="true">↗</span></>}
            </button>
          </div>
        </div>
        <p className="v-qa-shortcut">Use Ctrl + Enter to submit</p>
      </form>

      {error && <div className="v-error-banner" role="alert">{error}</div>}

      <div className="v-qa-thread" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`v-qa-message ${message.role}`}>
            <div className="v-qa-bubble">
              {message.role === 'assistant' && <span className="v-qa-speaker">VERICLA</span>}
              <p>{message.content}</p>
              {message.role === 'assistant' && message.uncertainty && (
                <div className="v-qa-meta">
                  <span className="v-qa-state">Uncertainty: {message.uncertainty}</span>
                  {message.notStated && <span className="v-qa-state">Not stated: {message.notStated}</span>}
                  {message.evidence && message.evidence.length > 0 && (
                    <button type="button" className="v-ev-tag" onClick={() => onViewEvidence(message.evidence || [])}>
                      <span className="v-ev-icon">📍</span>
                      <span>View evidence</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
