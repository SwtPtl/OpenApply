import { useState, useEffect } from 'react';
import { Zap, User, Briefcase, Settings, ChevronRight, Circle } from 'lucide-react';
import ProfileTab from './tabs/ProfileTab';
import TrackerTab from './tabs/TrackerTab';
import SettingsTab from './tabs/SettingsTab';
import HomeTab from './tabs/HomeTab';

type Tab = 'home' | 'profile' | 'tracker' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [companionOnline, setCompanionOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkCompanion();
    const id = setInterval(checkCompanion, 10000);
    return () => clearInterval(id);
  }, []);

  async function checkCompanion() {
    try {
      const r = await fetch('http://localhost:7523/health', { signal: AbortSignal.timeout(2000) });
      setCompanionOnline(r.ok);
    } catch {
      setCompanionOnline(false);
    }
  }

  async function toggleSidebar() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }, () => {
          if (chrome.runtime.lastError) {
            alert('Cannot analyze this page yet. Please refresh the job posting page and try again (content script needs to load).');
          } else {
            window.close();
          }
        });
      }
    });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Zap size={14} /> },
    { id: 'profile', label: 'Profile', icon: <User size={14} /> },
    { id: 'tracker', label: 'Applied', icon: <Briefcase size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 0',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 60%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>OpenApply</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Circle
              size={7}
              fill={companionOnline ? 'var(--success)' : companionOnline === false ? 'var(--danger)' : 'var(--text-muted)'}
              color="transparent"
            />
            <span style={{ fontSize: 11, color: companionOnline ? 'var(--success)' : 'var(--text-muted)' }}>
              {companionOnline ? 'Companion online' : companionOnline === false ? 'Companion offline' : '…'}
            </span>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 4px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === t.id ? 'var(--accent-bright)' : 'var(--text-muted)',
                fontWeight: activeTab === t.id ? 600 : 500,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {activeTab === 'home' && <HomeTab onOpen={toggleSidebar} companionOnline={companionOnline} />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'tracker' && <TrackerTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Footer CTA — always visible */}
      {activeTab === 'home' && (
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary btn-full pulse" onClick={toggleSidebar}>
            <Zap size={14} fill="currentColor" />
            Analyze This Job
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>
        </div>
      )}
    </div>
  );
}
