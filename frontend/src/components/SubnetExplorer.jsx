import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';


// Calculations based on HTML logic
const calcAPY = (s) => {
    const baseAPY = 18;
    const emissionBonus = (s.share / 5) * 8;
    const competitionPenalty = Math.max(0, (s.validators - 30) * 0.1);
    const qualityBonus = (s.score / 100) * 5;
    let apy = baseAPY + emissionBonus - competitionPenalty + qualityBonus;

    if (s.cat === 'Inference') apy *= 1.1;
    if (s.cat === 'Storage') apy *= 0.95;
    if (s.trend === 'up') apy *= 1.05;
    if (s.trend === 'down') apy *= 0.92;

    return Math.max(8, Math.min(85, apy));
};

const calcSharpe = (s) => {
    const apy = calcAPY(s);
    const riskFreeRate = 5;
    const baseVolatility = 45;
    const liquidityAdj = (100 - (s.liquidity || 50)) * 0.3; // Fallback if liquidity missing
    const momentumAdj = Math.abs(s.momentum || 0) * 0.5;
    const qualityAdj = (100 - s.score) * 0.2;
    const volatility = baseVolatility + liquidityAdj + momentumAdj - qualityAdj;

    const sharpe = (apy - riskFreeRate) / Math.max(10, volatility);
    return Math.max(0.1, Math.min(2.0, sharpe));
};

