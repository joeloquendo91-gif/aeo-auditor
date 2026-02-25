'use client'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'

const C = {
  bg: '#fafaf9',
  bgCard: '#ffffff',
  bgMuted: '#f4f4f2',
  border: '#e8e8e5',
  borderStrong: '#d0d0cb',
  accent: '#1a1a1a',
  blue: '#2563eb',
  textPrimary: '#111110',
  textSecondary: '#6b6b63',
  textDim: '#a8a89e',
}

const MOCK_RESULT = {
  url: 'clevelandclinic.org/health/articles/immune-system',
  title: 'Immune System Function, Conditions & Disorders',
  entities: [
    { name: 'immune system', salience: 0.483 },
    { name: 'body', salience: 0.128 },
    { name: 'Advertising', salience: 0.044 },
    { name: 'white blood cells', salience: 0.038 },
    { name: 'antibodies', salience: 0.031 },
  ],
  audit: `## Why AI May Not Be Citing This

**1. Boilerplate repetition pollutes content signal**
The advertising disclaimer appears at least twice in the content stream, competing with actual medical entities. AI systems performing passage retrieval encounter these non-informational blocks interleaved with answers, degrading extraction quality.
→ Fix: Isolate disclaimers and CTAs into aside elements so they don't appear inline with educational content.

**2. Answers lack mechanistic depth**
The content provides generalist definitions without the quantitative or mechanistic detail AI systems prefer to cite. The "How does the immune system work?" section uses high-level bullets but never explains a single mechanism.
→ Fix: Add 2–3 sentences of mechanistic explanation under each bullet — e.g. how B-cells produce antibodies, what immunological memory means.

**3. No direct extractable answer per heading**
AI systems match content to queries. No single question on this page gets a definitive 40–60 word direct answer before expanding into detail.
→ Fix: Add a bolded 1–2 sentence direct answer immediately after each H2 question heading before expanding.

**4. Entity co-occurrence for medical authority is weak**
Critical entities like lymphocytes, antigens, bone marrow, thymus, innate immunity, adaptive immunity are absent from top NLP signals.
→ Fix: Intentionally integrate 15–20 core immunology entities throughout, each contextually explained.`,
  findings: [
    { label: 'Boilerplate noise', severity: 'high' },
    { label: 'Low answer density', severity: 'high' },
    { label: 'Missing entity depth', severity: 'medium' },
    { label: 'No direct answer blocks', severity: 'medium' },
  ],
  quickWins: [
    'Add a direct 1–2 sentence answer after every H2',
    'Remove inline ad disclaimers from content flow',
    'Integrate 15+ named immunology entities with context',
  ],
}

const severityColor = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
const severityBg = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' }
const severityBorder = { high: '#fecaca', medium: '#fde68a', low: '#bbf7d0' }

