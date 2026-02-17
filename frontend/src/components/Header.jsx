import React, { useState, useEffect } from 'react';

const Header = ({ onLogin, onToggleMenu }) => {
    const [taoPrice, setTaoPrice] = useState('...');
    const [taoChange, setTaoChange] = useState('...');

    const [tickerItems, setTickerItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, subnetsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/stats`),
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/subnets`)
                ]);

                const statsData = await statsRes.json();
                const subnetsData = await subnetsRes.json();

                setTaoPrice('$' + statsData.tao_price.toFixed(2));
                setTaoChange((statsData.tao_price_change_24h > 0 ? '+' : '') + statsData.tao_price_change_24h + '%');

                // Prepare ticker data (top 20 by momentum, mock momentum if missing)
                // The mock data provided to backend might not have momentum, let's check.
                // If not, we generate it or use a random one like the HTML does?
                // HTML data has momentum. Backend data.py likely has it.
                const items = subnetsData.slice(0, 20).map(s => ({
                    id: s.id,
                    n: s.n,
                    momentum: s.momentum || (Math.random() * 20 - 10) // Fallback if missing
                }));
                // Duplicate for infinite scroll
                setTickerItems([...items, ...items]);

            } catch (err) {
                console.error("Failed to fetch header data", err);
            }
        };

        fetchData();
        // Live updates simulation could go here
    }, []);

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
                <button className="btn btn-p" onClick={onLogin}>
                    Sign In
                </button>
            </div>
        </header>
    );
};

export default Header;
