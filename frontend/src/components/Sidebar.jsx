import React from 'react';
import {
    BarChart2,
    Search,
    Calculator,
    FileText,
    Sparkles,
    Newspaper,
    Lock,
    Github,
    Globe,
    Users,
    FileBarChart2,
    Twitter,
    Linkedin,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeView, setActiveView, isOpen, onClose }) => {
    const { isAdmin } = useAuth();

    const navItems = [
        { id: 'overview', icon: <BarChart2 size={18} />, label: 'Overview' },
        { id: 'subnet', icon: <Search size={18} />, label: 'Subnet Explorer' },
        { id: 'valuation', icon: <Calculator size={18} />, label: 'Valuation Tools' },
    ];

    const resources = [
        { id: 'research', icon: <FileText size={18} />, label: 'Research' },
        { id: 'reports', icon: <FileBarChart2 size={18} />, label: 'Reports' },
        { id: 'academy', icon: <Sparkles size={18} />, label: 'Report Generator' },
        { id: 'intelligence', icon: <Newspaper size={18} />, label: 'Intelligence' },
    ];

    const socials = [
        { href: 'https://x.com/DeAIStrategies', icon: <Twitter size={18} />, label: 'X (Twitter)' },
        { href: 'https://linkedin.com/company/deaistrategies', icon: <Linkedin size={18} />, label: 'LinkedIn' },
        { href: 'https://deaistrategies.io', icon: <Globe size={18} />, label: 'Website' },
        { href: 'https://github.com/DeAI-Labs', icon: <Github size={18} />, label: 'GitHub' },
        { href: 'https://deaistrategies.io/team', icon: <Users size={18} />, label: 'Team' },
    ];

    const navClick = (id) => {
        setActiveView(id);
        if (window.innerWidth < 768) onClose();
    };

    return (
        <aside className={`side ${isOpen ? 'open' : ''}`}>
            <button
                className="btn-g"
                onClick={onClose}
                style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px', display: isOpen ? 'flex' : 'none', zIndex: 100 }}
            >
                ✕
            </button>

            <div className="nav-s">
                <div className="nav-hd">Analytics</div>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-i ${activeView === item.id ? 'act' : ''}`}
                        onClick={() => navClick(item.id)}
                        title={item.label}
                    >
                        <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                        {item.label}
                    </div>
                ))}
            </div>

            <div className="nav-s">
                <div className="nav-hd">Resources</div>
                {resources.map(item => (
                    <div
                        key={item.id}
                        className={`nav-i ${activeView === item.id ? 'act' : ''}`}
                        onClick={() => navClick(item.id)}
                        title={item.label}
                    >
                        <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                        {item.label}
                    </div>
                ))}
            </div>

            <div className="nav-s">
                <div className="nav-hd">Pro Tools</div>
                <div className="nav-i" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} /></span>
                    Pro Analytics
                </div>
            </div>

            {isAdmin && (
                <div className="nav-s">
                    <div className="nav-hd" style={{ color: 'var(--amber)' }}>Admin</div>
                    <div
                        className={`nav-i ${activeView === 'admin' ? 'act' : ''}`}
                        onClick={() => navClick('admin')}
                        style={{ color: activeView === 'admin' ? undefined : 'var(--amber)' }}
                    >
                        <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={18} />
                        </span>
                        Access Requests
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--bdr)' }}>
                <div className="nav-hd">Socials</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {socials.map(social => (
                        <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: '8px',
                                color: 'var(--txt2)', textDecoration: 'none',
                                fontSize: '13px', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--txt)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt2)'; }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--mute)' }}>{social.icon}</span>
                            {social.label}
                        </a>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

