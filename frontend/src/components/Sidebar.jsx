import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const views = [
        { id: 'overview', label: 'Dashboard', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
        { id: 'subnet', label: 'Subnet Explorer', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> },
        { id: 'valuation', label: 'Valuation Tools', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    ];

    const resources = [
        { id: 'research', label: 'Research & Insights', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> },
        { id: 'academy', label: 'DeAI Academy', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg> },
        { id: 'intelligence', label: 'Bittensor News', icon: <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> },
    ];

    return (
        <aside className="side">
            <nav className="nav-s">
                <div className="nav-hd">Analytics</div>
                {views.map(view => (
                    <a
                        key={view.id}
                        className={`nav-i ${activeView === view.id ? 'act' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        {view.icon}
                        {view.label}
                    </a>
                ))}
            </nav>

            <nav className="nav-s">
                <div className="nav-hd">Resources</div>
                {resources.map(res => (
                    <a
                        key={res.id}
                        className={`nav-i ${activeView === res.id ? 'act' : ''}`}
                        onClick={() => setActiveView(res.id)}
                    >
                        {res.icon}
                        {res.label}
                    </a>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: '12px', background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '8px', fontSize: '11px', color: 'var(--mute)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--txt2)' }}>Pro Analytics</div>
                Unlock advanced metrics & alerts
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', padding: '0 12px' }}>
                <a href="https://github.com/DeAI-Labs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mute)', cursor: 'pointer' }}>
                    <Github size={18} />
                </a>
                <a href="https://linkedin.com/company/deai-strategies/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mute)', cursor: 'pointer' }}>
                    <Linkedin size={18} />
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
