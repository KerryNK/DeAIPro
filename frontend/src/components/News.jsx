import React, { useState, useEffect } from 'react';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/news')
            .then(res => res.json())
            .then(data => {
                setNews(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
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
