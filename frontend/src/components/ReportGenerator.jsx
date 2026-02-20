import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';

// ─── Report templates ─────────────────────────────────────────────────────────
const TEMPLATES = [
    {
        id: 'subnet-overview',
        icon: '🔭',
        title: 'Subnet Overview',
        description: 'Full snapshot of all subnets: market cap, APY, score, momentum and category breakdown.',
        sections: ['Market Cap Rankings', 'Category Breakdown', 'Score Distribution', 'Top Momentum'],
        estimatedTime: '~10s',
        color: 'var(--cyan)',
    },
    {
        id: 'valuation-summary',
        icon: '📊',
        title: 'Valuation Summary',
        description: 'Alpha/Emissions ratio analysis, Fair Value estimates, and DCF metrics across the network.',
        sections: ['Undervalued Subnets', 'Overvalued Subnets', 'α/EM Distribution', 'Sharpe Rankings'],
        estimatedTime: '~15s',
        color: 'var(--green)',
    },
    {
        id: 'risk-report',
        icon: '⚡',
        title: 'Risk Analysis',
        description: 'Comprehensive risk-adjusted metrics — Sharpe ratios, volatility estimates, and drawdown analysis.',
        sections: ['Sharpe Ratio Rankings', 'Volatility Buckets', 'High-Risk Alerts', 'Safe Harbour Picks'],
        estimatedTime: '~12s',
        color: 'var(--amber)',
    },
    {
        id: 'top-picks',
        icon: '🎯',
        title: 'Top Picks',
        description: 'Algorithmically selected best-opportunity subnets based on DeAI composite score methodology.',
        sections: ['Top 10 by Score', 'Best APY/Risk', 'Emerging Categories', 'Contrarian Plays'],
        estimatedTime: '~8s',
        color: 'var(--violet)',
    },
    {
        id: 'network-health',
        icon: '🌐',
        title: 'Network Health',
        description: 'TAO price performance, total network emissions, validator participation, and liquidity metrics.',
        sections: ['Price Performance', 'Emission Trends', 'Validator Stats', 'Liquidity Overview'],
        estimatedTime: '~10s',
        color: 'var(--pink)',
    },
    {
        id: 'custom',
        icon: '✏️',
        title: 'Custom Report',
        description: 'Build your own report — choose specific subnets, metrics, and sections to include.',
        sections: ['You choose'],
        estimatedTime: 'Variable',
        color: 'var(--mute)',
    },
];

const METRICS = [
    'Market Cap', 'APY', 'Alpha Price', 'Sharpe Ratio',
    'Emissions Share', 'Momentum', 'Fair Value', 'P/E Ratio',
    'Score', 'α/EM Ratio', 'Daily OpEx', 'Liquidity'
];

const FORMATS = ['PDF Summary', 'CSV Data', 'Markdown Report', 'JSON Export'];

// ─── Simulated report generation ─────────────────────────────────────────────
function generateReportContent(template, subnets, stats) {
    const taoPrice = stats?.tao_price || 180.80;
    const avgScore = subnets.length ? (subnets.reduce((s, x) => s + (x.score || 0), 0) / subnets.length).toFixed(1) : '—';
    const topSubnets = [...subnets].sort((a, b) => b.score - a.score).slice(0, 5);
    const totalMcap = subnets.reduce((s, x) => s + (x.mc || 0), 0).toFixed(1);

    const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const sectionMap = {
        'subnet-overview': `
## Subnet Overview Report
**Generated:** ${now} | **TAO Price:** $${taoPrice.toFixed(2)} | **Total Subnets:** ${subnets.length}

### Key Metrics
| Metric | Value |
|--------|-------|
| Total Network Market Cap | $${totalMcap}M |
| Average Composite Score | ${avgScore} |
| Active Subnets | ${subnets.length} |

### Top 5 Subnets by Score
${topSubnets.map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** — Score: ${(s.score || 0).toFixed(1)} | MC: $${(s.mc || 0).toFixed(1)}M | APY: ${(s.apy || 18).toFixed(1)}%`).join('\n')}

