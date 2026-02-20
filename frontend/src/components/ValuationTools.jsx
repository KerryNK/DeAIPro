import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';


const ValuationTools = () => {
    const { isRestricted, openLoginModal, isLoading: authLoading } = useAuth();
    const showOverlay = !authLoading && isRestricted;


    // Calculator States
    const [opex, setOpex] = useState(9125000);
    const [dailyEm, setDailyEm] = useState(135);
    const [taoPrice, setTaoPrice] = useState(180.80);

    const calcFairValue = () => {
        // (OpEx / 365) / Emissions
        const dailyOpex = opex / 365;
        if (dailyEm === 0) return 0;
        return dailyOpex / dailyEm;
    };

    const fv = calcFairValue();
    const premium = taoPrice > 0 ? ((taoPrice - fv) / fv) * 100 : 0; // Incorrect formula in original?
    // Original formula logic: "If Fair Value > Current Price, profitable".
    // "Premium % shows how much current price exceeds fair value." -> ((Price - FV) / FV)
    // Actually the calculation in JS original was: 
    // var fv = (opex/365)/em;
    // var prem = ((tp - fv)/fv)*100;

    // DCF States
    const [dcfEm, setDcfEm] = useState(135);
    const [dcfTao, setDcfTao] = useState(180.80);
    const [growth, setGrowth] = useState(5);
    const [discount, setDiscount] = useState(25);
    const [years, setYears] = useState(5);

    // Score Weights States
    const [weights, setWeights] = useState({
        economic: 20,
        network: 15,
        fundamental: 25,
        liquidity: 15,
        momentum: 10,
        quality: 10,
        valuation: 5
    });

    const updateWeight = (key, value) => {
        setWeights(prev => ({ ...prev, [key]: parseInt(value) }));
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    const calcDCF = () => {
        let totalVal = 0;
        for (let i = 1; i <= years; i++) {
            const yearlyEm = dcfEm * 365 * Math.pow(1 + growth / 100, i - 1);
            const yearlyVal = yearlyEm * dcfTao; // Simplified assumption of constant price? Or price grows too?
            // Original JS logic: 
            // var cf = (em*365*tao) * Math.pow(1+g/100, i); 
            // var disc = cf / Math.pow(1+d/100, i);
            const cf = (dcfEm * 365 * dcfTao) * Math.pow(1 + growth / 100, i);
            const disc = cf / Math.pow(1 + discount / 100, i);
            totalVal += disc;
        }
        return totalVal;
    };

    const dcfVal = calcDCF();

    return (
        <div id="valuation-view" className="view act">
            <div className={`blur-content ${showOverlay ? 'restricted' : ''}`}>

                <section className="sec">
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">Valuation Metrics Framework</div>
                            <div className="sec-sub">Essential metrics for institutional-grade subnet analysis</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '10px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,var(--green),var(--cyan))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>α</div>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt)' }}>Alpha/Emissions Ratio (α/EM)</div>
                                    <div style={{ fontSize: '11px', color: 'var(--mute)' }}>Primary Valuation Indicator</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--txt2)', lineHeight: 1.7 }}>
                                <p style={{ marginBottom: '12px' }}>The Alpha/Emissions ratio measures the <strong style={{ color: 'var(--cyan)' }}>cost efficiency</strong> of staking in a subnet. It represents the alpha token price relative to the subnet's emission share.</p>
                                <p style={{ marginBottom: '12px' }}><strong>Formula:</strong> <code style={{ background: 'var(--bg4)', padding: '4px 8px', borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace" }}>α/EM = Alpha Price / Emission Share %</code></p>
                                <p style={{ marginBottom: '12px' }}><strong>Interpretation:</strong></p>
                                <ul style={{ marginLeft: '16px', marginBottom: '12px' }}>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--green)' }}>&lt; 0.20:</span> Undervalued — Strong buy signal. The subnet is generating proportionally more emissions than its price suggests.</li>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--amber)' }}>0.20 - 0.30:</span> Fair Value — Market efficiently pricing the subnet's emission potential.</li>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--rose)' }}>&gt; 0.30:</span> Expensive — Premium pricing. Requires exceptional fundamentals to justify.</li>
                                </ul>
                                <p><strong>Investment Thesis:</strong> Lower ratios indicate cheaper entry points for equivalent emission exposure. Sophisticated validators target &lt; 0.25 for value accumulation.</p>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '10px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,var(--violet),var(--pink))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>P/E</div>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt)' }}>Price/Emissions Ratio (P/E)</div>
                                    <div style={{ fontSize: '11px', color: 'var(--mute)' }}>Traditional Valuation Metric</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--txt2)', lineHeight: 1.7 }}>
                                <p style={{ marginBottom: '12px' }}>The Price/Emissions ratio adapts traditional P/E analysis for subnet valuation. It measures <strong style={{ color: 'var(--violet)' }}>market cap relative to annual emission value</strong>.</p>
                                <p style={{ marginBottom: '12px' }}><strong>Formula:</strong> <code style={{ background: 'var(--bg4)', padding: '4px 8px', borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace" }}>P/E = Market Cap / (Daily Emissions × TAO Price × 365)</code></p>
                                <p style={{ marginBottom: '12px' }}><strong>Interpretation:</strong></p>
                                <ul style={{ marginLeft: '16px', marginBottom: '12px' }}>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--green)' }}>&lt; 1.5x:</span> Attractive — Subnet generates high emissions relative to valuation.</li>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--amber)' }}>1.5x - 2.0x:</span> Fair — Typical range for established subnets.</li>
                                    <li style={{ marginBottom: '6px' }}><span style={{ color: 'var(--rose)' }}>&gt; 2.0x:</span> Growth Premium — Market expects significant expansion.</li>
                                </ul>
                                <p><strong>Key Insight:</strong> Unlike traditional equities, subnet P/E ratios are compressed due to crypto volatility premiums. A 1.8x subnet P/E is equivalent to roughly 15x in traditional markets.</p>
                            </div>
                        </div>
                    </div>

                    <div className="eval-guide" style={{ marginBottom: 0 }}>
                        <div className="eval-t">Quick Reference: Valuation Zones</div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div className="eval-item" style={{ flex: 1, minWidth: '200px' }}>
                                <div className="eval-color" style={{ background: 'rgba(16,185,129,0.7)' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="eval-label">Undervalued</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>α/EM &lt; 0.2 • P/E &lt; 1.5x</div>
                                </div>
                                <div className="eval-range">BUY</div>
                            </div>
                            <div className="eval-item" style={{ flex: 1, minWidth: '200px' }}>
                                <div className="eval-color" style={{ background: 'rgba(245,158,11,0.7)' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="eval-label">Fair Value</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>α/EM 0.2-0.3 • P/E 1.5-2.0x</div>
                                </div>
                                <div className="eval-range">HOLD</div>
                            </div>
                            <div className="eval-item" style={{ flex: 1, minWidth: '200px' }}>
                                <div className="eval-color" style={{ background: 'rgba(244,63,94,0.7)' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="eval-label">Expensive</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>α/EM &gt; 0.3 • P/E &gt; 2.0x</div>
                                </div>
                                <div className="eval-range">CAUTION</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="sec">
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">Interactive Valuation Models</div>
                            <div className="sec-sub">Professional-grade calculators with real-time sensitivity analysis</div>
                        </div>
                    </div>

                    <div className="calc-g">
                        {/* Fair Value Model */}
                        <div className="calc-box">
                            <div className="calc-t" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>⚖️</span> Fair Value Model
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--txt2)', marginBottom: '16px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', lineHeight: 1.6 }}>
                                <strong>Purpose:</strong> Calculates the break-even token price where operational costs equal emission revenue. Identifies whether a subnet is profitable to operate at current prices.
                            </div>

                            <div className="calc-row">
                                <label className="calc-l">
                                    Annual Operational Expenditure ($)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>↑ Higher OpEx = Higher fair value needed</span>
                                </label>
                                <input type="number" className="calc-in" value={opex} onChange={(e) => setOpex(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    Daily Emissions (TAO)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>↑ More emissions = Lower fair value threshold</span>
                                </label>
                                <input type="number" className="calc-in" value={dailyEm} onChange={(e) => setDailyEm(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    Current TAO Price ($)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>Compare to fair value result</span>
                                </label>
                                <input type="number" className="calc-in" value={taoPrice} onChange={(e) => setTaoPrice(parseFloat(e.target.value))} />
                            </div>

                            <div className="calc-res">
                                <div className="calc-res-t">Fair Value per TAO</div>
                                <div className="calc-res-v">${fv.toFixed(2)}</div>
                                <div className="calc-res-det">
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Signal</div>
                                        <div className="calc-res-det-v" style={{ color: fv > taoPrice ? 'var(--green)' : 'var(--rose)' }}>
                                            {fv > taoPrice ? 'UNDER' : 'OVER'}
                                        </div>
                                    </div>
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Premium/Discount</div>
                                        <div className="calc-res-det-v">{premium.toFixed(1)}%</div>
                                    </div>
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Daily OpEx</div>
                                        <div className="calc-res-det-v">${(opex / 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    </div>
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Annual Emissions Value</div>
                                        <div className="calc-res-det-v">${((dailyEm * 365 * taoPrice) / 1000000).toFixed(1)}M</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '12px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--cyan)' }}>How to interpret:</strong> If Fair Value &gt; Current Price, the subnet is profitable to operate. If Fair Value &lt; Current Price, emissions don't cover operational costs. Premium % shows how much current price exceeds fair value.
                            </div>
                        </div>

                        {/* DCF Model */}
                        <div className="calc-box">
                            <div className="calc-t" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>📊</span> Discounted Cash Flow (DCF) Model
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--txt2)', marginBottom: '16px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', lineHeight: 1.6 }}>
                                <strong>Purpose:</strong> Projects future emission value over multiple years, discounting back to present value. This accounts for growth expectations and risk, providing an intrinsic valuation independent of current market sentiment.
                            </div>

                            <div className="calc-row">
                                <label className="calc-l">
                                    Daily Emissions (TAO)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>Base for all projections</span>
                                </label>
                                <input type="number" className="calc-in" value={dcfEm} onChange={(e) => setDcfEm(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    TAO Price ($)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>Used to convert emissions to USD value</span>
                                </label>
                                <input type="number" className="calc-in" value={dcfTao} onChange={(e) => setDcfTao(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    Annual Growth Rate (%)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>↑ Higher growth = Higher valuation</span>
                                </label>
                                <input type="number" className="calc-in" value={growth} onChange={(e) => setGrowth(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    Discount Rate (%)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>↑ Higher risk = Lower valuation (typically 20-35% for crypto)</span>
                                </label>
                                <input type="number" className="calc-in" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))} />
                            </div>
                            <div className="calc-row">
                                <label className="calc-l">
                                    Projection Period (Years)
                                    <span className="calc-weight" style={{ fontSize: '10px', opacity: 0.7 }}>Longer = More speculative but captures growth</span>
                                </label>
                                <input type="number" className="calc-in" value={years} onChange={(e) => setYears(parseFloat(e.target.value))} />
                            </div>

                            <div className="calc-res">
                                <div className="calc-res-t">DCF Intrinsic Value</div>
                                <div className="calc-res-v">${(dcfVal / 1000000).toFixed(1)}M</div>
                                <div className="calc-res-det">
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Signal</div>
                                        <div className="calc-res-det-v">N/A</div>
                                    </div>
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Potential Upside</div>
                                        <div className="calc-res-det-v">N/A</div>
                                    </div>
                                    <div className="calc-res-det-i">
                                        <div className="calc-res-det-l">Value/Price Ratio</div>
                                        <div className="calc-res-det-v">N/A</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '12px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--cyan)' }}>How to interpret:</strong> Value/Price &gt; 1.0x suggests undervaluation. The DCF model is sensitive to discount rate—increasing from 25% to 30% typically reduces valuation by 15-20%. Use conservative growth rates (0-10%) for established subnets.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Score Components */}
                <section className="sec">
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">Composite Score Methodology</div>
                            <div className="sec-sub">Customize weightings for multi-factor subnet analysis</div>
                        </div>
                    </div>

                    <div className="calc-g">
                        <div className="calc-box">
                            <div className="calc-t">Component Weights</div>
                            <div style={{ fontSize: '12px', color: 'var(--txt2)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Adjust weights to create custom scoring models. Total should equal 100% for proper normalization.
                            </div>
                            {Object.entries(weights).map(([key, val]) => (
                                <div className="calc-row" key={key}>
                                    <label className="calc-l" style={{ textTransform: 'capitalize' }}>
                                        {key}
                                        <span className="calc-weight">{val}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        className="calc-slider"
                                        min="0"
                                        max="50"
                                        value={val}
                                        onChange={(e) => updateWeight(key, e.target.value)}
                                    />
                                </div>
                            ))}

                            <div className="calc-res">
                                <div className="calc-res-t">Total Weight</div>
                                <div className="calc-res-v" style={{ color: totalWeight === 100 ? 'var(--green)' : 'var(--rose)' }}>{totalWeight}%</div>
                            </div>
                        </div>

                        <div className="calc-box">
                            <div className="calc-t">Component Definitions</div>
                            <div style={{ fontSize: '12px', lineHeight: 1.8, color: 'var(--txt2)' }}>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--cyan)' }}>
                                    <strong style={{ color: 'var(--cyan)' }}>Economic (20%):</strong> Measures revenue sustainability through emission share percentage, daily TAO generation, and operational cost coverage ratio. Higher scores indicate subnets generating sustainable economic value.
                                </div>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--green)' }}>
                                    <strong style={{ color: 'var(--green)' }}>Network (15%):</strong> Evaluates network health via active validators, registered miners, total stake, and UID utilization. Robust networks demonstrate decentralization and resilience.
                                </div>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--violet)' }}>
                                    <strong style={{ color: 'var(--violet)' }}>Fundamental (25%):</strong> Core value assessment including operational expenditure replacement value, P/E ratio, and long-term sustainability metrics. The highest-weighted factor for institutional analysis.
                                </div>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--amber)' }}>
                                    <strong style={{ color: 'var(--amber)' }}>Liquidity (15%):</strong> Trading accessibility measured by volume depth, market maker presence, bid-ask spreads, and slippage on standard order sizes.
                                </div>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--pink)' }}>
                                    <strong style={{ color: 'var(--pink)' }}>Momentum (10%):</strong> Price trend analysis including 7-day and 30-day price changes, volume trends, and net stake flows. Captures market sentiment direction.
                                </div>
                                <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--lime)' }}>
                                    <strong style={{ color: 'var(--lime)' }}>Quality (10%):</strong> Development excellence via GitHub commit frequency, test coverage percentage, documentation completeness, and contributor diversity.
                                </div>
                                <div style={{ padding: '12px', background: 'var(--bg4)', borderRadius: '8px', borderLeft: '3px solid var(--rose)' }}>
                                    <strong style={{ color: 'var(--rose)' }}>Valuation (5%):</strong> Speculative premium analysis comparing market price to fundamental-derived fair value. Lower premiums score higher.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sharpe Ratio Section */}
                <section className="sec">
                    <div className="sec-hd">
                        <div>
                            <div className="sec-t">Risk-Adjusted Returns: Sharpe Ratio</div>
                            <div className="sec-sub">Measure subnet performance relative to risk taken</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                        <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '12px', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,var(--amber),var(--rose))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff' }}>SR</div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>Sharpe Ratio Calculator</div>
                                    <div style={{ fontSize: '12px', color: 'var(--mute)' }}>Risk-adjusted return measurement</div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg4)', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '13px', color: 'var(--txt2)', lineHeight: 1.7 }}>
                                <p style={{ marginBottom: '12px' }}>The <strong style={{ color: 'var(--amber)' }}>Sharpe Ratio</strong> measures excess return per unit of risk. Higher ratios indicate better risk-adjusted performance.</p>
                                <p style={{ marginBottom: '12px' }}><strong>Formula:</strong></p>
                                <div style={{ background: 'var(--bg3)', padding: '12px', borderRadius: '6px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', marginBottom: '12px' }}>
                                    Sharpe = (Return - Risk-Free Rate) / Standard Deviation
                                </div>
                                <p><strong>Components:</strong></p>
                                <ul style={{ marginLeft: '16px', marginTop: '8px' }}>
                                    <li><strong>Return:</strong> Annualized APY from staking</li>
                                    <li><strong>Risk-Free Rate:</strong> ~5% (US Treasury baseline)</li>
                                    <li><strong>Standard Deviation:</strong> Annualized volatility of returns</li>
                                </ul>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(244,63,94,0.15)', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.3)' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rose)' }}>&lt; 0.5</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)', marginTop: '4px' }}>Poor</div>
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '4px' }}>Risk exceeds reward</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(245,158,11,0.15)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--amber)' }}>0.5 - 1.0</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)', marginTop: '4px' }}>Acceptable</div>
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '4px' }}>Moderate risk/reward</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>&gt; 1.0</div>
                                    <div style={{ fontSize: '11px', color: 'var(--txt2)', marginTop: '4px' }}>Excellent</div>
                                    <div style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '4px' }}>Superior risk-adjusted</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '12px', padding: '24px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--txt)' }}>Historical Sharpe Benchmarks</div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>TAO (Annualized)</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyan)' }}>0.8 - 1.2</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>Top Subnet Tokens</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>0.5 - 1.5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>Bitcoin (BTC)</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber)' }}>0.4 - 0.8</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg4)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>S&P 500 Index</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mute)' }}>0.3 - 0.5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg4)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>High-Yield Bonds</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mute)' }}>0.2 - 0.4</span>
                                </div>
                            </div>

                            <div style={{ padding: '14px', background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.1))', borderRadius: '8px', fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--cyan)' }}>💡 Investment Insight:</strong><br />
                                Bittensor subnets with Sharpe ratios &gt; 1.0 offer superior risk-adjusted returns compared to traditional assets. Focus on subnets with high APY and low volatility (high liquidity, stable emissions).
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {showOverlay && (
                <div className="restriction-overlay">
                    <div className="restriction-box">
                        <div className="restriction-icon">🔒</div>
                        <h3>Sign In Required</h3>
                        <p>Sign in with your <b>DeAI Strategies</b> account to access valuation tools and advanced analytics.</p>
                        <button className="btn btn-p" onClick={openLoginModal}>Sign In</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValuationTools;
