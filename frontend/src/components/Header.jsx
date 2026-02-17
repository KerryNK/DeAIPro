import React, { useState, useEffect } from 'react';

const Header = ({ onLogin }) => {
    const [taoPrice, setTaoPrice] = useState('...');
    const [taoChange, setTaoChange] = useState('...');

    useEffect(() => {
        fetch('http://localhost:8000/api/stats')
            .then(res => res.json())
            .then(data => {
                setTaoPrice('$' + data.tao_price.toFixed(2));
                setTaoChange((data.tao_price_change_24h > 0 ? '+' : '') + data.tao_price_change_24h + '%');
            })
            .catch(err => console.error("Failed to fetch stats", err));
    }, []);

    return (
        <header className="hdr">
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
                    {/* Ticker items would go here */}
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
