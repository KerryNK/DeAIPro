import React, { useState, useEffect } from 'react';

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
    const [subnets, setSubnets] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
    const [loading, setLoading] = useState(true);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Inference', 'Training', 'Storage', 'Compute', 'Data', 'Finance', 'Media', 'Social', 'Reasoning'];

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/subnets`)
            .then(res => res.json())
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

    const filteredSubnets = subnets.filter(s => activeCategory === 'All' || s.cat === activeCategory);

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
                    <div className="sec-act">
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

                                return (
                                    <tr key={sub.id}>
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
                                        <td className="val" style={{ color: 'var(--cyan)' }}>${sub.alpha}</td>
                                        <td className="val">${sub.mc}M</td>
                                        <td className="val" style={{ color: 'var(--cyan)' }}>{sub.share}%</td>
                                        <td className="val" style={{ color: apyColor, fontWeight: 600 }}>{apy.toFixed(1)}%</td>
                                        <td className="val" style={{ color: 'var(--green)' }}>{aEm}</td>
                                        <td className="val" style={{ color: fundColor }}>{sub.fundamental}</td>
                                        <td className="val" style={{ color: sharpeColor, fontWeight: 600 }}>{sharpe.toFixed(2)}</td>
                                    </tr>
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
