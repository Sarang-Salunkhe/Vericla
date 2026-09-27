import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { uploadDocument, type DocumentMetadataResponse } from '../services/documents'
import { ErrorBanner } from './ErrorBanner'

interface UploadCardProps {
  onSuccess: (document: DocumentMetadataResponse) => void
  onStartUpload?: () => void
}

export function UploadCard({ onSuccess, onStartUpload }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      setFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleUploadSubmit = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    if (onStartUpload) onStartUpload()

    try {
      const res = await uploadDocument(file)
      onSuccess(res)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred while processing the document.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeLabel = (name: string): string => name.split('.').pop()?.toUpperCase() || 'FILE'

  return (
    <div className="v-upload-box">
      <div
        className={`v-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="v-drop-icon" aria-hidden="true">
          📄
        </div>

        {file ? (
          <div className="v-file-preview">
            <span className="v-file-name">{file.name}</span>
            <span className="v-file-meta">
              {formatBytes(file.size)} • {file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="v-drop-prompt">
            <p className="v-drop-main">Drag & drop legal document here, or browse</p>
            <p className="v-drop-sub">Supported formats: PDF, TXT (Maximum size: 10 MB)</p>
          </div>
        )}
      </div>

      {file && !isUploading && (
        <div className="v-upload-summary">
          <div className="v-file-summary">
            <span className="v-file-name">{file.name}</span>
            <span className="v-file-meta">
              {getTypeLabel(file.name)} • {formatBytes(file.size)}
            </span>
          </div>
          <div className="v-upload-actions">
            <button type="button" className="v-btn v-btn-ghost v-btn-sm" onClick={handleClear}>
              Clear Selection
            </button>
            <button type="button" className="v-btn v-btn-primary" onClick={handleUploadSubmit}>
              Upload & Ingest Document
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="v-staged-loader" aria-live="polite" aria-busy="true">
          <div className="v-spinner" aria-hidden="true" />
          <div className="v-loader-info">
            <p className="v-loader-status">Preparing document</p>
            <p className="v-loader-sub">Ingesting and normalizing the source text while Vericla checks the document structure.</p>
          </div>
        </div>
      )}

      {error && (
        <ErrorBanner
          title="Upload Failed"
          message={error}
          onRetry={handleUploadSubmit}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  )
}