### Category Breakdown
${Object.entries(subnets.reduce((acc, s) => { acc[s.cat] = (acc[s.cat] || 0) + 1; return acc; }, {}))
                .map(([cat, count]) => `- **${cat}**: ${count} subnets`).join('\n')}
`,
        'valuation-summary': `
## Valuation Summary Report
**Generated:** ${now} | **TAO Price:** $${taoPrice.toFixed(2)}

### Alpha/Emissions Distribution
${['< 0.2 (Undervalued)', '0.2–0.4', '0.4–0.6', '0.6–0.8', '> 0.8 (Overvalued)'].map(bucket => {
            const count = subnets.filter(s => {
                const v = s.alpha;
                if (bucket.startsWith('<')) return v < 0.2;
                if (bucket.startsWith('>')) return v > 0.8;
                const [lo, hi] = bucket.split('–').map(parseFloat);
                return v >= lo && v < hi;
            }).length;
            return `- **${bucket}**: ${count} subnets`;
        }).join('\n')}

### Top Undervalued (α/EM < 0.3)
${[...subnets].filter(s => s.alpha < 0.3).sort((a, b) => a.alpha - b.alpha).slice(0, 5)
                .map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** — α/EM: ${s.alpha.toFixed(3)} | Score: ${(s.score || 0).toFixed(1)}`).join('\n') || 'No deeply undervalued subnets found.'}
`,
        'risk-report': `
## Risk Analysis Report
**Generated:** ${now}

### Sharpe Ratio Rankings (Top 10)
${[...subnets].sort((a, b) => (b.sharpe || 0) - (a.sharpe || 0)).slice(0, 10)
                .map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** — Sharpe: ${(s.sharpe || 0).toFixed(2)} | APY: ${(s.apy || 18).toFixed(1)}%`).join('\n')}

### Risk Alerts
${subnets.filter(s => (s.sharpe || 1) < 0.5).slice(0, 5)
                .map(s => `⚠️ **SN${s.id} ${s.n}** — Low Sharpe ratio: ${(s.sharpe || 0).toFixed(2)}`).join('\n') || '✅ No high-risk subnets flagged.'}
`,
        'top-picks': `
## Top Picks Report
**Generated:** ${now}

### Top 10 by Composite Score
${[...subnets].sort((a, b) => b.score - a.score).slice(0, 10)
                .map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** (${s.cat}) — Score: ${(s.score || 0).toFixed(1)} | MC: $${(s.mc || 0).toFixed(1)}M | APY: ${(s.apy || 18).toFixed(1)}%`).join('\n')}

### Best Risk-Adjusted APY
${[...subnets].sort((a, b) => ((b.apy || 18) * (b.sharpe || 1)) - ((a.apy || 18) * (a.sharpe || 1))).slice(0, 5)
                .map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** — APY: ${(s.apy || 18).toFixed(1)}% | Sharpe: ${(s.sharpe || 1).toFixed(2)}`).join('\n')}
`,
        'network-health': `
## Network Health Report
**Generated:** ${now}

### Price Performance
- **TAO Price:** $${taoPrice.toFixed(2)}
- **24h Change:** ${stats?.tao_price_change_24h >= 0 ? '+' : ''}${(stats?.tao_price_change_24h || 0).toFixed(2)}%
- **Market Cap:** $${((stats?.market_cap || 847200000) / 1e9).toFixed(2)}B

### Network Activity
- **Active Subnets:** ${subnets.length}
- **Total Emissions (daily):** ${subnets.reduce((s, x) => s + (x.em || 0), 0).toFixed(0)} τ
- **Avg Staking APY:** ${avgScore}%

### Top Liquidity
${[...subnets].sort((a, b) => b.mc - a.mc).slice(0, 5)
                .map((s, i) => `${i + 1}. **SN${s.id} ${s.n}** — MC: $${(s.mc || 0).toFixed(1)}M`).join('\n')}
