import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { uploadDocument, type DocumentMetadataResponse } from './services/documents'
import './App.css'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState<DocumentMetadataResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setDocument(null)

    try {
      const res = await uploadDocument(file)
      setDocument(res)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred while processing the document.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setDocument(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleString()
  }

  return (
    <div className="app-container">
      {/* Disclaimer Banner */}
      <div className="disclaimer-banner">
        <span className="disclaimer-badge">Disclaimer</span>
        <span>
          Vericla is an AI-powered legal document intelligence assistant. It provides document structure and insights, not definitive legal advice.
        </span>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">V</div>
          <h1>Vericla</h1>
        </div>
        <div className="stage-badge">Stage 2: Document Intelligence Foundation</div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!document && (
          <section className="upload-section">
            <div className="section-title">
              <h2>Upload Legal Document</h2>
              <p>Select a PDF or TXT file to extract, normalize, and generate traceable text chunks.</p>
            </div>

            {/* Dropzone */}
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div className="dropzone-icon">📄</div>
              {file ? (
                <div className="selected-file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatBytes(file.size)}</span>
                </div>
              ) : (
                <div className="dropzone-text">
                  <p className="primary-text">Drag & drop your legal file here, or browse</p>
                  <p className="secondary-text">Supported formats: PDF, TXT (Max size: 10 MB)</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="action-row">
              {file && !isLoading && (
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  Clear
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                disabled={!file || isLoading}
                onClick={handleUpload}
              >
                {isLoading ? 'Processing Document...' : 'Upload & Process'}
              </button>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="loading-card">
                <div className="spinner"></div>
                <div className="loading-text">
                  <p className="loading-status">Ingesting and normalizing document...</p>
                  <p className="loading-subtext">Executing page extraction, layout normalization, and deterministic chunking.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-card">
                <span className="error-icon">⚠️</span>
                <div className="error-content">
                  <h4>Upload Failed</h4>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Successful Document Metadata Display */}
        {document && (
          <section className="metadata-section">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <div>
                <h2>Document Ready</h2>
                <p>Document session created and stored in ephemeral memory.</p>
              </div>
            </div>

            <div className="metadata-grid">
              <div className="meta-card full-width">
                <span className="meta-label">Session ID (Document ID)</span>
                <span className="meta-value font-mono">{document.document_id}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">File Name</span>
                <span className="meta-value">{document.filename}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Document Format</span>
                <span className="meta-value uppercase-badge">{document.document_type}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Processing Status</span>
                <span className="meta-value status-ready">{document.processing_status}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Page Count</span>
                <span className="meta-value">{document.page_count ?? 'N/A (TXT)'}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Text Length</span>
                <span className="meta-value">{document.text_length.toLocaleString()} chars</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Generated Chunks</span>
                <span className="meta-value">{document.chunk_count} chunks</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Created At</span>
                <span className="meta-value">{formatDate(document.created_at)}</span>
              </div>

              <div className="meta-card">
                <span className="meta-label">Expires At (Session TTL)</span>
                <span className="meta-value">{formatDate(document.expires_at)}</span>
              </div>
            </div>

            <div className="action-row align-right">
              <button type="button" className="btn btn-primary" onClick={handleReset}>
                Upload Another Document
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
