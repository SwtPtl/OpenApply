import { Zap, Globe, FileText, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';

interface Props {
  onOpen: () => void;
  companionOnline: boolean | null;
}

export default function HomeTab({ onOpen, companionOnline }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!companionOnline && companionOnline !== null && (
        <div style={{
          display: 'flex', gap: 10, flexDirection: 'column',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Companion offline</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                The local Python service is not running. 
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            onClick={async () => {
              const res = await chrome.runtime.sendMessage({ type: 'START_COMPANION' });
              if (res?.error) alert(`Could not start companion. Ensure you ran install_host.bat first.\\n\\nError: ${res.error}`);
            }}
          >
             <Zap size={14} fill="currentColor" /> Start Local Companion
          </button>
        </div>
      )}

      {/* Hero */}
      <div style={{
        padding: '18px 16px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))',
        border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Job AI in one click</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Navigate to any job posting, then click<br /><strong style={{ color: 'var(--accent-bright)' }}>Analyze This Job</strong> below.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: <Globe size={14} />, text: 'Works on any job posting — Greenhouse, Lever, Workday, LinkedIn, Indeed…' },
          { icon: <FileText size={14} />, text: 'Tailored resume bullets in seconds using your own project files' },
          { icon: <MessageSquare size={14} />, text: 'Cover letter + honest fit feedback with keyword gap analysis' },
          { icon: <Zap size={14} />, text: 'One-click autofill on supported ATS platforms' },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '8px 10px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
