import React, { useState, useEffect } from 'react';

const Research = () => {
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/research`)
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return <div className="cont">Loading research...</div>;

    return (
        <div id="research-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Latest Research & Reports</div>
                        <div className="sec-sub">In-depth analysis and market insights</div>
                    </div>
                </div>
                <div className="res-g" id="resG">
                    {articles.map((article, index) => (
                        <div key={index} className="res-c" onClick={() => setSelectedArticle(article)} style={{ cursor: 'pointer' }}>
                            <div className="res-img">{article.i}</div>
                            <div className="res-cnt">
                                <span className="res-cat">{article.c}</span>
                                <div className="res-t">{article.t}</div>
                                <div className="res-ex">{article.ex}</div>
                                <div className="res-meta">
                                    <span>{article.d}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modal */}
            {selectedArticle && (
                <div className="lesson-m open">
                    <div className="lesson-box">
                        <div className="lesson-hdr">
                            <div className="lesson-hdr-l">
                                <div className="lesson-tag" id="researchCat">{selectedArticle.c}</div>
                                <div className="lesson-t" id="researchTitle">{selectedArticle.t}</div>
                                <div className="lesson-meta"><span id="researchDate">{selectedArticle.d}</span></div>
                            </div>
                            <div className="lesson-close" onClick={() => setSelectedArticle(null)}>×</div>
                        </div>
                        <div className="lesson-cnt" dangerouslySetInnerHTML={{ __html: selectedArticle.content }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Research;
