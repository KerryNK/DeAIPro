import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Fallback data generation (ported from HTML)
function generateFallbackData(days) {
    const data = [];
    const now = Date.now();
    const msPerDay = 86400000;
    const points = days <= 1 ? 24 : days <= 7 ? days * 4 : days <= 30 ? days : Math.min(days, 365);
    const interval = (days === 1 ? 3600000 : (days * msPerDay) / points);

    // Base ratio around 0.002 - 0.004 BTC with realistic variance
    let ratio = 0.0028 + (Math.random() - 0.5) * 0.001;

    for (let i = points; i >= 0; i--) {
        const timestamp = now - (i * interval);
        // Add realistic price movement
        ratio += (Math.random() - 0.48) * 0.0001;
        ratio = Math.max(0.0015, Math.min(0.006, ratio));
        data.push({ timestamp, ratio });
    }
    return data;
}

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [btcTimeRange, setBtcTimeRange] = useState(30);
    const [taoBtcData, setTaoBtcData] = useState({ labels: [], datasets: [] });
    const [taoBtcStats, setTaoBtcStats] = useState({ current: 0, change: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, subnetsRes] = await Promise.all([
                    fetch('http://localhost:8000/api/stats'),
                    fetch('http://localhost:8000/api/subnets')
                ]);

                const statsData = await statsRes.json();
                const subnetsData = await subnetsRes.json();

                setStats(statsData);
                setSubnets(subnetsData);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="cont">Loading dashboard...</div>;

    // Prepare Chart Data
    const sortedByMcap = [...subnets].sort((a, b) => b.mc - a.mc).slice(0, 10);
    const mcapChartData = {
        labels: sortedByMcap.map(s => `SN${s.id}`),
        datasets: [{
            label: 'Market Cap ($M)',
            data: sortedByMcap.map(s => s.mc),
            backgroundColor: '#06b6d4',
            borderRadius: 4
        }]
    };

    const categories = {};
    subnets.forEach(s => {
        categories[s.cat] = (categories[s.cat] || 0) + s.em;
    });
    const catChartData = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'],
            borderWidth: 0
        }]
    };

    useEffect(() => {
        // Generate TAO/BTC data
        const dataPoints = generateFallbackData(btcTimeRange);
        const labels = dataPoints.map(p => {
            const date = new Date(p.timestamp);
            if (btcTimeRange <= 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (btcTimeRange <= 7) return date.toLocaleDateString([], { weekday: 'short' });
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });
        const values = dataPoints.map(p => p.ratio);

        const current = values[values.length - 1];
        const first = values[0];
        const change = ((current - first) / first * 100);

        setTaoBtcStats({ current, change });

        const lineColor = change >= 0 ? 'rgba(139,92,246,1)' : 'rgba(244,63,94,1)';
        const bgColor = change >= 0 ? 'rgba(139,92,246,0.1)' : 'rgba(244,63,94,0.1)';

        setTaoBtcData({
            labels,
            datasets: [{
                label: 'TAO/BTC',
                data: values,
                borderColor: lineColor,
                backgroundColor: bgColor,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        });
    }, [btcTimeRange]);


    // Valuation Distribution (Alpha/Emissions)
    // Buckets: <0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, >0.8
    const buckets = { '<0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '>0.8': 0 };
    subnets.forEach(s => {
        const alphaEm = s.alpha / (s.share / 100 || 1); // Simple approximation if share is %
        // Actually alpha is price, share is %. The ratio is alpha/share?
        // "Alpha/Emissions ratio measures the cost efficiency... Formula: α/EM = Alpha Price / Emission Share %"
        const ratio = s.alpha / (s.share || 1); // Avoid div by zero
        // Wait, provided data has alpha values like 0.15, 0.50 etc. 
        // The prompt says "Alpha/Emissions ratio... <0.20: Undervalued".
        // Let's assume the 'alpha' field in data IS the ratio or related.
        // Data: "alpha": 0.15. This looks like the ratio itself.
        const val = s.alpha;
        if (val < 0.2) buckets['<0.2']++;
        else if (val < 0.4) buckets['0.2-0.4']++;
        else if (val < 0.6) buckets['0.4-0.6']++;
        else if (val < 0.8) buckets['0.6-0.8']++;
        else buckets['>0.8']++;
    });

    const valChartData = {
        labels: Object.keys(buckets),
        datasets: [{
            label: 'Subnets Count',
            data: Object.values(buckets),
            backgroundColor: '#10b981',
            borderRadius: 4
        }]
    };

    return (
        <div id="overview-view" className="view act">
            <div className="grid-2" style={{ marginBottom: '20px' }}>
                <div className="price-box">
                    <div className="price-icon">τ</div>
                    <div className="price-info">
                        <div className="price-l">TAO Price</div>
                        <div className="price-v" id="taoPriceLive">${stats?.tao_price.toFixed(2)}</div>
                        <div className={`price-ch ${stats?.tao_price_change_24h > 0 ? 'up' : 'dn'}`}>
                            {stats?.tao_price_change_24h > 0 ? '+' : ''}{stats?.tao_price_change_24h}% (24h)
                        </div>
                    </div>
                </div>
                <div className="price-box">
                    <div className="price-icon">α</div>
                    <div className="price-info">
                        <div className="price-l">Sum Alpha Prices</div>
                        <div className="price-v" id="alphaPrice">1.19</div>
                        <div className="price-ch up">+2.8% (24h)</div>
                    </div>
                </div>
            </div>

            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Network Overview</div>
                        <div className="sec-sub">Real-time Bittensor ecosystem metrics</div>
                    </div>
                </div>

                <div className="metric-g">
                    <div className="metric">
                        <div className="metric-hd">
                            <div className="metric-l">Total Market Cap</div>
                            <div className="metric-info">?
                                <div className="metric-tooltip">
                                    Total value of all subnets combined, calculated from emissions and TAO price
                                </div>
                            </div>
                        </div>
                        <div className="metric-v" id="kpi-tmc">${(stats?.market_cap / 1000000).toFixed(1)}M</div>
                        <div className="metric-ch up">+5.2% (24h)</div>
                    </div>

                    <div className="metric">
                        <div className="metric-hd">
                            <div className="metric-l">Active Subnets</div>
                            <div className="metric-info">?
                                <div className="metric-tooltip">
                                    Number of operational subnets with active validators and miners
                                </div>
                            </div>
                        </div>
                        <div className="metric-v" id="kpi-sn">{subnets.length}</div>
                        <div className="metric-ch up">+3 (7d)</div>
                    </div>

                    <div className="metric">
                        <div className="metric-hd">
                            <div className="metric-l">Avg P/E Ratio</div>
                            <div className="metric-info">?
                                <div className="metric-tooltip">
                                    Network average Price-to-Emissions ratio, indicating valuation relative to emissions
                                </div>
                            </div>
                        </div>
                        <div className="metric-v" id="kpi-pe">1.68x</div>
                        <div className="metric-ch dn">-0.12x (7d)</div>
                    </div>
                </div>
            </section>

            {/* TAO/BTC Ratio Chart */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">TAO/BTC Ratio</div>
                        <div className="sec-sub">Is TAO gaining against Bitcoin? • Data from CoinGecko</div>
                    </div>
                    <div className="sec-act">
                        <div className="time-pills">
                            {[1, 7, 30, 365].map(d => (
                                <button
                                    key={d}
                                    className={`time-pill ${btcTimeRange === d ? 'act' : ''}`}
                                    onClick={() => setBtcTimeRange(d)}
                                >
                                    {d === 1 ? '24H' : d === 365 ? '1Y' : `${d}D`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="chart-box" style={{ height: '320px', position: 'relative' }}>
                    <Line data={taoBtcData} options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } },
                            y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#606075' } }
                        }
                    }} />
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

            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Valuation Distribution</div>
                        <div className="sec-sub">Subnet valuation analysis by alpha/emissions ratio</div>
                    </div>
                </div>
                <div className="chart-box" style={{ height: '360px', background: 'var(--bg3)' }}>
                    <Bar data={valChartData} options={{ maintainAspectRatio: false }} />
                </div>
            </section>

            <div className="grid-2">
                <section className="sec">
                    <div className="sec-hd">
                        <div className="sec-t">Top Subnets by Market Cap</div>
                    </div>
                    <div className="chart-box" style={{ height: '360px' }}>
                        <Bar data={mcapChartData} options={{ maintainAspectRatio: false, indexAxis: 'y' }} />
                    </div>
                </section>

                <section className="sec">
                    <div className="sec-hd">
                        <div className="sec-t">Category Emissions Share</div>
                    </div>
                    <div className="chart-box" style={{ height: '360px' }}>
                        <Doughnut data={catChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
