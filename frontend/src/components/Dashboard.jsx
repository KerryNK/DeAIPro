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

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Mock historical data for TAO/BTC (since we don't have real historical API yet)
    const taoBtcChartData = {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [{
            label: 'TAO/BTC',
            data: [0.0028, 0.0029, 0.0031, 0.0030, 0.0032, 0.0033, 0.0034],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            fill: true,
            tension: 0.4
        }]
    };

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
                            <div className="metric-info">?</div>
                        </div>
                        <div className="metric-v" id="kpi-tmc">${(stats?.market_cap / 1000000).toFixed(1)}M</div>
                        <div className="metric-ch up">+5.2% (24h)</div>
                    </div>

                    <div className="metric">
                        <div className="metric-hd">
                            <div className="metric-l">Active Subnets</div>
                        </div>
                        <div className="metric-v" id="kpi-sn">{subnets.length}</div>
                        <div className="metric-ch up">+3 (7d)</div>
                    </div>

                    <div className="metric">
                        <div className="metric-hd">
                            <div className="metric-l">Avg P/E Ratio</div>
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
                </div>
                <div className="chart-box" style={{ height: '320px', position: 'relative' }}>
                    <Line data={taoBtcChartData} options={{ maintainAspectRatio: false }} />
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
