import { useState, useEffect } from 'react';
import { Briefcase, ExternalLink, Trash2 } from 'lucide-react';
import type { Application } from '../../types';

const STATUS_COLORS: Record<Application['status'], string> = {
  Applied: 'var(--accent-bright)',
  Interview: 'var(--warning)',
  Offer: 'var(--success)',
  Rejected: 'var(--danger)',
  Ghosted: 'var(--text-muted)',
};

export default function TrackerTab() {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    chrome.storage.local.get('openapply_applications', (r) => {
      setApps((r.openapply_applications as Application[]) || []);
    });
  }, []);

  function deleteApp(id: string) {
    const updated = apps.filter((a) => a.id !== id);
    setApps(updated);
    chrome.storage.local.set({ openapply_applications: updated });
  }

  if (apps.length === 0) {
    return (
      <div className="empty-state">
        <Briefcase size={36} color="var(--text-muted)" />
        <h3 style={{ color: 'var(--text-secondary)' }}>No applications yet</h3>
        <p style={{ fontSize: 12 }}>Jobs you analyze and fill will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
        {apps.length} application{apps.length !== 1 ? 's' : ''} tracked
      </p>
      {apps.map((app) => (
        <div key={app.id} style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.company}</p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
              <a href={app.url} target="_blank" rel="noopener" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                <ExternalLink size={12} />
              </a>
              <button onClick={() => deleteApp(app.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: STATUS_COLORS[app.status], letterSpacing: '0.05em',
            }}>
              {app.status}
            </span>
            {app.fitScore !== undefined && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score: {app.fitScore}%</span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{app.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
