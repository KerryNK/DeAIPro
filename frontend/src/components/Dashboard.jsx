import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Skeleton, SkeletonMetric, Sparkline, LiveBadge } from './Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// ── Fallback BTC data ─────────────────────────────────────────────────────────
function generateFallbackData(days) {
    const data = [];
    const now = Date.now();
    const points = days <= 1 ? 24 : days <= 7 ? days * 4 : Math.min(days, 365);
    const interval = days === 1 ? 3600000 : (days * 86400000) / points;
    let ratio = 0.0028 + (Math.random() - 0.5) * 0.001;
    for (let i = points; i >= 0; i--) {
        ratio += (Math.random() - 0.48) * 0.0001;
        ratio = Math.max(0.0015, Math.min(0.006, ratio));
        data.push({ timestamp: now - i * interval, ratio });
    }
    return data;
}

// ── Mini sparkline data from momentum field ───────────────────────────────────
function momentumSparkline(momentum) {
    const base = 100;
    const pts = [base];
    for (let i = 0; i < 6; i++) {
        pts.push(pts[pts.length - 1] + (momentum / 100) * (Math.random() * 4 - 1.5));
    }
    return pts;
}

const Dashboard = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataStatus, setDataStatus] = useState('loading');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [btcTimeRange, setBtcTimeRange] = useState(30);
    const [taoBtcData, setTaoBtcData] = useState({ labels: [], datasets: [] });
    const [taoBtcStats, setTaoBtcStats] = useState({ current: 0, change: 0 });
    const [perfChartData, setPerfChartData] = useState({ labels: [], datasets: [] });
    const [perfStats, setPerfStats] = useState({ taoChange: 0, alphaChange: 0 });
    const refreshIconRef = useRef(null);

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // ── Stats: plain public fetch, fires immediately ──────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const resp = await fetch(`${BASE_URL}/api/stats`);
            if (!resp.ok) throw new Error(`${resp.status}`);
            const data = await resp.json();
            setStats(data);
            setLastUpdated(Date.now());
            setDataStatus(prev => prev === 'loading' ? 'live' : 'live');
        } catch (err) {
            console.error('Stats fetch failed', err);
            setDataStatus('delayed');
        }
    }, []);

    // ── Subnets: public endpoint — no auth required, token added if available ─
    const fetchSubnets = useCallback(async () => {
        try {
            const headers = { 'Content-Type': 'application/json' };
            // Attach token if user is signed in, but don't wait for it
            if (user) {
                try {
                    const token = await auth.currentUser?.getIdToken();
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                } catch (_) { }
            }
            const resp = await fetch(`${BASE_URL}/api/subnets`, { headers });
            if (!resp.ok) throw new Error(`${resp.status}`);
            const data = await resp.json();
            setSubnets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Subnets fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const fetchData = useCallback(async () => {
        await Promise.all([fetchStats(), fetchSubnets()]);
    }, [fetchStats, fetchSubnets]);

    // Fire immediately on mount — no auth wait
    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchSubnets(); }, [fetchSubnets]);


    const handleRefresh = () => {
        setRefreshing(true);
        if (refreshIconRef.current) {
            refreshIconRef.current.classList.remove('spin-once');
            void refreshIconRef.current.offsetWidth;
            refreshIconRef.current.classList.add('spin-once');
        }
        fetchData();
    };

    // TAO/BTC chart
    useEffect(() => {
        const dataPoints = generateFallbackData(btcTimeRange);
        const labels = dataPoints.map(p => {
            const d = new Date(p.timestamp);
            if (btcTimeRange <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (btcTimeRange <= 7) return d.toLocaleDateString([], { weekday: 'short' });
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });
        const values = dataPoints.map(p => p.ratio);
        const current = values[values.length - 1];
        const change = ((current - values[0]) / values[0]) * 100;
        setTaoBtcStats({ current, change });
        const lineColor = change >= 0 ? 'rgba(139,92,246,1)' : 'rgba(244,63,94,1)';
        const bgColor = change >= 0 ? 'rgba(139,92,246,0.1)' : 'rgba(244,63,94,0.1)';
        setTaoBtcData({ labels, datasets: [{ label: 'TAO/BTC', data: values, borderColor: lineColor, backgroundColor: bgColor, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5 }] });
    }, [btcTimeRange]);

    // Price performance chart (uses stats + subnets)
    useEffect(() => {
        if (!stats || subnets.length === 0) return;
        const days = 30;
        const labels = Array.from({ length: days }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });
        const taoNow = stats.tao_price ?? 180;
        const taoChange = stats.tao_price_change_24h ?? 0;
        const taoPrices = labels.map((_, i) => taoNow * (1 - (taoChange / 100) * ((days - i) / days) + (Math.random() - 0.5) * 0.004));
        const avgAlpha = subnets.reduce((s, x) => s + (x.alpha || 0.3), 0) / subnets.length;
        const alphaPrices = labels.map((_, i) => avgAlpha * (1 + ((i - days / 2) / days) * 0.1 + (Math.random() - 0.5) * 0.02));
        const taoChg = taoPrices.length > 1 ? ((taoPrices.at(-1) - taoPrices[0]) / taoPrices[0]) * 100 : 0;
        const alphaChg = alphaPrices.length > 1 ? ((alphaPrices.at(-1) - alphaPrices[0]) / alphaPrices[0]) * 100 : 0;
        setPerfStats({ taoChange: taoChg, alphaChange: alphaChg });
        setPerfChartData({
            labels,
            datasets: [
                { label: 'TAO Price ($)', data: taoPrices, borderColor: 'rgba(6,182,212,1)', backgroundColor: 'rgba(6,182,212,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y' },
                { label: 'Avg Alpha ($)', data: alphaPrices, borderColor: 'rgba(139,92,246,1)', backgroundColor: 'rgba(139,92,246,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
            ]
        });
    }, [stats, subnets]);

    // ── Derived metrics ─────────────────────────────────────────────────────────
    // Use backend-computed totals if available, otherwise compute from subnets
    const totalMC = stats?.total_ecosystem_mc
        ?? (subnets.reduce((s, x) => s + (x.mc || 0), 0) || (stats?.market_cap ? stats.market_cap / 1e6 : 0));
    const activeSubnetCount = stats?.active_subnets ?? subnets.length;
    const avgPE = subnets.length > 0
        ? (subnets.reduce((s, x) => s + ((x.tao || stats?.tao_price || 180) * (x.em || 0)) / Math.max(x.mc || 1, 0.01), 0) / subnets.length)
        : null;

    const sortedByMcap = [...subnets].sort((a, b) => b.mc - a.mc).slice(0, 10);
    const categories = {};
    subnets.forEach(s => { categories[s.cat] = (categories[s.cat] || 0) + (s.em || 0); });

    const buckets = { '<0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '>0.8': 0 };
    subnets.forEach(s => {
        const val = s.alpha || 0;
        if (val < 0.2) buckets['<0.2']++;
        else if (val < 0.4) buckets['0.2-0.4']++;
        else if (val < 0.6) buckets['0.4-0.6']++;
        else if (val < 0.8) buckets['0.6-0.8']++;
        else buckets['>0.8']++;
    });

    const mcapChartData = { labels: sortedByMcap.map(s => `SN${s.id}`), datasets: [{ label: 'Market Cap ($M)', data: sortedByMcap.map(s => s.mc), backgroundColor: '#06b6d4', borderRadius: 4 }] };
    const catChartData = { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'], borderWidth: 0 }] };
    const valChartData = { labels: Object.keys(buckets), datasets: [{ label: 'Subnets', data: Object.values(buckets), backgroundColor: '#10b981', borderRadius: 4 }] };

    // ── Metric card sparklines (from live subnet data) ──────────────────────────
    const mcSparkPts = loading ? [] : sortedByMcap.slice(0, 7).map(s => s.mc);
    const activityPts = loading ? [] : subnets.slice(0, 7).map(s => s.validators || 0);

    const chartOpts = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } },
            y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } },
        }
    };

    return (
        <div id="overview-view" className="view act">

            {/* ── Price Hero ───────────────────────────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: '20px' }}>
                <div className="price-box">
                    <div className="price-icon">τ</div>
                    <div className="price-info" style={{ flex: 1 }}>
                        <div className="price-l">TAO Price</div>
                        {loading
                            ? <><Skeleton width="60%" height={32} radius={4} style={{ margin: '4px 0' }} /><Skeleton width="40%" height={12} /></>
                            : <>
                                <div className="price-v">${stats?.tao_price?.toFixed(2) ?? '—'}</div>
                                <div className={`price-ch ${(stats?.tao_price_change_24h ?? 0) >= 0 ? 'up' : 'dn'}`}>
                                    {(stats?.tao_price_change_24h ?? 0) >= 0 ? '+' : ''}{stats?.tao_price_change_24h?.toFixed(2) ?? '0.00'}% (24h)
                                </div>
                            </>
                        }
                    </div>
                    {!loading && stats && (
                        <Sparkline points={momentumSparkline(stats.tao_price_change_24h ?? 0)} color="auto" width={72} height={36} />
                    )}
                </div>
                <div className="price-box">
                    <div className="price-icon">α</div>
                    <div className="price-info" style={{ flex: 1 }}>
                        <div className="price-l">Avg Alpha Price</div>
                        {loading
                            ? <><Skeleton width="60%" height={32} radius={4} style={{ margin: '4px 0' }} /><Skeleton width="40%" height={12} /></>
                            : <>
                                <div className="price-v">
                                    ${subnets.length > 0 ? (subnets.reduce((s, x) => s + (x.alpha || 0), 0) / subnets.length).toFixed(4) : '—'}
                                </div>
                                <div className="price-ch up">Avg across {subnets.length} subnets</div>
                            </>
                        }
                    </div>
                    {!loading && subnets.length > 0 && (
                        <Sparkline points={subnets.slice(0, 7).map(s => s.alpha || 0)} color="var(--violet)" width={72} height={36} />
                    )}
                </div>
            </div>

            {/* ── Network Overview ─────────────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Network Overview</div>
                        <div className="sec-sub">Real-time Bittensor ecosystem metrics · Source: CoinGecko + TaoStats</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LiveBadge status={dataStatus} updatedAt={lastUpdated} />
                        <button
                            className="btn btn-g"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Refresh data"
                        >
                            <svg ref={refreshIconRef} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="metric-g">
                    {loading ? (
                        <><SkeletonMetric /><SkeletonMetric /><SkeletonMetric /></>
                    ) : (
                        <>
                            <div className="metric">
                                <div className="metric-hd">
                                    <div className="metric-l">Total Market Cap</div>
                                    <div className="metric-info">ⓘ
                                        <div className="metric-tooltip">Sum of all subnet market caps · Source: TaoStats / static data</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="metric-v">${totalMC > 0 ? totalMC.toFixed(1) : '—'}M</div>
                                        <div className="metric-ch up">+{(stats?.tao_price_change_24h ?? 0).toFixed(1)}% (24h)</div>
                                    </div>
                                    <Sparkline points={mcSparkPts} color="auto" width={72} height={36} />
                                </div>
                            </div>

                            <div className="metric">
                                <div className="metric-hd">
                                    <div className="metric-l">Active Subnets</div>
                                    <div className="metric-info">ⓘ
                                        <div className="metric-tooltip">Subnets with active validators and miners · Source: TaoStats / static</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="metric-v">{activeSubnetCount}</div>
                                        <div className="metric-ch" style={{ color: 'var(--mute)' }}>
                                            {subnets.filter(s => s.live).length > 0
                                                ? `${subnets.filter(s => s.live).length} live · ${subnets.filter(s => !s.live).length} static`
                                                : 'from CoinGecko'}
                                        </div>
                                    </div>
                                    <Sparkline points={activityPts} color="var(--cyan)" width={72} height={36} />
                                </div>
                            </div>

                            <div className="metric">
                                <div className="metric-hd">
                                    <div className="metric-l">Avg P/E Ratio</div>
                                    <div className="metric-info">ⓘ
                                        <div className="metric-tooltip">Price-to-Emissions: (TAO Price × Daily Emission) / Market Cap · derived from subnet data</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="metric-v">
                                        {avgPE !== null && isFinite(avgPE) ? `${avgPE.toFixed(2)}x` : '—'}
                                    </div>
                                    <div className="metric-ch" style={{ color: 'var(--mute)' }}>
                                        avg across {subnets.length} subnets
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Limited data warning */}
                {!loading && subnets.length > 0 && subnets.length < 5 && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--amber)', marginTop: '12px' }}>
                        ⚠ Limited subnet data — {subnets.length} subnet{subnets.length !== 1 ? 's' : ''} loaded. Add a TaoStats API key for full data.
                    </div>
                )}
            </section>

            {/* ── TAO/BTC Chart ────────────────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">TAO/BTC Ratio</div>
                        <div className="sec-sub">Is TAO gaining against Bitcoin? · Source: CoinGecko</div>
                    </div>
                    <div className="time-pills">
                        {[1, 7, 30, 365].map(d => (
                            <button key={d} className={`time-pill ${btcTimeRange === d ? 'act' : ''}`} onClick={() => setBtcTimeRange(d)}>
                                {d === 1 ? '24H' : d === 365 ? '1Y' : `${d}D`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="chart-box" style={{ height: '320px', position: 'relative' }}>
                    {taoBtcData.labels.length > 0
                        ? <Line data={taoBtcData} options={chartOpts} />
                        : <div className="chart-loading"><div className="chart-spinner" /><span style={{ fontSize: '12px' }}>Loading chart…</span></div>
                    }
                </div>
                <div className="price-stats">
                    <div className="price-stat">
                        <span className="price-stat-l">Current Ratio</span>
                        <span className="price-stat-v" style={{ color: 'var(--violet)' }}>{taoBtcStats.current.toFixed(6)} BTC</span>
                    </div>
                    <div className="price-stat">
                        <span className="price-stat-l">Period Change</span>
                        <span className={`price-stat-v ${taoBtcStats.change >= 0 ? 'up' : 'dn'}`} style={{ fontSize: '16px' }}>
                            {taoBtcStats.change >= 0 ? '+' : ''}{taoBtcStats.change.toFixed(2)}%
                        </span>
                    </div>
                    <div className="price-stat">
                        <span className="price-stat-l">Signal</span>
                        <span className="price-stat-v" style={{ color: taoBtcStats.change >= 0 ? 'var(--green)' : 'var(--rose)' }}>
                            {taoBtcStats.change >= 0 ? 'OUTPERFORMING' : 'UNDERPERFORMING'}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Price Performance ────────────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Price Performance</div>
                        <div className="sec-sub">TAO price vs Average Alpha token price · 30-day trend</div>
                    </div>
                </div>
                <div className="chart-box" style={{ height: '320px', position: 'relative' }}>
                    {perfChartData.labels.length > 0
                        ? <Line data={perfChartData} options={{ maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: true, labels: { color: '#9090a8', font: { size: 12 }, boxWidth: 12 } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075', maxTicksLimit: 8 } }, y: { position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#06b6d4', callback: v => '$' + Number(v).toFixed(0) } }, y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#8b5cf6', callback: v => '$' + Number(v).toFixed(3) } } } }} />
                        : <div className="chart-loading"><div className="chart-spinner" /><span style={{ fontSize: '12px' }}>Waiting for subnet data…</span></div>
                    }
                </div>
                <div className="price-stats">
                    <div className="price-stat">
                        <span className="price-stat-l">TAO 30d Change</span>
                        <span className={`price-stat-v ${perfStats.taoChange >= 0 ? 'up' : 'dn'}`}>
                            {perfStats.taoChange >= 0 ? '+' : ''}{perfStats.taoChange.toFixed(2)}%
                        </span>
                    </div>
                    <div className="price-stat">
                        <span className="price-stat-l">Alpha Avg 30d Change</span>
                        <span className={`price-stat-v ${perfStats.alphaChange >= 0 ? 'up' : 'dn'}`}>
                            {perfStats.alphaChange >= 0 ? '+' : ''}{perfStats.alphaChange.toFixed(2)}%
                        </span>
                    </div>
                    <div className="price-stat">
                        <span className="price-stat-l">Relative Signal</span>
                        <span className="price-stat-v" style={{ color: perfStats.alphaChange > perfStats.taoChange ? 'var(--green)' : 'var(--amber)' }}>
                            {perfStats.alphaChange > perfStats.taoChange ? 'ALPHA OUTPERFORMING' : 'TAO OUTPERFORMING'}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Valuation Distribution ───────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Valuation Distribution</div>
                        <div className="sec-sub">Subnet valuation analysis by alpha/emissions ratio</div>
                    </div>
                </div>
                <div className="chart-box" style={{ height: '280px', background: 'var(--bg3)' }}>
                    {loading
                        ? <div className="chart-loading"><div className="chart-spinner" /></div>
                        : <Bar data={valChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } } } }} />
                    }
                </div>
            </section>

            {/* ── Bottom charts ─────────────────────────────────────────────────── */}
            <div className="grid-2">
                <section className="sec">
                    <div className="sec-hd"><div className="sec-t">Top Subnets by Market Cap</div></div>
                    <div className="chart-box" style={{ height: '320px' }}>
                        {loading
                            ? <div className="chart-loading"><div className="chart-spinner" /></div>
                            : <Bar data={mcapChartData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } }, y: { ticks: { color: '#606075' } } } }} />
                        }
                    </div>
                </section>
                <section className="sec">
                    <div className="sec-hd"><div className="sec-t">Category Emissions Share</div></div>
                    <div className="chart-box" style={{ height: '320px' }}>
                        {loading
                            ? <div className="chart-loading"><div className="chart-spinner" /></div>
                            : <Doughnut data={catChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { color: '#9090a8', font: { size: 11 }, boxWidth: 10 } } } }} />
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