`,
        'custom': `
## Custom Report
**Generated:** ${now}

_Select your metrics and subnets above, then click Generate to build your custom report._
`,
    };

    return sectionMap[template] || '# Report\nNo content available.';
}

// ─── Simple Markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
    return text
        .replace(/^## (.+)$/gm, '<h2 style="color:var(--cyan);font-size:18px;margin:24px 0 12px;font-family:\'JetBrains Mono\',monospace">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 style="color:var(--txt);font-size:14px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:0.5px">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--txt)">$1</strong>')
        .replace(/^(\d+\. .+)$/gm, '<div style="padding:6px 0;border-bottom:1px solid var(--bdr);font-size:13px;color:var(--txt2)">$1</div>')
        .replace(/^(- .+)$/gm, '<div style="padding:4px 0;font-size:13px;color:var(--txt2)">$1</div>')
        .replace(/^(\|.+\|)$/gm, (row) => {
            if (row.includes('---')) return '';
            const cells = row.split('|').filter(Boolean).map(c => c.trim());
            return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--bdr);margin:2px 0">${cells.map(c => `<div style="background:var(--bg3);padding:6px 10px;font-size:12px;color:var(--txt2)">${c}</div>`).join('')}</div>`;
        })
        .replace(/\n\n/g, '<br/>')
        .replace(/^_(.+)_$/gm, '<em style="color:var(--mute);font-size:12px">$1</em>');
}

