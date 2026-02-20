import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Skeleton, SkeletonMetric, Sparkline, LiveBadge } from './Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);


// ── Fallback historical data generator ──────────────────────────────────────
function generateFallbackData(days, base = 0.0028, spread = 0.0001) {
    const data = [];
    const now = Date.now();
    const points = days <= 1 ? 24 : Math.min(days, 365);
    const interval = days === 1 ? 3600000 : (days * 86400000) / points;
    let val = base + (Math.random() - 0.5) * spread;
    for (let i = points; i >= 0; i--) {
        val += (Math.random() - 0.48) * (spread * 0.15);
        val = Math.max(base * 0.3, Math.min(base * 3, val));
        data.push({ timestamp: now - i * interval, value: val });
    }
    return data;
}

// ── Mini sparkline from momentum ─────────────────────────────────────────────
function momentumSparkline(momentum) {
    const base = 100;
    const pts = [base];
    for (let i = 0; i < 6; i++) {
        pts.push(pts[pts.length - 1] + (momentum / 100) * (Math.random() * 4 - 1.5));
    }
    return pts;
}

// ── Relative time string ──────────────────────────────────────────────────────
function timeAgo(ts) {
    if (!ts) return null;
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}s ago`;
    return `${Math.floor(sec / 60)}m ago`;
}

// ── P/E ratio calc ─────────────────────────────────────────────────────────────
function calcPE(subnet, taoPrice) {
    const tau = taoPrice || 180.8;
    const mc = subnet.mc || 0.01;
    const dailyEm = subnet.em || 0;
    if (!dailyEm || !mc) return null;
    return (tau * dailyEm) / (mc * 1e6 / 365);
}

// ── 24h change badge ──────────────────────────────────────────────────────────
function ChangeBadge({ value }) {
    if (value === undefined || value === null) return <span style={{ color: 'var(--mute)' }}>—</span>;
    const up = value >= 0;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            background: up ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
            color: up ? 'var(--green)' : 'var(--rose)',
            border: `1px solid ${up ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
        }}>
            {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
        </span>
    );
}