export default function Home() {
  const [url, setUrl] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState('')
  const [showMock, setShowMock] = useState(true)

  async function analyze() {
    if (!url) return
    setLoading(true)
    setError('')
    setReport(null)
    setShowMock(false)

    setStatus('Fetching content...')
    await new Promise(r => setTimeout(r, 900))
    setStatus('Extracting entities with Google NLP...')
    await new Promise(r => setTimeout(r, 900))
    setStatus('Running AEO audit with Claude...')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, keyword }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  const activeResult = report
    ? {
        url,
        title: report.content?.title,
        entities: report.entities,
        audit: report.audit,
        findings: null,
        quickWins: null,
      }
    : showMock ? MOCK_RESULT : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fafaf9; }
        .input-field { transition: border-color 0.15s, box-shadow 0.15s; }
        .input-field:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important; }
        .analyze-btn { transition: all 0.15s ease; }
        .analyze-btn:hover:not(:disabled) { background: #333 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
        .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .step-card:hover { background: #f8f8f6 !important; }
        .buyer-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .pill:hover { border-color: #d0d0cb !important; color: #6b6b63 !important; }
        .arrow-anim { animation: bounce 1.8s ease-in-out infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .fade-up { opacity: 0; transform: translateY(18px); animation: fadeUp 0.6s ease forwards; }
        .d1{animation-delay:0.05s} .d2{animation-delay:0.16s} .d3{animation-delay:0.27s} .d4{animation-delay:0.38s} .d5{animation-delay:0.49s}
        @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
        .cta-btn { transition: all 0.15s ease; }
        .cta-btn:hover { background: #f0f0ee !important; transform: translateY(-1px); }
        .nav-link:hover { border-color: #d0d0cb !important; color: #111110 !important; }
      `}</style>

      <div style={{ fontFamily: "'Geist', system-ui, sans-serif", color: C.textPrimary, minHeight: '100vh', background: C.bg }}>

        {/* NAV */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 48px', borderBottom: `1px solid ${C.border}`,
          background: 'rgba(250,250,249,0.95)', position: 'sticky', top: 0, zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, background: C.accent, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 700,
              fontFamily: "'Libre Baskerville', serif",
            }}>A</div>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>AEO Auditor</span>
          </div>
        </nav>

        {/* HERO */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 0', textAlign: 'center' }}>
          <div className="fade-up d1" style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', background: '#eff6ff',
              border: '1px solid #bfdbfe', borderRadius: 20,
              fontSize: 12, color: C.blue, fontFamily: "'Geist Mono', monospace",
            }}>
              <span style={{ width: 5, height: 5, background: C.blue, borderRadius: '50%' }} />
              AI-powered content intelligence
            </span>
          </div>

          <h1 className="fade-up d2" style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 'clamp(38px, 5.5vw, 60px)',
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: '-0.02em', color: C.textPrimary, marginBottom: 20,
          }}>
            Find out why AI isn't<br />
            <em style={{ fontStyle: 'italic', color: C.blue }}>citing your content</em>
          </h1>

          <p className="fade-up d3" style={{
            fontSize: 18, color: C.textSecondary, lineHeight: 1.75,
            maxWidth: 520, margin: '0 auto 32px',
          }}>
            Drop in a URL. Get back a structured audit explaining exactly what's blocking AI citation — and what to fix.
          </p>

          {/* Pills */}
          <div className="fade-up d4" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {['Blog posts', 'Landing pages', 'Service pages', 'Health content', 'How-to guides'].map(s => (
              <span key={s} className="pill" style={{
                padding: '4px 12px', background: C.bgMuted,
                border: `1px solid ${C.border}`, borderRadius: 20,
                fontSize: 12, color: C.textDim,
                fontFamily: "'Geist Mono', monospace",
                transition: 'all 0.15s',
              }}>{s}</span>
            ))}
          </div>

          <div className="fade-up d5" style={{ marginBottom: 20 }}>
            <svg className="arrow-anim" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block', opacity: 0.3 }}>
              <path d="M12 5v14M5 12l7 7 7-7" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* INPUT CARD */}
        <div className="fade-up d5" style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            background: 'white', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <input
                className="input-field"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="https://yoursite.com/page-to-audit"
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.bg,
                  color: C.textPrimary, fontSize: 14,
                  fontFamily: "'Geist Mono', monospace",
                }}
              />
              <button
                className="analyze-btn"
                onClick={analyze}
                disabled={loading || !url}
                style={{
                  padding: '12px 22px', borderRadius: 8, border: 'none',
                  background: C.accent, color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Geist', sans-serif", whiteSpace: 'nowrap',
                }}
              >
                {loading ? status : 'Analyze →'}
              </button>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <input
                className="input-field"
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Target keyword (optional) — e.g. IVF treatment options"
                style={{
                  width: '100%', padding: '8px 4px', border: 'none',
                  background: 'transparent', color: C.textSecondary, fontSize: 13,
                  fontFamily: "'Geist', sans-serif",
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ maxWidth: 680, margin: '12px auto', padding: '0 24px' }}>
            <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontSize: 13 }}>{error}</div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: 13, fontFamily: "'Geist Mono', monospace", color: C.blue, marginBottom: 8 }}>analyzing...</div>
            <p style={{ color: C.textDim, fontSize: 14 }}>{status}</p>
          </div>
        )}

        {/* STATS BAR */}
        {!loading && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 64,
            padding: '28px 48px', marginTop: 64,
            background: C.bgMuted, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          }}>
            {[['<30s', 'Per audit'], ['4+', 'AEO signals'], ['NLP', 'Entity analysis'], ['100%', 'Actionable output']].map(([stat, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, fontWeight: 700, color: C.textPrimary }}>{stat}</div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 4, fontFamily: "'Geist Mono', monospace" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* RESULT */}
        {!loading && activeResult && (
          <div style={{ maxWidth: 720, margin: '64px auto 0', padding: '0 24px 80px' }}>

            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              {report ? 'Audit Result' : 'Sample Output'}
            </div>

            {/* Page header card */}
            <div style={{
              background: 'white', border: `1px solid ${C.border}`, borderRadius: 16,
              overflow: 'hidden', marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
                background: C.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: C.textDim }}>
                  {activeResult.url?.replace('https://', '').slice(0, 60)}
                </span>
                {!report && (
                  <span style={{
                    padding: '2px 8px', background: '#eff6ff', borderRadius: 4,
                    fontFamily: "'Geist Mono', monospace", fontSize: 10, color: C.blue,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>Example</span>
                )}
                {report && (
                  <button
                    onClick={() => navigator.clipboard.writeText(activeResult.audit)}
                    style={{
                      padding: '4px 12px', background: 'transparent', border: `1px solid ${C.border}`,
                      borderRadius: 6, fontSize: 11, color: C.textDim, cursor: 'pointer',
                      fontFamily: "'Geist', sans-serif",
                    }}
                  >Copy report</button>
                )}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: C.textPrimary, marginBottom: 16 }}>
                  {activeResult.title}
                </div>

                {/* Entities */}
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  Top entities detected
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeResult.entities?.slice(0, 8).map((e: any, i: number) => (
                    <span key={i} style={{
                      padding: '4px 12px', background: C.bgMuted,
                      border: `1px solid ${C.border}`, borderRadius: 20,
                      fontSize: 12, color: C.textSecondary,
                      fontFamily: "'Geist Mono', monospace",
                    }}>
                      {e.name} <span style={{ color: C.textDim }}>{((e.salience ?? 0) * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings pills — mock only */}
            {activeResult.findings && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {activeResult.findings.map((f: any, i: number) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    background: severityBg[f.severity as keyof typeof severityBg],
                    border: `1px solid ${severityBorder[f.severity as keyof typeof severityBorder]}`,
                    borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{f.label}</span>
                    <span style={{
                      fontSize: 10, fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: severityColor[f.severity as keyof typeof severityColor],
                    }}>{f.severity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Audit findings */}
            <div style={{
              background: 'white', border: `1px solid ${C.border}`, borderRadius: 16,
              padding: 24, marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                AEO Findings
              </div>
              <ReactMarkdown
                components={{
                  h2: (props) => <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: C.textPrimary, marginTop: 24, marginBottom: 8 }}>{props.children}</div>,
                  h3: (props) => <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginTop: 16, marginBottom: 6 }}>{props.children}</div>,
                  p: (props) => <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8, marginBottom: 12 }}>{props.children}</p>,
                  strong: (props) => <strong style={{ color: C.textPrimary, fontWeight: 600 }}>{props.children}</strong>,
                  li: (props) => <li style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8, marginBottom: 6 }}>{props.children}</li>,
                  ul: (props) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{props.children}</ul>,
                }}
              >
                {activeResult.audit}
              </ReactMarkdown>
            </div>

            {/* Quick wins — mock only */}
            {activeResult.quickWins && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 16, padding: 24,
              }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                  Quick Wins
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeResult.quickWins.map((w: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: C.textPrimary }}>
                      <span style={{ color: C.blue, fontWeight: 700, flexShrink: 0 }}>✓</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* HOW IT WORKS */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '88px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              From raw URL to a client-ready<br />audit in three steps
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: C.border, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {[
              { num: '01', icon: '⌘', title: 'Drop in a URL', desc: 'Paste any published page — blog post, service page, landing page. Add a target keyword for deeper analysis.' },
              { num: '02', icon: '◈', title: 'NLP + AI analysis', desc: 'Google NLP extracts entity salience signals. Claude audits answer density, structure gaps, and topical completeness.' },
              { num: '03', icon: '◎', title: 'Get actionable findings', desc: 'Specific reasons why AI isn\'t citing the page — each finding includes a one-sentence fix.' },
            ].map(item => (
              <div key={item.num} className="step-card" style={{ background: 'white', padding: '32px 28px', transition: 'background 0.15s' }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: C.textDim, marginBottom: 16 }}>{item.num}</div>
                <div style={{ fontSize: 22, marginBottom: 14 }}>{item.icon}</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>{item.title}</div>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WHO IT'S FOR */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '88px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Who it's for</div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Built for teams who publish<br />content that needs to perform
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              {
                icon: '🏢', title: 'Agency Consultants',
                desc: 'Audit client content before publishing. Deliver AEO gap reports as part of your SEO retainer.',
                points: ['Audit pages before they go live', 'Identify why existing pages underperform', 'Surface entity and structure gaps', 'Brief-ready findings for client calls'],
              },
              {
                icon: '✍️', title: 'Writing Teams',
                desc: 'Stop guessing what AI systems want. Get specific structural and content fixes before you hit publish.',
                points: ['Check answer extractability', 'See what entities are missing', 'Understand heading structure issues', 'Fix content before it goes live'],
              },
            ].map(buyer => (
              <div key={buyer.title} className="buyer-card" style={{
                background: 'white', border: `1px solid ${C.border}`,
                borderRadius: 16, padding: 36,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ fontSize: 26, marginBottom: 16 }}>{buyer.icon}</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>{buyer.title}</div>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.75, marginBottom: 20 }}>{buyer.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {buyer.points.map((point, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, color: C.textSecondary }}>
                      <span style={{ color: C.blue, marginTop: 1, flexShrink: 0, fontWeight: 600 }}>✓</span>{point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '88px 24px 100px' }}>
          <div style={{ background: C.accent, borderRadius: 20, padding: '64px 48px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color: 'white', marginBottom: 14, letterSpacing: '-0.02em' }}>
              Ready to try it?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.7 }}>
              Paste your first URL and get an AEO audit in under 30 seconds. No setup required.
            </p>
            <button
              className="cta-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                padding: '13px 32px', background: 'white', color: C.accent,
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Geist', sans-serif",
              }}
            >
              Analyze a URL →
            </button>
          </div>
        </div>

      </div>
    </>
  )
}