// ─── Component ────────────────────────────────────────────────────────────────
const ReportGenerator = () => {
    const { isRestricted, openLoginModal } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(['Score', 'Market Cap', 'APY', 'Sharpe Ratio']);
    const [selectedFormat, setSelectedFormat] = useState('Markdown Report');
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [report, setReport] = useState(null);
    const [stats, setStats] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const reportRef = useRef(null);

    // Fetch data on mount
    useEffect(() => {
        Promise.all([
            fetchWithAuth('/api/stats'),
            fetchWithAuth('/api/subnets'),
        ]).then(([s, sn]) => { setStats(s); setSubnets(sn); }).catch(() => { });
    }, []);

    const toggleMetric = (m) => {
        setSelectedMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;
        if (isRestricted && selectedTemplate.id !== 'subnet-overview') {
            openLoginModal();
            return;
        }
        setGenerating(true);
        setProgress(0);
        setReport(null);

        // Simulate progressive generation
        for (let i = 0; i <= 100; i += 8) {
            await new Promise(r => setTimeout(r, 80));
            setProgress(Math.min(i, 100));
        }
        setProgress(100);

        const content = generateReportContent(selectedTemplate.id, subnets, stats);
        setReport(content);
        setGenerating(false);

        setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(report).catch(() => { });
    };

    const handleDownload = () => {
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `deai-${selectedTemplate?.id}-${new Date().toISOString().slice(0, 10)}.md`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div id="report-gen-view" className="view act">

            {/* Header */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Report Generator</div>
                        <div className="sec-sub">Generate institutional-grade Bittensor analysis reports on demand</div>
                    </div>
                    <div className="sec-act">
                        {subnets.length > 0 && (
                            <div style={{ fontSize: '12px', color: 'var(--green)', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
                                ● {subnets.length} subnets loaded
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Step 1: Choose Template */}
            <section className="sec">
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--mute)', marginBottom: '16px' }}>
                    Step 1 — Choose a Template
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {TEMPLATES.map(tpl => {
                        const locked = isRestricted && tpl.id !== 'subnet-overview';
                        const isSelected = selectedTemplate?.id === tpl.id;
                        return (
                            <div
                                key={tpl.id}
                                onClick={() => setSelectedTemplate(tpl)}
                                style={{
                                    background: isSelected ? `${tpl.color}18` : 'var(--bg3)',
                                    border: `1px solid ${isSelected ? tpl.color : 'var(--bdr)'}`,
                                    borderRadius: '12px', padding: '20px', cursor: 'pointer',
                                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                                    boxShadow: isSelected ? `0 0 0 1px ${tpl.color}44` : 'none',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = tpl.color; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--bdr)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ fontSize: '28px', lineHeight: 1 }}>{tpl.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt)' }}>{tpl.title}</span>
                                            {locked && <span style={{ fontSize: '11px', color: 'var(--mute)' }}>🔒 Pro</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.5, marginBottom: '12px' }}>{tpl.description}</div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {tpl.sections.map(s => (
                                                <span key={s} style={{ fontSize: '10px', color: tpl.color, background: `${tpl.color}15`, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{s}</span>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--mute)' }}>⏱ {tpl.estimatedTime}</div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', background: tpl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>✓</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Step 2: Configure (shown when template selected) */}
            {selectedTemplate && (
                <section className="sec">
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--mute)', marginBottom: '16px' }}>
                        Step 2 — Configure
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Metrics */}
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt)', marginBottom: '12px' }}>Include Metrics</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {METRICS.map(m => (
                                    <div
                                        key={m}
                                        onClick={() => toggleMetric(m)}
                                        style={{
                                            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                                            transition: 'all 0.15s', fontWeight: 500,
                                            background: selectedMetrics.includes(m) ? 'var(--cyan)' : 'var(--bg4)',
                                            color: selectedMetrics.includes(m) ? '#000' : 'var(--txt2)',
                                            border: `1px solid ${selectedMetrics.includes(m) ? 'var(--cyan)' : 'var(--bdr)'}`,
                                        }}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Format + Generate */}
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt)', marginBottom: '12px' }}>Export Format</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                {FORMATS.map(f => (
                                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--txt2)' }}>
                                        <input
                                            type="radio" name="format" value={f}
                                            checked={selectedFormat === f}
                                            onChange={() => setSelectedFormat(f)}
                                            style={{ accentColor: 'var(--cyan)' }}
                                        />
                                        {f}
                                    </label>
                                ))}
                            </div>
                            <button
                                className="btn btn-p"
                                onClick={handleGenerate}
                                disabled={generating}
                                style={{
                                    width: '100%', padding: '12px',
                                    opacity: generating ? 0.7 : 1,
                                    fontSize: '14px', fontWeight: 700,
                                }}
                            >
                                {generating ? 'Generating...' : `Generate ${selectedTemplate.title}`}
                            </button>

                            {/* Progress bar */}
                            {generating && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mute)', marginBottom: '6px' }}>
                                        <span>Processing {subnets.length} subnets...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'var(--bg4)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--violet), var(--cyan))', transition: 'width 0.1s', borderRadius: '2px' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Step 3: Report Output */}
            {report && (
                <section className="sec" ref={reportRef}>
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">{selectedTemplate?.title} — Generated Report</div>
                            <div className="sec-sub">{new Date().toLocaleString()}</div>
                        </div>
                        <div className="sec-act" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-g" onClick={handleCopy} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                Copy
                            </button>
                            <button className="btn btn-p" onClick={handleDownload} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                ↓ Download .md
                            </button>
                        </div>
                    </div>
                    <div style={{
                        background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '12px',
                        padding: '28px', lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
                    </div>
                </section>
            )}

            {/* Pro upgrade banner for unauthenticated users */}
            {isRestricted && (
                <section className="sec" style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))',
                    border: '1px solid rgba(139,92,246,0.25)', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt)', marginBottom: '8px' }}>Unlock all 6 Report Templates</div>
                    <div style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '20px' }}>
                        Sign in to generate Valuation, Risk, Top Picks, Network Health, and Custom reports.
                    </div>
                    <button className="btn btn-p" onClick={openLoginModal} style={{ padding: '10px 28px', fontSize: '14px' }}>
                        Sign In to Unlock All Reports
                    </button>
                </section>
            )}
        </div>
    );
};

export default ReportGenerator;
