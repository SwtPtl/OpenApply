import { useState, useEffect } from 'react';
import { Save, Check, Eye, EyeOff } from 'lucide-react';
import { getProfile, saveProfile } from '../../store/profile';

export default function SettingsTab() {
  const [provider, setProvider] = useState('gemini');
  const [companionUrl, setCompanionUrl] = useState('http://localhost:7523');
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProvider(p.llmProvider);
      setCompanionUrl(p.companionUrl);
    });
  }, []);

  async function handleSave() {
    await saveProfile({ llmProvider: provider as any, companionUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section>
        <label className="label">Companion service URL</label>
        <input className="input" value={companionUrl} onChange={e => setCompanionUrl(e.target.value)} placeholder="http://localhost:7523" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Must be running locally. Start with: <code style={{ color: 'var(--accent-bright)' }}>python companion/main.py</code>
        </p>
      </section>

      <div className="divider" />

      <section>
        <label className="label">LLM Provider</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'gemini', name: 'Gemini', tag: 'Google', color: '#4285f4' },
            { id: 'deepseek', name: 'DeepSeek', tag: 'OpenAI-compat', color: '#0ea5e9' },
            { id: 'claude', name: 'Claude', tag: 'Anthropic', color: '#d97706' },
            { id: 'local', name: 'Local LLM', tag: 'Ollama', color: '#10b981' },
          ].map((p) => (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              background: provider === p.id ? 'rgba(139,92,246,0.08)' : 'var(--bg-elevated)',
              border: `1px solid ${provider === p.id ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <input type="radio" name="provider" value={p.id} checked={provider === p.id} onChange={() => setProvider(p.id)} style={{ accentColor: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.name}</span>
              <span style={{ fontSize: 10, color: p.color, background: `${p.color}18`, padding: '2px 7px', borderRadius: 999, fontWeight: 600, marginLeft: 'auto' }}>
                {p.tag}
              </span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          API keys are stored in <code style={{ color: 'var(--accent-bright)' }}>companion/.env</code> — never in the browser.
        </p>
      </section>

      <div className="divider" />

      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        OpenApply v0.1.0 · <a href="https://github.com/swet21/openapply" target="_blank" rel="noopener" style={{ color: 'var(--accent-bright)' }}>GitHub</a>
      </p>

      <button className="btn btn-primary btn-full" onClick={handleSave}>
        {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
      </button>
    </div>
  );
}