const SubnetExplorer = () => {
    const { isRestricted, openLoginModal } = useAuth();
    const [subnets, setSubnets] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
    const [loading, setLoading] = useState(true);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Inference', 'Training', 'Storage', 'Compute', 'Data', 'Finance', 'Media', 'Social', 'Reasoning'];

    useEffect(() => {
        fetchWithAuth('/api/subnets')
            .then(data => {
                if (Array.isArray(data)) {
                    setSubnets(data);
                } else {
                    console.error("API returned non-array data:", data);
                    setSubnets([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch subnets", err);
                setLoading(false);
            });
    }, []);

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
        setIsSortOpen(false);
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const searchFiltered = subnets.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(s.id).includes(q) ||
            (s.n && s.n.toLowerCase().includes(q)) ||
            (s.cat && s.cat.toLowerCase().includes(q))
        );
    });
    const filteredSubnets = searchFiltered.filter(s => activeCategory === 'All' || s.cat === activeCategory);

    const sortedSubnets = [...filteredSubnets].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Derived metrics
        if (sortConfig.key === 'apy') {
            valA = calcAPY(a);
            valB = calcAPY(b);
        } else if (sortConfig.key === 'sharpe') {
            valA = calcSharpe(a);
            valB = calcSharpe(b);
        } else if (sortConfig.key === 'alpha') {
            valA = a.alpha;
            valB = b.alpha;
        } else if (sortConfig.key === 'aem') {
            valA = a.alpha / (a.share || 1);
            valB = b.alpha / (b.share || 1);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.5 }}>↕</span>;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const getGradeClass = (score) => {
        if (score >= 80) return 'grade-a';
        if (score >= 60) return 'grade-b';
        if (score >= 40) return 'grade-c';
        return 'grade-d';
    };

    const getGradeLabel = (score) => {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    };

    if (loading) return <div className="cont">Loading explorer...</div>;

    return (
        <div id="subnet-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Subnet Explorer</div>
                        <div className="sec-sub">Comprehensive subnet analytics and metrics • Click any row to expand</div>
                    </div>
                    <div className="sec-act" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
                            <svg
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', pointerEvents: 'none' }}
                            >
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search subnets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'var(--bg3)', border: '1px solid var(--bdr)',
                                    borderRadius: '8px', color: 'var(--txt)', fontSize: '13px',
                                    padding: '7px 12px 7px 32px', outline: 'none',
                                    width: '200px', transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                                onBlur={e => e.target.style.borderColor = 'var(--bdr)'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}
                                >×</button>
                            )}
                        </div>
                        <div className="srt">
                            <div className="srt-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                                Sort by: {sortConfig.key.toUpperCase()}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                            <div className={`srt-m ${isSortOpen ? 'open' : ''}`} id="srtM">
                                <div className="srt-opt" onClick={() => handleSort('score')}>Score</div>
                                <div className="srt-opt" onClick={() => handleSort('mc')}>Market Cap</div>
                                <div className="srt-opt" onClick={() => handleSort('apy')}>APY</div>
                                <div className="srt-opt" onClick={() => handleSort('sharpe')}>Sharpe Ratio</div>
                                <div className="srt-opt" onClick={() => handleSort('alpha')}>Alpha</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pill-g" id="pillG">
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

                <div className="tbl-container">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ID</th>
                                <th>Subnet</th>
                                <th>Grade</th>
                                <th className="sortable" onClick={() => handleSort('score')}>Score {getSortIndicator('score')}</th>
                                <th className="sortable" onClick={() => handleSort('alpha')}>Alpha {getSortIndicator('alpha')}</th>
                                <th className="sortable" onClick={() => handleSort('mc')}>Market Cap {getSortIndicator('mc')}</th>
                                <th className="sortable" onClick={() => handleSort('share')}>EM % {getSortIndicator('share')}</th>
                                <th className="sortable" onClick={() => handleSort('apy')}>APY {getSortIndicator('apy')}</th>
                                <th className="sortable" onClick={() => handleSort('aem')}>α/EM {getSortIndicator('aem')}</th>
                                <th className="sortable" onClick={() => handleSort('fundamental')}>Fund {getSortIndicator('fundamental')}</th>
                                <th className="sortable" onClick={() => handleSort('sharpe')}>Sharpe {getSortIndicator('sharpe')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSubnets.map((sub, index) => {
                                const apy = calcAPY(sub);
                                const sharpe = calcSharpe(sub);
                                const scoreColor = sub.score >= 70 ? 'var(--green)' : sub.score >= 50 ? 'var(--cyan)' : 'var(--amber)';
                                const apyColor = apy >= 25 ? 'var(--green)' : apy >= 15 ? 'var(--amber)' : 'var(--rose)';
                                const sharpeColor = sharpe >= 1.0 ? 'var(--green)' : sharpe >= 0.5 ? 'var(--amber)' : 'var(--rose)';
                                const fundColor = sub.fundamental >= 70 ? 'var(--green)' : 'var(--amber)';
                                const aEm = (sub.alpha / (sub.share || 1)).toFixed(2);
                                const isExpanded = expandedRows.has(sub.id);

                                return (
                                    <React.Fragment key={sub.id}>
                                        <tr onClick={() => toggleRow(sub.id)} style={{ background: isExpanded ? 'var(--bg3)' : '' }}>
                                            <td className="rank">{index + 1}</td>
                                            <td style={{ color: 'var(--mute)', fontFamily: "'JetBrains Mono',monospace" }}>{sub.id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className="subnet-icon">SN{sub.id}</div>
                                                    <div>
                                                        <div className="n">{sub.n}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--mute)' }}>{sub.cat}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`grade ${getGradeClass(sub.score)}`}>{getGradeLabel(sub.score)}</span>
                                            </td>
                                            <td className="val" style={{ color: scoreColor, fontWeight: 700 }}>{sub.score}</td>
                                            <td className="val" style={{ color: 'var(--cyan)' }}>${sub.alpha.toFixed(2)}</td>
                                            <td className="val">${sub.mc.toFixed(1)}M</td>
                                            <td className="val" style={{ color: 'var(--cyan)' }}>{sub.share.toFixed(2)}%</td>
                                            <td className="val" style={{ color: apyColor, fontWeight: 600 }}>{apy.toFixed(1)}%</td>
                                            <td className="val" style={{ color: 'var(--green)' }}>{aEm}</td>
                                            <td className="val" style={{ color: fundColor }}>{sub.fundamental}</td>
                                            <td className="val" style={{ color: sharpeColor, fontWeight: 600 }}>{sharpe.toFixed(2)}</td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="row-exp show">
                                                <td colSpan="12" style={{ position: 'relative', padding: 0 }}>
                                                    <div className={isRestricted ? 'blur-content restricted' : ''} style={{ padding: '20px' }}>
                                                        <div className="exp-grid">
                                                            <div className="exp-sec">
                                                                <div className="exp-sec-t">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
                                                                    Network & Emission
                                                                </div>
                                                                <div className="exp-metric"><span className="exp-m-l">Validators</span><span className="exp-m-v">{sub.validators}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Miners</span><span className="exp-m-v">{sub.miners}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Emission Share</span><span className="exp-m-v" style={{ color: 'var(--cyan)' }}>{sub.share.toFixed(2)}%</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Daily TAO</span><span className="exp-m-v">{sub.dailyTao.toFixed(1)}τ</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">UID Utilization</span><span className="exp-m-v">{sub.uptime}%</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Staking APY</span><span className="exp-m-v" style={{ color: apyColor }}>{apy.toFixed(1)}%</span></div>
                                                            </div>
                                                            <div className="exp-sec">
                                                                <div className="exp-sec-t">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                                                    GitHub Score: {sub.github}
                                                                </div>
                                                                <div className="exp-metric"><span className="exp-m-l">Commits (30d)</span><span className="exp-m-v">{sub.commits}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Contributors</span><span className="exp-m-v">{sub.contributors}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Stars</span><span className="exp-m-v">{sub.stars}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Days Since</span><span className="exp-m-v">8</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Test Coverage</span><span className="exp-m-v">{sub.testCov}%</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Doc Score</span><span className="exp-m-v">{sub.docScore}%</span></div>
                                                            </div>
                                                            <div className="exp-sec">
                                                                <div className="exp-sec-t">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                                                    Valuation & Risk
                                                                </div>
                                                                <div className="exp-metric"><span className="exp-m-l">Alpha Price</span><span className="exp-m-v" style={{ color: 'var(--cyan)' }}>${sub.alpha.toFixed(2)}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Market Cap</span><span className="exp-m-v">${sub.mc.toFixed(1)}M</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">α/EM Ratio</span><span className="exp-m-v" style={{ color: 'var(--green)' }}>{aEm}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">P/E Ratio</span><span className="exp-m-v">{sub.pe.toFixed(2)}x</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Sharpe Ratio</span><span className="exp-m-v" style={{ color: sharpeColor }}>{sharpe.toFixed(2)}</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Staking APY</span><span className="exp-m-v" style={{ color: apyColor }}>{apy.toFixed(1)}%</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Momentum</span><span className="exp-m-v" style={{ color: 'var(--green)' }}>+{sub.momentum.toFixed(1)}%</span></div>
                                                                <div className="exp-metric"><span className="exp-m-l">Daily OpEx</span><span className="exp-m-v" style={{ color: 'var(--pink)' }}>${(sub.em * (sub.tao || 180.80) / 1000).toFixed(1)}K</span></div>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--bdr)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--cyan)', textTransform: 'uppercase' }}>Score Breakdown</span>
                                                            </div>
                                                            <div className="exp-scores">
                                                                {[['Economic', sub.economic], ['Network', sub.network], ['Fundament', sub.fundamental], ['Liquidity', sub.liquidity], ['Momentum', sub.momentum], ['Quality', sub.quality], ['Valuation', sub.val || 0]].map(([label, val]) => (
                                                                    <div className="exp-score" key={label}>
                                                                        <div className="exp-score-l">{label}</div>
                                                                        <div className="exp-score-v" style={{ color: val >= 70 ? 'var(--green)' : 'var(--amber)' }}>{typeof val === 'number' ? val.toFixed(0) : val}</div>
                                                                        <div className="exp-score-bar">
                                                                            <div className="exp-score-fill" style={{ width: `${Math.min(val, 100)}%`, background: val >= 70 ? 'var(--green)' : 'var(--amber)' }}></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--amber)', marginBottom: '4px' }}>RISKS</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>⚠️ Emission dependency • ⚠️ Cloud competition</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--green)', marginBottom: '4px' }}>MILESTONES</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>→ TEE implementation • → Enterprise SDK</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isRestricted && (
                                                        <div className="restriction-overlay" style={{ backdropFilter: 'blur(3px)' }}>
                                                            <div className="restriction-box" style={{ padding: '20px' }}>
                                                                <div className="restriction-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
                                                                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Pro Access Required</h3>
                                                                <p style={{ fontSize: '12px', marginBottom: '12px' }}>Detailed subnet metrics are available to Pro subscribers.</p>
                                                                <button className="btn btn-p" style={{ fontSize: '12px', padding: '6px 16px' }} onClick={openLoginModal}>Unlock</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default SubnetExplorer;
