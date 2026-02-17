import React, { useState, useEffect } from 'react';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/news`)
            .then(res => res.json())
            .then(data => {
                setNews(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch news:", err);
                // Fallback data
                setNews([
                    { "tg": "Ecosystem", "t": "qBitTensor Labs Outlines Subnet Progress and Strategy", "s": "TAO Daily", "tm": "2 hours ago", "url": "https://taodaily.io/qbittensor-labs-outlines-subnet-progress-and-strategy-in-latest-bittensor-livestream/" },
                    { "tg": "Market", "t": "Taostats Analysis Shows Root Claims Faster Than Promised", "s": "TAO Daily", "tm": "5 hours ago", "url": "https://taodaily.io/taostats-analysis-shows-bittensor-root-claims-are-faster-than-promised/" },
                    { "tg": "Subnet", "t": "This Bittensor Subnet Just Went Up 999%", "s": "TAO Daily", "tm": "8 hours ago", "url": "https://taodaily.io/this-bittensor-tao-subnet-just-went-up-999/" }
                ]);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="cont">Loading news...</div>;

    return (
        <div id="intelligence-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Bittensor News</div>
                        <div className="sec-sub">Latest Bittensor ecosystem updates and news</div>
                    </div>
                </div>
                <div className="news-g" id="newsG">
                    {news.map((item, index) => (
                        <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="news-c">
                            <span className="news-tag">{item.tg}</span>
                            <div className="news-t">{item.t}</div>
                            <div className="news-meta">
                                <span>{item.s}</span>
                                <span>•</span>
                                <span>{item.tm}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default News;
