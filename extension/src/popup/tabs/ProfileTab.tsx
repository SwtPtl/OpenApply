import { useState, useEffect } from 'react';
import { Save, Check, Zap } from 'lucide-react';
import { getProfile, saveProfile } from '../../store/profile';
import type { UserProfile } from '../../types';

export default function ProfileTab() {
  const [form, setForm] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getProfile().then(setForm); }, []);

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setForm((f) => f ? { ...f, [k]: v } : f);
  }

  async function handleSave() {
    if (!form) return;
    await saveProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function autoFill() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:7523/parse_profile', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(f => f ? { ...f, ...data } : data);
    } catch (e: any) {
      alert(e.message || "Failed to auto-fill profile. Ensure companion is running.");
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
          This data is stored locally and used to autofill job applications.
        </p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={autoFill}
          disabled={loading}
          style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          {loading ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Zap size={12} />}
          Auto-fill from RAG
        </button>
      </div>

      <section>
        <label className="label">Personal</label>
        <div className="form-grid">
          <div className="form-row">
            <div>
              <label className="label">First name</label>
              <input className="input" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="form-row">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={e => update('location', e.target.value)} placeholder="Ottawa, ON" />
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <label className="label">Links</label>
        <div className="form-grid">
          <input className="input" value={form.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/username" />
          <input className="input" value={form.github} onChange={e => update('github', e.target.value)} placeholder="github.com/username" />
          <input className="input" value={form.portfolio} onChange={e => update('portfolio', e.target.value)} placeholder="portfolio.dev" />
        </div>
      </section>

      <div className="divider" />

      <section>
        <label className="label">Work authorization</label>
        <select className="input" value={form.workAuthorization} onChange={e => update('workAuthorization', e.target.value as UserProfile['workAuthorization'])}>
          <option>Canadian Citizen</option>
          <option>Permanent Resident</option>
          <option>Work Permit</option>
          <option>Student Visa</option>
          <option>Other</option>
        </select>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="sponsorship"
            checked={form.requireSponsorship}
            onChange={e => update('requireSponsorship', e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <label htmlFor="sponsorship" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Requires visa sponsorship
          </label>
        </div>
      </section>

      <button className="btn btn-primary btn-full" onClick={handleSave}>
        {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
      </button>
    </div>
  );
}
