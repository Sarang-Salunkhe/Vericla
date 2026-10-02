import { useEffect, useRef, useState } from 'react'
import type { NavTab } from '../types'
import './PublicLanding.css'

interface PublicLandingPageProps {
  onOpenWorkspace: (tab?: NavTab) => void
}

const publicLinks = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Safety', href: '#safety' },
]

const featureItems = [
  { number: '01', title: 'Document Analysis', text: 'Surface key clauses, obligations, dates, and review signals.' },
  { number: '02', title: 'Evidence-Grounded Answers', text: 'Ask questions and trace answers back to supplied document evidence.' },
  { number: '03', title: 'Clause Explorer', text: 'Search important clauses and inspect their supporting source text.' },
  { number: '04', title: 'Document Comparison', text: 'Review meaningful changes between documents.' },
]

const workflowSteps = [
  { number: '01', title: 'Upload', text: 'Add a supported document to your workspace.' },
  { number: '02', title: 'Analyze', text: 'Surface relevant clauses, obligations, dates, and signals.' },
  { number: '03', title: 'Ask', text: 'Ask questions using the supplied document as the source.' },
  { number: '04', title: 'Review', text: 'Inspect evidence, compare documents, and organize next steps.' },
]

export function PublicLandingPage({ onOpenWorkspace }: PublicLandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const wasMenuOpen = useRef(false)

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const desktopQuery = window.matchMedia('(min-width: 761px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      desktopQuery.removeEventListener('change', closeOnDesktop)
    }
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) closeButtonRef.current?.focus()
    if (!menuOpen && wasMenuOpen.current) menuButtonRef.current?.focus()
    wasMenuOpen.current = menuOpen
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen && wasMenuOpen.current) menuButtonRef.current?.focus()
    wasMenuOpen.current = menuOpen
  }, [menuOpen])

  const openWorkspace = (tab: NavTab = 'dashboard') => {
    setMenuOpen(false)
    onOpenWorkspace(tab)
  }

  return (
    <div className="public-site" id="top">
      <header className="public-navbar">
        <a className="public-brand" href="#top" aria-label="Vericla home" inert={menuOpen}>
          <span className="v-brand-logo" aria-hidden="true"><span>V</span></span>
          <span className="public-brand-copy">
            <strong>VERICLA</strong>
            <small>LEGAL INTELLIGENCE</small>
          </span>
        </a>

        <nav className="public-nav" aria-label="Main navigation" inert={menuOpen}>
          {publicLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <button type="button" className="v-btn v-btn-primary public-nav-cta" onClick={() => openWorkspace()} inert={menuOpen}>
          Analyze a Document <span aria-hidden="true">↗</span>
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          className="public-menu-button"
          aria-label="Open navigation"
          aria-controls="public-mobile-navigation"
          aria-expanded={menuOpen}
          inert={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span aria-hidden="true"><i /><i /><i /></span>
        </button>
      </header>

      {menuOpen && (
        <>
          <button className="public-mobile-backdrop" type="button" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
          <nav id="public-mobile-navigation" className="public-mobile-nav" aria-label="Mobile navigation">
            <div className="public-mobile-nav-head">
              <span className="public-mobile-label">Explore Vericla</span>
              <button ref={closeButtonRef} type="button" className="public-close-button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            {publicLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<span aria-hidden="true">↗</span></a>
            ))}
            <button type="button" className="v-btn v-btn-primary" onClick={() => openWorkspace()}>
              Analyze a Document <span aria-hidden="true">↗</span>
            </button>
          </nav>
        </>
      )}

      <main inert={menuOpen}>
        <section id="product" className="public-hero">
          <div className="public-hero-copy">
            <p className="public-eyebrow"><span /> Document intelligence, grounded in evidence</p>
            <h1>Understand your documents.<br /><span>Ask better questions.</span></h1>
            <p className="public-hero-description">
              Vericla helps you review documents, trace insights back to their source, ask evidence-grounded questions, and compare changes with clarity.
            </p>
            <div className="public-hero-actions">
              <button type="button" className="v-btn v-btn-primary" onClick={() => openWorkspace()}>
                Analyze a Document <span aria-hidden="true">↗</span>
              </button>
              <a className="public-secondary-link" href="#how-it-works">How Vericla Works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="public-trust-note"><span aria-hidden="true">◇</span> AI-assisted information. Not legal advice.</div>
          </div>

          <div className="public-hero-visual" aria-label="Illustration of the Vericla document review flow">
            <svg className="public-source-art" viewBox="0 0 480 440" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="page-fill" x1="36" y1="50" x2="256" y2="390" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#172435" />
                  <stop offset="1" stopColor="#101925" />
                </linearGradient>
                <linearGradient id="evidence-line" x1="244" y1="203" x2="401" y2="203" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8C91F3" stopOpacity=".72" />
                  <stop offset="1" stopColor="#78B5C8" stopOpacity=".54" />
                </linearGradient>
              </defs>

              <rect x="30.5" y="49.5" width="226" height="329" rx="12" fill="url(#page-fill)" stroke="#506078" />
              <path d="M44 50h199v8a12 12 0 0 1-12 12H56a12 12 0 0 1-12-12v-8Z" fill="#1D2B3D" />
              <rect x="51" y="83" width="26" height="31" rx="6" fill="#28364D" stroke="#53617A" />
              <path d="M58 91h12v15H58z" stroke="#A9B0FF" strokeWidth="1.2" />
              <path d="M61 94h6m-6 3h6m-6 3h4" stroke="#A9B0FF" strokeWidth="1" strokeLinecap="round" />
              <rect x="88" y="87" width="89" height="5" rx="2.5" fill="#D5DCE8" fillOpacity=".84" />
              <rect x="88" y="99" width="63" height="3" rx="1.5" fill="#8796AA" fillOpacity=".65" />
              <rect x="51" y="127" width="153" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".48" />
              <rect x="51" y="138" width="184" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".34" />
              <rect x="51" y="149" width="142" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".34" />

              <rect x="45" y="172" width="196" height="31" rx="5" fill="#747CF5" fillOpacity=".13" stroke="#9298FF" strokeOpacity=".38" />
              <rect x="54" y="182" width="119" height="3.5" rx="1.75" fill="#C7CCFF" fillOpacity=".87" />
              <rect x="54" y="190" width="154" height="3" rx="1.5" fill="#AEB7C9" fillOpacity=".59" />
              <circle cx="230" cy="187.5" r="8" fill="#171F31" stroke="#9298FF" strokeOpacity=".7" />
              <path d="M227.5 187.5h5m-2.5-2.5v5" stroke="#BFC3FF" strokeWidth="1.2" strokeLinecap="round" />

              <rect x="51" y="220" width="174" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".4" />
              <rect x="51" y="231" width="158" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".32" />
              <rect x="45" y="249" width="196" height="31" rx="5" fill="#4D9CAE" fillOpacity=".12" stroke="#79B9CF" strokeOpacity=".38" />
              <rect x="54" y="259" width="142" height="3.5" rx="1.75" fill="#A8D7E1" fillOpacity=".85" />
              <rect x="54" y="267" width="122" height="3" rx="1.5" fill="#AEB7C9" fillOpacity=".55" />
              <circle cx="230" cy="264.5" r="8" fill="#14242E" stroke="#79B9CF" strokeOpacity=".78" />
              <path d="m226.8 264.5 2.1 2.1 4.3-4.5" stroke="#A8D7E1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

              <rect x="51" y="297" width="183" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".38" />
              <rect x="51" y="308" width="164" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".3" />
              <rect x="51" y="319" width="132" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".3" />
              <path d="M239 188h31c20 0 20 28 40 28h21" stroke="url(#evidence-line)" strokeWidth="1.4" strokeDasharray="4 5" />
              <path d="M239 265h24c24 0 23 42 47 42h21" stroke="url(#evidence-line)" strokeWidth="1.4" strokeDasharray="4 5" />
              <circle cx="332" cy="216" r="3" fill="#969CF8" />
              <circle cx="332" cy="307" r="3" fill="#7CBBCB" />

              <rect x="349.5" y="177.5" width="112" height="78" rx="8" fill="#141F2D" stroke="#53617A" />
              <rect x="360" y="189" width="5" height="5" rx="2.5" fill="#969CF8" />
              <rect x="371" y="190" width="48" height="3" rx="1.5" fill="#B9C1D1" fillOpacity=".72" />
              <rect x="360" y="204" width="88" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".5" />
              <rect x="360" y="213" width="74" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".36" />
              <rect x="360" y="229" width="34" height="14" rx="4" fill="#4D9CAE" fillOpacity=".15" />
              <rect x="366" y="234" width="21" height="3" rx="1.5" fill="#8DC7D5" fillOpacity=".84" />

              <rect x="348.5" y="278.5" width="114" height="66" rx="8" fill="#151D31" stroke="#777FE9" strokeOpacity=".48" />
              <path d="M360 294h7l3 3 5-7" stroke="#AEB3FF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="381" y="290" width="47" height="3" rx="1.5" fill="#C2C7FF" fillOpacity=".8" />
              <rect x="360" y="310" width="86" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".48" />
              <rect x="360" y="320" width="65" height="3" rx="1.5" fill="#9CAABD" fillOpacity=".34" />
              <circle cx="445" cy="334" r="2" fill="#79B98A" />
            </svg>
            <div className="public-flow-panel">
              <div className="public-flow-heading"><span>VERICLA WORKFLOW</span><span className="public-flow-status">● SOURCE-LED</span></div>
              {['Document', 'Analysis', 'Evidence', 'Insight'].map((step, index) => (
                <div className="public-flow-step" key={step}>
                  <span className="public-flow-number">0{index + 1}</span>
                  <strong>{step}</strong>
                  <span className="public-flow-arrow" aria-hidden="true">{index < 3 ? '↓' : '✓'}</span>
                </div>
              ))}
            </div>
            <p className="public-visual-caption">A clearer path from source text to understanding</p>
          </div>
          <a className="public-scroll-cue" href="#features" aria-label="Scroll to product features"><span /> Explore Vericla</a>
        </section>

        <section id="features" className="public-section public-features">
          <div className="public-section-heading">
            <p className="public-eyebrow">The workspace</p>
            <h2>Built for clearer document understanding.</h2>
            <p>Practical tools for exploring the documents in front of you.</p>
          </div>
          <div className="public-feature-grid">
            {featureItems.map((feature) => (
              <article className="public-feature" key={feature.number}>
                <span className="public-feature-number">{feature.number}</span>
                <div className="public-feature-mark" aria-hidden="true">{['⌕', '⌖', '§', '⇄'][Number(feature.number) - 1]}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="public-section public-workflow-section">
          <div className="public-section-heading">
            <p className="public-eyebrow">A considered process</p>
            <h2>From document to understanding.</h2>
            <p>Stay close to the source at every step.</p>
          </div>
          <div className="public-workflow-grid">
            {workflowSteps.map((step) => (
              <article className="public-workflow-card" key={step.number}>
                <span className="public-workflow-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-evidence-section">
          <div className="public-evidence-copy">
            <p className="public-eyebrow">Evidence-first by design</p>
            <h2>Every insight should have a source.</h2>
            <p>Vericla is designed to connect analysis and answers back to the supplied document evidence.</p>
            <a href="#safety" className="public-inline-link">See how we approach safety <span aria-hidden="true">↗</span></a>
          </div>
          <div className="public-evidence-visual" aria-label="An insight connected to a source excerpt and document">
            <div className="public-evidence-node public-insight-node"><span>INSIGHT</span><strong>Review the finding</strong><small>Analysis or answer</small></div>
            <div className="public-evidence-connector"><span /></div>
            <div className="public-evidence-node public-excerpt-node"><span>SOURCE EXCERPT</span><strong>Inspect the supporting text</strong><small>Shown when evidence is available</small></div>
            <div className="public-evidence-connector"><span /></div>
            <div className="public-evidence-node public-document-node"><span>DOCUMENT</span><strong>Return to the source</strong><small>Your supplied file</small></div>
          </div>
        </section>

        <section id="safety" className="public-section public-safety-section">
          <div className="public-safety-heading">
            <p className="public-eyebrow">Safety & limitations</p>
            <h2>AI-assisted information.<br /><span>Human judgment stays in control.</span></h2>
          </div>
          <ul className="public-safety-list">
            <li>Vericla does not replace qualified legal professionals.</li>
            <li>AI-generated information can be incomplete or incorrect.</li>
            <li>Verify important decisions against the original document and appropriate professional guidance.</li>
            <li>Evidence is shown where available.</li>
          </ul>
        </section>

        <section className="public-final-cta">
          <p className="public-eyebrow">Start with the source</p>
          <h2>Ready to understand your document?</h2>
          <p>Upload a document and explore its clauses, evidence, questions, and changes.</p>
          <button type="button" className="v-btn v-btn-primary" onClick={() => openWorkspace()}>
            Analyze a Document <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>

      <footer className="public-footer" inert={menuOpen}>
        <div className="public-footer-main">
          <div className="public-footer-brand">
            <a className="public-brand" href="#top" aria-label="Vericla home">
              <span className="v-brand-logo" aria-hidden="true"><span>V</span></span>
              <span className="public-brand-copy"><strong>VERICLA</strong><small>LEGAL INTELLIGENCE</small></span>
            </a>
            <p>Understand documents.<br />Ask better questions.</p>
          </div>
          <div className="public-footer-column">
            <h3>Explore</h3>
            {publicLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </div>
          <div className="public-footer-column">
            <h3>Workspace</h3>
            <button type="button" onClick={() => openWorkspace()}>Analyze a Document</button>
            <button type="button" onClick={() => openWorkspace('compare')}>Compare Documents</button>
          </div>
          <div className="public-footer-column">
            <h3>Safety</h3>
            <a href="#safety">Not Legal Advice</a>
          </div>
        </div>
        <div className="public-footer-bottom"><span>© 2026 Vericla</span><span>AI-assisted information, not legal advice.</span></div>
      </footer>
    </div>
  )
}
