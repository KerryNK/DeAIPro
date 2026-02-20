import React from 'react';

/**
 * Inline SVG sparkline — no library needed.
 * points: array of numbers (min 2), width/height in px.
 * color: stroke color string.
 */
export const Sparkline = ({ points = [], width = 80, height = 28, color = 'var(--cyan)' }) => {
    if (!points || points.length < 2) {
        return <svg width={width} height={height} />;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = width / (points.length - 1);
    const path = points
        .map((v, i) => {
            const x = i * step;
            const y = height - ((v - min) / range) * (height - 4) - 2;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    const lastY = height - ((points[points.length - 1] - min) / range) * (height - 4) - 2;
    const trend = points[points.length - 1] >= points[0];
    const strokeColor = color === 'auto' ? (trend ? 'var(--green)' : 'var(--rose)') : color;

    return (
        <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id={`sg-${width}-${height}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Fill area */}
            <path
                d={`${path} L${((points.length - 1) * step).toFixed(1)},${height} L0,${height} Z`}
                fill={`url(#sg-${width}-${height})`}
            />
            {/* Line */}
            <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* End dot */}
            <circle cx={(points.length - 1) * step} cy={lastY} r="2.5" fill={strokeColor} />
        </svg>
    );
};

/**
 * Skeleton shimmer block — pass width/height as strings or numbers (px assumed).
 */
export const Skeleton = ({ width = '100%', height = 16, radius = 6, className = '' }) => (
    <div
        className={`skeleton ${className}`}
        style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius: `${radius}px`,
        }}
    />
);

/**
 * Full skeleton card matching the .metric style.
 */
export const SkeletonMetric = () => (
    <div className="metric" style={{ cursor: 'default' }}>
        <div style={{ marginBottom: '12px' }}>
            <Skeleton width="55%" height={10} />
        </div>
        <Skeleton width="70%" height={28} radius={4} style={{ marginBottom: '8px' }} />
        <Skeleton width="40%" height={10} />
    </div>
);

/**
 * Skeleton table row — render 6 of these while subnets load.
 */
export const SkeletonRow = ({ cols = 9 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} style={{ padding: '14px 12px' }}>
                <Skeleton width={i === 0 ? 24 : i === 1 ? 140 : i === 2 ? 70 : 60} height={12} />
            </td>
        ))}
    </tr>
);

/**
 * Live / Delayed status pill.
 * status: 'live' | 'delayed' | 'loading'
 * updatedAt: Date or null
 */
export const LiveBadge = ({ status = 'live', updatedAt = null }) => {
    const secAgo = updatedAt ? Math.floor((Date.now() - updatedAt) / 1000) : null;
    const label =
        status === 'loading' ? 'Connecting...' :
            status === 'delayed' ? 'Feed delayed' :
                secAgo !== null ? (secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`) : 'LIVE';

    const colors = {
        live: { dot: 'var(--green)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: 'var(--green)' },
        delayed: { dot: 'var(--amber)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: 'var(--amber)' },
        loading: { dot: 'var(--mute)', bg: 'rgba(96,96,117,0.1)', border: 'rgba(96,96,117,0.2)', text: 'var(--mute)' },
    };
    const c = colors[status] || colors.live;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '20px', fontSize: '10px',
            fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase',
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            userSelect: 'none',
        }}>
            <div style={{
                width: 6, height: 6, borderRadius: '50%', background: c.dot,
                animation: status === 'live' ? 'pulse 2s infinite' : 'none',
                flexShrink: 0,
            }} />
            {label}
        </div>
    );
};
