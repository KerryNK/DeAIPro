import React from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Header = ({ onLogin, onToggleMenu }) => {
    const { user, logout } = useAuth();
    const [taoPrice, setTaoPrice] = useState('...');
    const [taoChange, setTaoChange] = useState('...');
    const [tickerItems, setTickerItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, subnetsData] = await Promise.all([
                    fetchWithAuth('/api/stats'),
                    fetchWithAuth('/api/subnets')
                ]);

                setTaoPrice('$' + (statsData?.tao_price?.toFixed(2) || '...'));
                setTaoChange((statsData?.tao_price_change_24h > 0 ? '+' : '') + (statsData?.tao_price_change_24h || '...') + '%');

                const items = subnetsData.slice(0, 20).map(s => ({
                    id: s.id,
                    n: s.n,
                    momentum: s.momentum || (Math.random() * 20 - 10)
                }));
                setTickerItems([...items, ...items]);
            } catch (err) {
                console.error('Failed to fetch header data', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Get user initials for avatar
    const getUserInitial = () => {
        if (user?.name) return user.name.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <header className="hdr">
            <button className="ham" onClick={onToggleMenu}>
                <div className="ham-line"></div>
                <div className="ham-line"></div>
                <div className="ham-line"></div>
            </button>
            <div className="logo">
                <div className="logo-i" style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    τ
                </div>
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
                        <div className="stat-v" id="taoP">{taoPrice}</div>
                    </div>
                    <div className={`stat-ch ${taoChange.includes('+') ? 'up' : 'dn'}`} id="taoCh">{taoChange}</div>
                </div>
                <div className="stat">
                    <div>
                        <div className="stat-l">Network Cap</div>
                        <div className="stat-v" id="netCap">$1.28B</div>
                    </div>
                </div>
                <div className="stat">
                    <div>
                        <div className="stat-l">24h Volume</div>
                        <div className="stat-v" id="tradeVol">$8.4M</div>
                    </div>
                    <div className="stat-ch up" id="volCh">+12.3%</div>
                </div>
            </div>
            <div className="hdr-r">
                <div className="live">
                    <div className="live-d"></div>
                    <span id="liveTs">LIVE</span>
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
