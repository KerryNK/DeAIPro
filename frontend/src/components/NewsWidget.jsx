import React from 'react';
import useSWR from 'swr';
import { ExternalLink, Clock } from 'lucide-react';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const NewsWidget = () => {
    const { data: news, error, isLoading } = useSWR(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/news`,
        fetcher,
        { refreshInterval: 300000 } // Refresh every 5 mins
    );

    if (isLoading) return <div className="news-widget-loading">Loading news...</div>;
    if (error) return <div className="news-widget-error">Unable to load news</div>;

    // Display top 3 news items
    const topNews = news?.slice(0, 3) || [];

    return (
        <div className="chart-box" style={{ height: 'auto', minHeight: '180px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topNews.map((item, index) => (
                <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="news-widget-item">
                    <div className="news-widget-hdr">
                        <span className="news-widget-tag">{item.tg}</span>
                        <div className="news-widget-meta">
                            <Clock size={12} />
                            <span>{item.tm}</span>
                        </div>
                    </div>
                    <div className="news-widget-title">{item.t}</div>
                    <div className="news-widget-footer">
                        <span className="news-widget-source">{item.s}</span>
                        <ExternalLink size={12} style={{ opacity: 0.5 }} />
                    </div>
                </a>
            ))}
            {topNews.length === 0 && <div className="news-empty">No recent news available</div>}
        </div>
    );
};

export default NewsWidget;