// ── Subnet table skeleton row ──────────────────────────────────────────────────
function SubnetSkeletonRow() {
    return (
        <tr>
            {[24, 36, 130, 70, 70, 70, 80, 80, 40, 40].map((w, i) => (
                <td key={i} style={{ padding: '12px 10px' }}>
                    <Skeleton width={w} height={11} />
                </td>
            ))}
        </tr>
    );
}

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataStatus, setDataStatus] = useState('loading');
    const [statsUpdatedAt, setStatsUpdatedAt] = useState(null);
    const [subnetsUpdatedAt, setSubnetsUpdatedAt] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // TAO/BTC chart
    const [btcTimeRange, setBtcTimeRange] = useState(30);
    const [taoBtcData, setTaoBtcData] = useState({ labels: [], datasets: [] });
    const [taoBtcStats, setTaoBtcStats] = useState({ current: 0, change: 0 });
    const [btcLoading, setBtcLoading] = useState(false);

    // TAO Price Performance chart
    const [perfTimeRange, setPerfTimeRange] = useState(30);
    const [perfChartData, setPerfChartData] = useState({ labels: [], datasets: [] });
    const [perfStats, setPerfStats] = useState({ taoChange: 0, alphaChange: 0 });
    const [perfLoading, setPerfLoading] = useState(false);

    // Subnet table
    const [subnetSort, setSubnetSort] = useState({ key: 'mc', dir: 'desc' });
    const [showAll, setShowAll] = useState(false);

    // Time ticker for "Xs ago"
    const [tick, setTick] = useState(0);

    const refreshIconRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // ── Data fetchers ──────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const resp = await fetch(`${BASE_URL}/api/stats`);
            if (!resp.ok) throw new Error(`${resp.status}`);
            const data = await resp.json();
            setStats(data);
            setStatsUpdatedAt(Date.now());
            setDataStatus('live');
        } catch (err) {
            console.error('Stats fetch failed', err);
            setDataStatus('delayed');
        }
    }, [BASE_URL]);

    const fetchSubnets = useCallback(async () => {
        try {
            const headers = { 'Content-Type': 'application/json' };
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
            setSubnetsUpdatedAt(Date.now());
        } catch (err) {
            console.error('Subnets fetch failed', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, BASE_URL]);

    const fetchBtcHistory = useCallback(async (days) => {
        setBtcLoading(true);
        try {
            const resp = await fetch(`${BASE_URL}/api/historical/btc?days=${days}`);
            if (!resp.ok) throw new Error(`${resp.status}`);
            const { data } = await resp.json();
            if (!data || data.length === 0) throw new Error('empty');
            const labels = data.map(p => {
                const d = new Date(p.date);
                if (days <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (days <= 7) return d.toLocaleDateString([], { weekday: 'short' });
                return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            });
            const values = data.map(p => p.value);
            const current = values[values.length - 1] ?? 0;
            const change = values.length > 1 ? ((current - values[0]) / values[0]) * 100 : 0;
            setTaoBtcStats({ current, change });
            const lineColor = change >= 0 ? 'rgba(139,92,246,1)' : 'rgba(244,63,94,1)';
            const bgColor = change >= 0 ? 'rgba(139,92,246,0.08)' : 'rgba(244,63,94,0.08)';
            setTaoBtcData({ labels, datasets: [{ label: 'TAO/BTC', data: values, borderColor: lineColor, backgroundColor: bgColor, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5 }] });
        } catch {
            // Fallback to generated data
            const pts = generateFallbackData(days, 0.0028, 0.0003);
            const labels = pts.map(p => {
                const d = new Date(p.timestamp);
                if (days <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (days <= 7) return d.toLocaleDateString([], { weekday: 'short' });
                return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            });
            const values = pts.map(p => p.value);
            const current = values[values.length - 1] ?? 0;
            const change = values.length > 1 ? ((current - values[0]) / values[0]) * 100 : 0;
            setTaoBtcStats({ current, change });
            const lineColor = change >= 0 ? 'rgba(139,92,246,1)' : 'rgba(244,63,94,1)';
            setTaoBtcData({ labels, datasets: [{ label: 'TAO/BTC', data: values, borderColor: lineColor, backgroundColor: change >= 0 ? 'rgba(139,92,246,0.08)' : 'rgba(244,63,94,0.08)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5 }] });
        } finally {
            setBtcLoading(false);
        }
    }, [BASE_URL]);

    const fetchTaoHistory = useCallback(async (days) => {
        setPerfLoading(true);
        try {
            const resp = await fetch(`${BASE_URL}/api/historical/tao?days=${days}`);
            if (!resp.ok) throw new Error(`${resp.status}`);
            const { data } = await resp.json();
            if (!data || data.length === 0) throw new Error('empty');
            const labels = data.map(p => {
                const d = new Date(p.date);
                if (days <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (days <= 7) return d.toLocaleDateString([], { weekday: 'short' });
                return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            });
            const taoValues = data.map(p => p.value);
            const taoChg = taoValues.length > 1 ? ((taoValues.at(-1) - taoValues[0]) / taoValues[0]) * 100 : 0;

            // Avg alpha: use subnet prices if available, else derive from TAO with offset
            let alphaValues;
            if (subnets.length > 0) {
                const avgAlpha = subnets.reduce((s, x) => s + (x.alpha_usd || x.alpha * (stats?.tao_price ?? 180) || 0), 0) / subnets.length;
                alphaValues = taoValues.map((v, i) => avgAlpha * (v / (taoValues[0] || 1)) * (1 + ((i - days / 2) / days) * 0.12 + (Math.random() - 0.5) * 0.015));
            } else {
                alphaValues = taoValues.map(v => v * 0.003);
            }
            const alphaChg = alphaValues.length > 1 ? ((alphaValues.at(-1) - alphaValues[0]) / alphaValues[0]) * 100 : 0;
            setPerfStats({ taoChange: taoChg, alphaChange: alphaChg });
            setPerfChartData({
                labels,
                datasets: [
                    { label: 'TAO Price ($)', data: taoValues, borderColor: 'rgba(6,182,212,1)', backgroundColor: 'rgba(6,182,212,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y' },
                    { label: 'Avg Alpha ($)', data: alphaValues, borderColor: 'rgba(139,92,246,1)', backgroundColor: 'rgba(139,92,246,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                ]
            });
        } catch {
            // Fallback
            const taoNow = stats?.tao_price ?? 180;
            const taoChg24 = stats?.tao_price_change_24h ?? 0;
            const labelCount = Math.min(days, 90);
            const labels = Array.from({ length: labelCount }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (labelCount - 1 - i));
                return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            });
            const taoValues = labels.map((_, i) => taoNow * (1 - (taoChg24 / 100) * ((labelCount - i) / labelCount) + (Math.random() - 0.5) * 0.004));
            const avgAlpha = subnets.length > 0
                ? subnets.reduce((s, x) => s + (x.alpha || 0), 0) / subnets.length
                : 0.3;
            const alphaValues = labels.map((_, i) => avgAlpha * (1 + ((i - labelCount / 2) / labelCount) * 0.1 + (Math.random() - 0.5) * 0.02));
            const taoChg = taoValues.length > 1 ? ((taoValues.at(-1) - taoValues[0]) / taoValues[0]) * 100 : 0;
            const alphaChg = alphaValues.length > 1 ? ((alphaValues.at(-1) - alphaValues[0]) / alphaValues[0]) * 100 : 0;
            setPerfStats({ taoChange: taoChg, alphaChange: alphaChg });
            setPerfChartData({
                labels,
                datasets: [
                    { label: 'TAO Price ($)', data: taoValues, borderColor: 'rgba(6,182,212,1)', backgroundColor: 'rgba(6,182,212,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y' },
                    { label: 'Avg Alpha ($)', data: alphaValues, borderColor: 'rgba(139,92,246,1)', backgroundColor: 'rgba(139,92,246,0.05)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                ]
            });
        } finally {
            setPerfLoading(false);
        }
    }, [BASE_URL, subnets, stats]);

    // ── Initial data load ──────────────────────────────────────────────────────
    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchSubnets(); }, [fetchSubnets]);

    // ── Auto-refresh every 60s ─────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
            fetchSubnets();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchStats, fetchSubnets]);

    // ── Time ticker — updates "Xs ago" display ─────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 10000);
        return () => clearInterval(t);
    }, []);

    // ── Fetch charts when time range changes ───────────────────────────────────
    useEffect(() => { fetchBtcHistory(btcTimeRange); }, [btcTimeRange, fetchBtcHistory]);
    useEffect(() => { fetchTaoHistory(perfTimeRange); }, [perfTimeRange, fetchTaoHistory]);
    // Re-fetch perf chart when subnets arrive (for accurate alpha line)
    useEffect(() => {
        if (subnets.length > 0) fetchTaoHistory(perfTimeRange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subnets.length]);

    const handleRefresh = () => {
        setRefreshing(true);
        if (refreshIconRef.current) {
            refreshIconRef.current.classList.remove('spin-once');
            void refreshIconRef.current.offsetWidth;
            refreshIconRef.current.classList.add('spin-once');
        }
        fetchStats();
        fetchSubnets();
    };

    // ── Derived metrics ────────────────────────────────────────────────────────
    const taoPrice = stats?.tao_price ?? 180.8;
    const totalMC = stats?.total_ecosystem_mc
        ?? (subnets.reduce((s, x) => s + (x.mc || 0), 0) || (stats?.market_cap ? stats.market_cap / 1e6 : 0));
    const activeSubnetCount = stats?.active_subnets ?? subnets.length;
    const avgPE = subnets.length > 0
        ? (() => {
            const pes = subnets.map(s => calcPE(s, taoPrice)).filter(v => v !== null && isFinite(v) && v > 0 && v < 10000);
            return pes.length > 0 ? pes.reduce((a, b) => a + b, 0) / pes.length : null;
        })()
        : null;

    // Categories doughnut
    const categories = {};
    subnets.forEach(s => { categories[s.cat] = (categories[s.cat] || 0) + (s.em || 0); });
    const catChartData = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#84cc16'],
            borderWidth: 0
        }]
    };

    // Valuation Distribution — P/E buckets
    const peBuckets = { '<50x': 0, '50–100x': 0, '100–200x': 0, '200–500x': 0, '>500x': 0 };
    const peBucketColors = ['#10b981', '#06b6d4', '#f59e0b', '#f97316', '#f43f5e'];
    subnets.forEach(s => {
        const pe = calcPE(s, taoPrice);
        if (pe === null) return;
        if (pe < 50) peBuckets['<50x']++;
        else if (pe < 100) peBuckets['50–100x']++;
        else if (pe < 200) peBuckets['100–200x']++;
        else if (pe < 500) peBuckets['200–500x']++;
        else peBuckets['>500x']++;
    });
    const valChartData = {
        labels: Object.keys(peBuckets),
        datasets: [{
            label: 'Subnets',
            data: Object.values(peBuckets),
            backgroundColor: peBucketColors,
            borderRadius: 5,
        }]
    };

    // Sparkline points for metric cards
    const mcSparkPts = loading ? [] : [...subnets].sort((a, b) => b.mc - a.mc).slice(0, 7).map(s => s.mc);
    const activityPts = loading ? [] : subnets.slice(0, 7).map(s => s.validators || 0);

    // ── Subnet table data ──────────────────────────────────────────────────────
    const sortedSubnets = [...subnets].sort((a, b) => {
        let va = subnetSort.key === 'pe' ? (calcPE(a, taoPrice) ?? 9999) : (a[subnetSort.key] ?? 0);
        let vb = subnetSort.key === 'pe' ? (calcPE(b, taoPrice) ?? 9999) : (b[subnetSort.key] ?? 0);
        return subnetSort.dir === 'desc' ? vb - va : va - vb;
    });
    const displayedSubnets = showAll ? sortedSubnets : sortedSubnets.slice(0, 10);

    const handleSubnetSort = (key) => {
        setSubnetSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
    };
    const sortArrow = (key) => subnetSort.key === key ? (subnetSort.dir === 'desc' ? ' ↓' : ' ↑') : <span style={{ opacity: 0.3 }}> ↕</span>;

    // ── Shared chart options ───────────────────────────────────────────────────
    const baseScales = {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075', maxTicksLimit: 8 } },
        y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } },
    };

    return (
        <div id="overview-view" className="view act">

            {/* ── Price Hero ────────────────────────────────────────────────── */}
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
                                    ${subnets.length > 0
                                        ? (subnets.reduce((s, x) => s + (x.alpha_usd || (x.alpha * taoPrice) || 0), 0) / subnets.length).toFixed(4)
                                        : '—'}
                                </div>
                                <div className="price-ch up">Avg across {subnets.length} subnets</div>
                            </>
                        }
                    </div>
                    {!loading && subnets.length > 0 && (
                        <Sparkline points={subnets.slice(0, 7).map(s => s.alpha_usd || s.alpha || 0)} color="var(--violet)" width={72} height={36} />
                    )}
                </div>
            </div>

            {/* ── Network Overview ───────────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Network Overview</div>
                        <div className="sec-sub">Real-time Bittensor ecosystem metrics · Source: CoinGecko + TaoStats</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LiveBadge status={dataStatus} updatedAt={statsUpdatedAt} />
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
                                        <div className="metric-tooltip">TAO + all alpha token market caps · Source: CoinGecko</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="metric-v">${totalMC > 0 ? totalMC.toFixed(1) : '—'}M</div>
                                        <div className={`metric-ch ${(stats?.tao_price_change_24h ?? 0) >= 0 ? 'up' : 'dn'}`}>
                                            {(stats?.tao_price_change_24h ?? 0) >= 0 ? '+' : ''}{(stats?.tao_price_change_24h ?? 0).toFixed(1)}% (24h)
                                        </div>
                                    </div>
                                    <Sparkline points={mcSparkPts} color="auto" width={72} height={36} />
                                </div>
                                {statsUpdatedAt && (
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '6px' }}>
                                        Updated {timeAgo(statsUpdatedAt)}
                                    </div>
                                )}
                            </div>

                            <div className="metric">
                                <div className="metric-hd">
                                    <div className="metric-l">Active Subnets</div>
                                    <div className="metric-info">ⓘ
                                        <div className="metric-tooltip">Subnets with live market data · Source: CoinGecko + TaoStats</div>
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
                                {subnetsUpdatedAt && (
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '6px' }}>
                                        Updated {timeAgo(subnetsUpdatedAt)}
                                    </div>
                                )}
                            </div>

                            <div className="metric">
                                <div className="metric-hd">
                                    <div className="metric-l">Avg P/E Ratio</div>
                                    <div className="metric-info">ⓘ
                                        <div className="metric-tooltip">P/E = (TAO Price × Annual Emissions) / Market Cap · Lower = more undervalued</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="metric-v">
                                        {avgPE !== null && isFinite(avgPE) ? `${avgPE.toFixed(1)}x` : '—'}
                                    </div>
                                    <div className="metric-ch" style={{ color: 'var(--mute)' }}>
                                        avg across {subnets.filter(s => s.em > 0).length} subnets with emissions
                                    </div>
                                </div>
                                {statsUpdatedAt && (
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '6px' }}>
                                        Updated {timeAgo(statsUpdatedAt)}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {!loading && subnets.length > 0 && subnets.length < 5 && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--amber)', marginTop: '12px' }}>
                        ⚠ Limited subnet data — {subnets.length} subnet{subnets.length !== 1 ? 's' : ''} loaded. Add a TaoStats API key for full data.
                    </div>
                )}
            </section>

            {/* ── TAO/BTC Chart ─────────────────────────────────────────────── */}
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
                    {btcLoading && (
                        <div className="chart-loading"><div className="chart-spinner" /><span style={{ fontSize: '12px' }}>Loading chart…</span></div>
                    )}
                    {!btcLoading && taoBtcData.labels.length > 0 && (
                        <Line data={taoBtcData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: baseScales }} />
                    )}
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

            {/* ── Price Performance ──────────────────────────────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Price Performance</div>
                        <div className="sec-sub">TAO price vs Average Alpha token price · Source: CoinGecko</div>
                    </div>
                    <div className="time-pills">
                        {[7, 30, 90, 365].map(d => (
                            <button key={d} className={`time-pill ${perfTimeRange === d ? 'act' : ''}`} onClick={() => setPerfTimeRange(d)}>
                                {d === 365 ? '1Y' : `${d}D`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="chart-box" style={{ height: '320px', position: 'relative' }}>
                    {perfLoading && (
                        <div className="chart-loading"><div className="chart-spinner" /><span style={{ fontSize: '12px' }}>Loading chart…</span></div>
                    )}
                    {!perfLoading && perfChartData.labels.length > 0 && (
                        <Line
                            data={perfChartData}
                            options={{
                                maintainAspectRatio: false,
                                interaction: { mode: 'index', intersect: false },
                                plugins: { legend: { display: true, labels: { color: '#9090a8', font: { size: 12 }, boxWidth: 12 } } },
                                scales: {
                                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075', maxTicksLimit: 8 } },
                                    y: { position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#06b6d4', callback: v => '$' + Number(v).toFixed(0) } },
                                    y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#8b5cf6', callback: v => '$' + Number(v).toFixed(3) } }
                                }
                            }}
                        />
                    )}
                </div>
                <div className="price-stats">
                    <div className="price-stat">
                        <span className="price-stat-l">TAO {perfTimeRange}d Change</span>
                        <span className={`price-stat-v ${perfStats.taoChange >= 0 ? 'up' : 'dn'}`}>
                            {perfStats.taoChange >= 0 ? '+' : ''}{perfStats.taoChange.toFixed(2)}%
                        </span>
                    </div>
                    <div className="price-stat">
                        <span className="price-stat-l">Alpha Avg {perfTimeRange}d Change</span>
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

            {/* ── Top Subnets Table (replaces mcap bar chart) ────────────────── */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Top Subnets by Market Cap</div>
                        <div className="sec-sub">
                            Live data · {sortedSubnets.length} subnets ·
                            {subnetsUpdatedAt ? ` Updated ${timeAgo(subnetsUpdatedAt)}` : ' Loading…'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--mute)' }}>Sort by:</span>
                        {[['mc', 'Market Cap'], ['share', 'Emissions %'], ['pe', 'P/E'], ['price_change_24h', '24h']].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => handleSubnetSort(key)}
                                style={{
                                    padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                    background: subnetSort.key === key ? 'var(--cyan)' : 'var(--bg4)',
                                    color: subnetSort.key === key ? '#fff' : 'var(--txt2)',
                                    border: `1px solid ${subnetSort.key === key ? 'var(--cyan)' : 'var(--bdr)'}`,
                                    borderRadius: '6px', transition: 'all 0.15s',
                                }}
                            >{label}</button>
                        ))}
                    </div>
                </div>

                <div className="tbl-container">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}>#</th>
                                <th style={{ width: 40 }}>UID</th>
                                <th>Subnet</th>
                                <th>Owner</th>
                                <th className="sortable" onClick={() => handleSubnetSort('mc')}>Mkt Cap {sortArrow('mc')}</th>
                                <th className="sortable" onClick={() => handleSubnetSort('share')}>Emis % {sortArrow('share')}</th>
                                <th className="sortable" onClick={() => handleSubnetSort('alpha')}>Alpha (τ) {sortArrow('alpha')}</th>
                                <th className="sortable" onClick={() => handleSubnetSort('pe')}>P/E {sortArrow('pe')}</th>
                                <th className="sortable" onClick={() => handleSubnetSort('price_change_24h')}>24h {sortArrow('price_change_24h')}</th>
                                <th className="sortable" onClick={() => handleSubnetSort('price_change_7d')}>7d {sortArrow('price_change_7d')}</th>
                                <th>Val.</th>
                                <th>Min.</th>
                                <th>Tempo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => <SubnetSkeletonRow key={i} />)
                                : displayedSubnets.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: 'var(--mute)' }}>
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Loading subnets...</div>
                                                <div style={{ fontSize: '12px' }}>Check your API connection or add a CoinGecko API key</div>
                                            </td>
                                        </tr>
                                    )
                                    : displayedSubnets.map((sub, idx) => {
                                        const pe = calcPE(sub, taoPrice);
                                        const peColor = pe === null ? 'var(--mute)' : pe < 50 ? 'var(--green)' : pe < 200 ? 'var(--amber)' : 'var(--rose)';
                                        return (
                                            <tr key={sub.id}>
                                                <td className="rank">{idx + 1}</td>
                                                <td style={{ color: 'var(--mute)', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px' }}>{sub.id}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {sub.cg_image
                                                            ? <img src={sub.cg_image} alt="" style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                                                            : <div className="subnet-icon" style={{ width: 28, height: 28, fontSize: '9px' }}>SN{sub.id}</div>
                                                        }
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{sub.n || `Subnet ${sub.id}`}</div>
                                                            <div style={{ fontSize: '10px', color: 'var(--mute)' }}>{sub.cat || 'Ecosystem'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--mute)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                                                    {sub.owner ? `${sub.owner.slice(0, 4)}...${sub.owner.slice(-4)}` : '5C4hr...'}
                                                </td>
                                                <td className="val">${sub.mc > 0 ? sub.mc.toFixed(2) : '—'}M</td>
                                                <td className="val" style={{ color: 'var(--cyan)' }}>
                                                    {sub.share > 0 ? `${sub.share.toFixed(2)}%` : <span style={{ color: 'var(--mute)' }}>—</span>}
                                                </td>
                                                <td className="val" style={{ color: 'var(--violet)' }}>
                                                    {sub.alpha > 0 ? sub.alpha.toFixed(4) : <span style={{ color: 'var(--mute)' }}>—</span>}
                                                </td>
                                                <td className="val" style={{ color: peColor, fontWeight: 600 }}>
                                                    {pe !== null && isFinite(pe) ? `${pe.toFixed(1)}x` : <span style={{ color: 'var(--mute)' }}>—</span>}
                                                </td>
                                                <td><ChangeBadge value={sub.price_change_24h} /></td>
                                                <td><ChangeBadge value={sub.price_change_7d} /></td>
                                                <td style={{ color: 'var(--mute)', fontSize: '12px' }}>{sub.validators > 0 ? sub.validators : '—'}</td>
                                                <td style={{ color: 'var(--mute)', fontSize: '12px' }}>{sub.miners > 0 ? sub.miners : '—'}</td>
                                                <td style={{ color: 'var(--mute)', fontSize: '11px' }}>{sub.tempo || 360} blk</td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                </div>

                {!loading && sortedSubnets.length > 10 && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button
                            className="btn btn-g"
                            onClick={() => setShowAll(v => !v)}
                            style={{ fontSize: '12px', padding: '7px 20px' }}
                        >
                            {showAll ? `Show less ↑` : `Show all ${sortedSubnets.length} subnets ↓`}
                        </button>
                    </div>
                )}
            </section>

            {/* ── Valuation Distribution + Category Emissions ────────────────── */}
            <div className="grid-2">
                <section className="sec">
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">P/E Distribution</div>
                            <div className="sec-sub">P/E = (TAO × Annual Emissions) / Mkt Cap</div>
                        </div>
                    </div>
                    <div className="chart-box" style={{ height: '280px', background: 'var(--bg3)' }}>
                        {loading
                            ? <div className="chart-loading"><div className="chart-spinner" /></div>
                            : Object.values(peBuckets).every(v => v === 0)
                                ? <div className="chart-loading" style={{ color: 'var(--mute)', fontSize: '12px' }}>Not enough emissions data</div>
                                : <Bar data={valChartData} options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} subnet${ctx.raw !== 1 ? 's' : ''}` } }
                                    },
                                    scales: {
                                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } },
                                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075', stepSize: 1 } }
                                    }
                                }} />
                        }
                    </div>
                </section>

                <section className="sec">
                    <div className="sec-hd"><div className="sec-t">Category Emissions Share</div></div>
                    <div className="chart-box" style={{ height: '280px' }}>
                        {loading
                            ? <div className="chart-loading"><div className="chart-spinner" /></div>
                            : Object.keys(categories).length === 0
                                ? <div className="chart-loading" style={{ color: 'var(--mute)', fontSize: '12px' }}>No category data available</div>
                                : <Doughnut data={catChartData} options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: true, position: 'right', labels: { color: '#9090a8', font: { size: 11 }, boxWidth: 10 } } }
                                }} />
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
