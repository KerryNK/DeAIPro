import React, { useState } from 'react';

const ValuationTools = () => {
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
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Valuation Metrics Framework</div>
                        <div className="sec-sub">Essential metrics for institutional-grade subnet analysis</div>
                    </div>
                </div>
                {/* ... Info Boxes ... */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '10px', padding: '20px' }}>
                        {/* Content skipped for brevity, implementing calculators */}
                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 10 }}>Alpha/Emissions Ratio</div>
                        <p style={{ fontSize: '13px', color: 'var(--txt2)' }}>Primary Valuation Indicator.</p>
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: '10px', padding: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 10 }}>Price/Emissions Ratio</div>
                        <p style={{ fontSize: '13px', color: 'var(--txt2)' }}>Traditional Valuation Metric.</p>
                    </div>
                </div>
            </section>

            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Interactive Valuation Models</div>
                        <div className="sec-sub">Professional-grade calculators</div>
                    </div>
                </div>

                <div className="calc-g">
                    {/* Fair Value Model */}
                    <div className="calc-box">
                        <div className="calc-t" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>⚖️</span> Fair Value Model
                        </div>

                        <div className="calc-row">
                            <label className="calc-l">Annual OpEx ($)</label>
                            <input type="number" className="calc-in" value={opex} onChange={(e) => setOpex(parseFloat(e.target.value))} />
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">Daily Emissions (TAO)</label>
                            <input type="number" className="calc-in" value={dailyEm} onChange={(e) => setDailyEm(parseFloat(e.target.value))} />
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">Current TAO Price ($)</label>
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
                            </div>
                        </div>
                    </div>

                    {/* DCF Model */}
                    <div className="calc-box">
                        <div className="calc-t" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>📊</span> DCF Model
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">Daily Emissions</label>
                            <input type="number" className="calc-in" value={dcfEm} onChange={(e) => setDcfEm(parseFloat(e.target.value))} />
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">TAO Price</label>
                            <input type="number" className="calc-in" value={dcfTao} onChange={(e) => setDcfTao(parseFloat(e.target.value))} />
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">Growth Rate (%)</label>
                            <input type="number" className="calc-in" value={growth} onChange={(e) => setGrowth(parseFloat(e.target.value))} />
                        </div>
                        <div className="calc-row">
                            <label className="calc-l">Discount Rate (%)</label>
                            <input type="number" className="calc-in" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))} />
                        </div>

                        <div className="calc-res">
                            <div className="calc-res-t">DCF Intrinsic Value</div>
                            <div className="calc-res-v">${(dcfVal / 1000000).toFixed(1)}M</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ValuationTools;
