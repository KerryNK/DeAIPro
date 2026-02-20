import React from 'react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const Header = ({ onLogin, onToggleMenu }) => {
    const { user, logout, isLoading: authLoading } = useAuth();
    const [taoPrice, setTaoPrice] = useState(null);
    const [taoChange, setTaoChange] = useState(null);
    const [netCap, setNetCap] = useState(null);
    const [tickerItems, setTickerItems] = useState([]);
    const [dataStatus, setDataStatus] = useState('loading');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [secAgo, setSecAgo] = useState(0);
    const timerRef = useRef(null);

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // ── Fetch public /api/stats immediately — no auth needed ─────────────────
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const resp = await fetch(`${BASE_URL}/api/stats`);
                if (!resp.ok) throw new Error(`${resp.status}`);
                const statsData = await resp.json();
                setTaoPrice(statsData?.tao_price ?? null);
                setTaoChange(statsData?.tao_price_change_24h ?? null);
                setNetCap(statsData?.market_cap ?? null);
                setLastUpdated(Date.now());
                setSecAgo(0);
                setDataStatus(prev => prev === 'loading' ? 'live' : prev);
            } catch (err) {
                console.error('Header stats fetch failed', err);
                setDataStatus('delayed');
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []); // runs once on mount, then every 60s

    // ── Fetch /api/subnets for ticker (after auth settles) ──────────────────
    useEffect(() => {
        if (authLoading) return;
        const fetchTicker = async () => {
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (user) {
                    const token = await auth.currentUser?.getIdToken();
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                }
                const resp = await fetch(`${BASE_URL}/api/subnets`, { headers });
                if (!resp.ok) throw new Error(`${resp.status}`);
                const subnetsData = await resp.json();
                const items = (Array.isArray(subnetsData) ? subnetsData : []).slice(0, 20).map(s => ({
                    id: s.id, n: s.n, momentum: s.momentum || (Math.random() * 20 - 10)
                }));
                setTickerItems([...items, ...items]);
                setDataStatus('live');
            } catch (err) {
                console.error('Header ticker fetch failed', err);
            }
        };
        fetchTicker();
    }, [authLoading, user]);


    // Live "X sec ago" counter
    useEffect(() => {
        clearInterval(timerRef.current);
        if (!lastUpdated) return;
        timerRef.current = setInterval(() => {
            setSecAgo(Math.floor((Date.now() - lastUpdated) / 1000));
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, [lastUpdated]);

    const liveLabel = dataStatus === 'loading' ? '…'
        : dataStatus === 'delayed' ? 'DELAYED'
            : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`;

    const liveStyle = dataStatus === 'delayed'
        ? { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: 'var(--amber)' }
        : {};
    const dotStyle = dataStatus === 'delayed'
        ? { background: 'var(--amber)', animation: 'none' } : {};

    const getUserInitial = () => {
        if (user?.name) return user.name.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <header className="hdr">
            <button className="ham" onClick={onToggleMenu}>
                <div className="ham-line" /><div className="ham-line" /><div className="ham-line" />
            </button>
            <div className="logo">
                <div className="logo-i" style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>τ</div>
                <div>
                    <div className="logo-t">DeAI <span>Nexus</span></div>
                    <div className="logo-s">Bittensor Intelligence</div>
                </div>
            </div>
            <div className="ticker-container">
                <div className="ticker" id="ticker">
                    {tickerItems.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="ticker-item">
                            <span className="ticker-name">{item.n}</span>
                            <span className="ticker-val" style={{ color: item.momentum >= 0 ? 'var(--green)' : 'var(--rose)' }}>
                                {item.momentum >= 0 ? '+' : ''}{item.momentum.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hdr-c">
                <div className="stat">
                    <div>
                        <div className="stat-l">TAO Price</div>
                        <div className="stat-v" id="taoP">
                            {taoPrice !== null ? `$${taoPrice.toFixed(2)}` : '—'}
                        </div>
                    </div>
                    <div className={`stat-ch ${(taoChange ?? 0) >= 0 ? 'up' : 'dn'}`} id="taoCh">
                        {taoChange !== null ? `${taoChange >= 0 ? '+' : ''}${taoChange.toFixed(2)}%` : '—'}
                    </div>
                </div>
                <div className="stat">
                    <div>
                        <div className="stat-l">Network Cap</div>
                        <div className="stat-v" id="netCap">
                            {netCap ? `$${(netCap / 1e9).toFixed(2)}B` : '—'}
                        </div>
                    </div>
                </div>
            </div>
            <div className="hdr-r">
                <div className="live" style={liveStyle}>
                    <div className="live-d" style={dotStyle} />
                    <span id="liveTs">{liveLabel}</span>
                </div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* User Avatar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--bg3)', borderRadius: '20px',
                            padding: '4px 12px 4px 4px',
                            border: '1px solid var(--bdr)'
                        }}>
                            {user.photo ? (
                                <img
                                    src={user.photo}
                                    alt={user.name}
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '13px', fontWeight: 700, color: '#fff'
                                }}>
                                    {getUserInitial()}
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt)', lineHeight: 1.2 }}>
                                    {user.name || user.email?.split('@')[0]}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--mute)', lineHeight: 1.2 }}>
                                    {user.email}
                                </div>
                            </div>
                        </div>
                        {/* Sign Out Button */}
                        <button
                            className="btn btn-g"
                            onClick={logout}
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-p" onClick={onLogin}>
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
