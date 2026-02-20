import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FileBarChart2, ExternalLink, Lock } from 'lucide-react';

// Reports list — update these Notion links with real URLs
const REPORTS = [
    {
        id: 1,
        title: 'Q1 2026 Bittensor Ecosystem Report',
        description: 'Comprehensive analysis of subnet performance, emission trends, and validator activity across the Bittensor network.',
        date: 'February 2026',
        category: 'Ecosystem',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '📊',
        restricted: false,
    },
    {
        id: 2,
        title: 'Top Subnets by Alpha/Emissions Ratio',
        description: 'Deep-dive valuation report identifying the most undervalued subnets using the α/EM framework.',
        date: 'February 2026',
        category: 'Valuation',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '📈',
        restricted: true,
    },
    {
        id: 3,
        title: 'Subnet Risk Framework: Sharpe Ratios',
        description: 'Risk-adjusted return analysis across 50+ subnets using Sharpe ratio methodology adapted for crypto markets.',
        date: 'January 2026',
        category: 'Risk Analysis',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '⚡',
        restricted: true,
    },
    {
        id: 4,
        title: 'Validator Economics Deep Dive',
        description: 'Analysis of validator ROI, optimal staking strategies, and emission distribution patterns.',
        date: 'January 2026',
        category: 'Economics',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '🔬',
        restricted: true,
    },
    {
        id: 5,
        title: 'Inference Subnet Landscape 2026',
        description: 'Market map of all inference-focused subnets, with competitive positioning and growth projections.',
        date: 'January 2026',
        category: 'Market Map',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '🤖',
        restricted: true,
    },
    {
        id: 6,
        title: 'DeAI Strategies Weekly Intelligence Digest',
        description: 'Curated weekly roundup of key developments, governance changes, and technical updates across Bittensor.',
        date: 'Weekly',
        category: 'Intelligence',
        notionUrl: 'https://deaistrategies.notion.site',
        preview: '📰',
        restricted: false,
    },
];

const CATEGORY_COLORS = {
    Ecosystem: 'var(--cyan)',
    Valuation: 'var(--green)',
    'Risk Analysis': 'var(--amber)',
    Economics: 'var(--violet)',
    'Market Map': 'var(--pink)',
    Intelligence: 'var(--blue, #3b82f6)',
};

const Reports = () => {
    const { isRestricted, openLoginModal } = useAuth();
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', ...Array.from(new Set(REPORTS.map(r => r.category)))];

    const filtered = REPORTS.filter(r =>
        activeCategory === 'All' || r.category === activeCategory
    );

    return (
        <div id="reports-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Research Reports</div>
                        <div className="sec-sub">Institutional-grade analysis from the DeAI Strategies team • Powered by Notion</div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="pill-g" style={{ marginBottom: '24px' }}>
                    {categories.map(cat => (
                        <div
                            key={cat}
                            className={`pill ${activeCategory === cat ? 'act' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Reports Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {filtered.map(report => {
                        const isLocked = report.restricted && isRestricted;
                        return (
                            <div
                                key={report.id}
                                style={{
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--bdr)',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'border-color 0.2s',
                                    opacity: isLocked ? 0.8 : 1,
                                }}
                                onMouseEnter={e => { if (!isLocked) e.currentTarget.style.borderColor = 'var(--cyan)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; }}
                            >
                                {/* Category badge */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                        color: CATEGORY_COLORS[report.category] || 'var(--cyan)',
                                        background: `${CATEGORY_COLORS[report.category] || 'var(--cyan)'}22`,
                                        padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px'
                                    }}>
                                        {report.category}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isLocked && <Lock size={14} style={{ color: 'var(--mute)' }} />}
                                        <span style={{ fontSize: '11px', color: 'var(--mute)' }}>{report.date}</span>
                                    </div>
                                </div>

                                {/* Icon + Title */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', minWidth: '48px',
                                        background: 'var(--bg4)', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '22px'
                                    }}>
                                        {report.preview}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt)', lineHeight: 1.3, marginBottom: '8px' }}>
                                            {report.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.6 }}>
                                            {report.description}
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--bdr)' }}>
                                    {isLocked ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Pro subscription required</span>
                                            <button className="btn btn-p" onClick={openLoginModal} style={{ fontSize: '12px', padding: '6px 16px' }}>
                                                Unlock
                                            </button>
                                        </div>
                                    ) : (
                                        <a
                                            href={report.notionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                color: 'var(--cyan)', fontSize: '13px', fontWeight: 600,
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <FileBarChart2 size={14} />
                                            View Full Report
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pro Promo Banner */}
                {isRestricted && (
                    <div style={{
                        marginTop: '32px', padding: '24px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: '12px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔒</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt)', marginBottom: '8px' }}>
                            Access All Reports with DeAI Pro
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
                            Sign in with your DeAI Strategies account to access all research reports, valuation tools, and advanced analytics.
                        </div>
                        <button className="btn btn-p" onClick={openLoginModal} style={{ padding: '10px 28px' }}>
                            Sign In to Unlock All Reports
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Reports;
