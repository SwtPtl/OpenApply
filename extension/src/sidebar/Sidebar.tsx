import { useState, useEffect } from 'react';
import {
  X, Zap, FileText, MessageSquare, ThumbsUp,
  Copy, Check, Loader2, AlertTriangle, ExternalLink, FileDown
} from 'lucide-react';
import type { JobContext, GenerationResult } from '../types';

type Tab = 'resume' | 'cover' | 'feedback';

export default function Sidebar() {
  const [job, setJob] = useState<JobContext | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [copied, setCopied] = useState<string | null>(null);

  // Receive messages from content script
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    // Request job context on mount
    window.parent.postMessage({ type: 'REQUEST_JOB_CONTEXT' }, '*');
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleMessage(event: MessageEvent) {
    if (event.data?.type === 'JOB_CONTEXT') setJob(event.data.payload);
  }

  function close() {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  }

  async function generate() {
    if (!job) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GENERATE', payload: job });
      if (response?.error) throw new Error(response.error);
      setResult(response);
      setActiveTab('resume');
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resume', label: 'Resume', icon: <FileText size={13} /> },
    { id: 'cover', label: 'Cover Letter', icon: <MessageSquare size={13} /> },
    { id: 'feedback', label: 'Feedback', icon: <ThumbsUp size={13} /> },
  ];

  const scoreColor = result
    ? result.fit_score >= 75 ? 'var(--success)'
    : result.fit_score >= 50 ? 'var(--warning)'
    : 'var(--danger)'
    : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26,
              background: 'var(--accent)',
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={13} color="var(--bg-surface)" fill="var(--bg-surface)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>OpenApply</span>
          </div>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Job pill */}
        {job ? (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                {job.title || 'Job posting detected'}
              </p>
              <a href={job.url} target="_blank" rel="noopener" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {job.company && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.company}</span>}
              {job.atsType && job.atsType !== 'unknown' && (
                <span className="badge badge-accent" style={{ fontSize: 9 }}>{job.atsType}</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <AlertTriangle size={13} color="var(--warning)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Navigate to a job posting to begin.</span>
          </div>
        )}
      </div>

      {/* ── Generate button ── */}
      {!result && !loading && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            className="btn btn-primary btn-full pulse"
            onClick={generate}
            disabled={!job || loading}
          >
            <Zap size={14} fill="currentColor" />
            Generate Resume + Cover + Feedback
          </button>
          {error && (
            <div style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11, color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="loader-wrap" style={{ flex: 1 }}>
          <Loader2 size={28} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Generating…</p>
          <p style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
            Analyzing the job description<br />and tailoring your documents.
          </p>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <>
          {/* Score strip */}
          <div style={{
            padding: '10px 16px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              border: `2.5px solid ${scoreColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${scoreColor}44`,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{result.fit_score}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 3 }}>Fit Score</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {result.keywords_matched.slice(0, 5).map((k) => (
                  <span key={k} className="pill pill-green" style={{ fontSize: 10 }}>{k}</span>
                ))}
                {result.keywords_missing.slice(0, 3).map((k) => (
                  <span key={k} className="pill pill-red" style={{ fontSize: 10 }}>{k}</span>
                ))}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setResult(null); setError(null); }}
              style={{ flexShrink: 0 }}
            >
              Redo
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ padding: '10px 16px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="tab-bar">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`tab${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="sidebar-body slide-up">
            {activeTab === 'resume' && (
              <ResumeTab result={result} copy={copy} copied={copied} />
            )}
            {activeTab === 'cover' && (
              <CoverTab result={result} copy={copy} copied={copied} />
            )}
            {activeTab === 'feedback' && (
              <FeedbackTab result={result} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Resume Tab ──────────────────────────────────────────────────────────────
function ResumeTab({ result, copy, copied }: { result: GenerationResult; copy: (t: string, k: string) => void; copied: string | null }) {
  const allText = [
    `EDUCATION\n${result.resume_bullets.education}`,
    `COURSEWORK\n${result.resume_bullets.coursework}`,
    `EXPERIENCE BULLETS\n${result.resume_bullets.experience.map(b => `• ${b}`).join('\n')}`,
    `SKILLS\n${result.resume_bullets.skills.join(', ')}`,
  ].join('\n\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {result.resume_pdf_url ? (
          <a href={`http://localhost:7523${result.resume_pdf_url}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--accent)', fontWeight: 600 }}>
            <FileDown size={12} /> Download PDF
          </a>
        ) : <div />}
        <button className="btn btn-ghost btn-sm" onClick={() => copy(allText, 'resume-all')}>
          {copied === 'resume-all' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy content</>}
        </button>
      </div>

      <Section title="Education" onCopy={() => copy(result.resume_bullets.education, 'education')} copied={copied === 'education'}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.resume_bullets.education}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 8 }}>{result.resume_bullets.coursework}</p>
      </Section>

      <Section title="Experience Bullets" onCopy={() => copy(result.resume_bullets.experience.map(b => `• ${b}`).join('\n'), 'exp')} copied={copied === 'exp'}>
        <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.resume_bullets.experience.map((b, i) => (
            <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>▸</span>
              {b}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills" onCopy={() => copy(result.resume_bullets.skills.join(', '), 'skills')} copied={copied === 'skills'}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {result.resume_bullets.skills.map((s) => (
            <span key={s} className="pill pill-purple">{s}</span>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Cover Letter Tab ────────────────────────────────────────────────────────
function CoverTab({ result, copy, copied }: { result: GenerationResult; copy: (t: string, k: string) => void; copied: string | null }) {
  const contentToCopy = result.cover_letter || result.latex_cover_letter_body || '';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {result.cover_pdf_url ? (
          <a href={`http://localhost:7523${result.cover_pdf_url}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--accent)', fontWeight: 600 }}>
            <FileDown size={12} /> Download PDF
          </a>
        ) : <div />}
        <button className="btn btn-ghost btn-sm" onClick={() => copy(contentToCopy, 'cover')}>
          {copied === 'cover' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy raw text</>}
        </button>
      </div>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px',
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {contentToCopy || <span style={{color: 'var(--text-muted)'}}>No cover letter content generated.</span>}
      </div>
    </div>
  );
}

// ─── Feedback Tab ────────────────────────────────────────────────────────────
function FeedbackTab({ result }: { result: GenerationResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="✅ Strengths">
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {result.feedback.strengths.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>{s}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="⚠️ Gaps">
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {result.feedback.gaps.map((g, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--warning)', flexShrink: 0 }}>!</span>{g}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="💡 Suggestions">
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {result.feedback.suggestions.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--accent-bright)', flexShrink: 0 }}>→</span>{s}
            </li>
          ))}
        </ul>
      </Section>

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Missing Keywords
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {result.keywords_missing.map((k) => (
            <span key={k} className="pill pill-red">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable section card ───────────────────────────────────────────────────
function Section({ title, children, onCopy, copied }: {
  title: string; children: React.ReactNode;
  onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <h3 style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
        {onCopy && (
          <button onClick={onCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>{children}</div>
    </div>
  );
}
