import React from 'react';
import {
    BarChart2,
    Search,
    Calculator,
    FileText,
    GraduationCap,
    Newspaper,
    Lock,
    Github,
    Linkedin,
    X
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, isOpen, onClose }) => {
    const navItems = [
        { id: 'overview', icon: <BarChart2 size={18} />, label: 'Overview' },
        { id: 'subnet', icon: <Search size={18} />, label: 'Subnet Explorer' },
        { id: 'valuation', icon: <Calculator size={18} />, label: 'Valuation Tools' },
    ];

    const resources = [
        { id: 'research', icon: <FileText size={18} />, label: 'Research' },
        { id: 'academy', icon: <GraduationCap size={18} />, label: 'Academy' },
        { id: 'intelligence', icon: <Newspaper size={18} />, label: 'Intelligence' },
    ];

    return (
        <aside className={`side ${isOpen ? 'open' : ''}`}>
            <button
                className="btn-g"
                onClick={onClose}
                style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px', display: isOpen ? 'flex' : 'none', zIndex: 100 }}
            >
                <X size={16} />
            </button>

            <div className="nav-s">
                <div className="nav-hd">Analytics</div>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-i ${activeView === item.id ? 'act' : ''}`}
                        onClick={() => {
                            setActiveView(item.id);
                            if (window.innerWidth < 768) onClose();
                        }}
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
                        onClick={() => {
                            setActiveView(item.id);
                            if (window.innerWidth < 768) onClose();
                        }}
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

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--bdr)' }}>
                <div className="nav-hd">Community</div>
                <div style={{ display: 'flex', gap: '10px', padding: '0 12px' }}>
                    <a href="https://github.com/DeAI-Labs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--txt2)', transition: 'color 0.2s' }}>
                        <Github size={20} />
                    </a>
                    <a href="https://www.linkedin.com/company/deai-strategies/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--txt2)', transition: 'color 0.2s' }}>
                        <Linkedin size={20} />
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
