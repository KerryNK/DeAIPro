import React, { useState, useEffect } from 'react';

const Academy = () => {
    const [lessons, setLessons] = useState({});
    const [selectedLessonKey, setSelectedLessonKey] = useState(null);
    const [loading, setLoading] = useState(true);

    const lessonMeta = [
        { key: 'intro', icon: '🎓', title: 'Introduction to Bittensor', desc: 'Learn the fundamentals of decentralized AI networks', total: 5 },
        { key: 'subnet', icon: '🌐', title: 'Subnet Architecture', desc: 'Understand how subnets work, their validation mechanisms', total: 6 },
        { key: 'mining', icon: '⛏️', title: 'Mining & Validation', desc: 'Deep dive into becoming a miner or validator', total: 7 },
        { key: 'economics', icon: '💰', title: 'Tokenomics & Economics', desc: 'Master TAO economics, emission schedules', total: 5 },
        { key: 'valuation', icon: '📊', title: 'Valuation Methods', desc: 'Learn professional techniques for valuing subnets', total: 4 },
        { key: 'risk', icon: '⚠️', title: 'Risk Management', desc: 'Identify and mitigate risks when investing', total: 4 }, // No content in mock data but UI exists
    ];

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/academy`)
            .then(res => res.json())
            .then(data => {
                setLessons(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    const selectedLesson = selectedLessonKey ? lessons[selectedLessonKey] : null;

    if (loading) return <div className="cont">Loading academy...</div>;

    return (
        <div id="academy-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">DeAI Academy</div>
                        <div className="sec-sub">Master decentralized AI and Bittensor fundamentals</div>
                    </div>
                </div>

                <div className="acad-g">
                    {lessonMeta.map((meta) => (
                        <div key={meta.key} className="acad-c" onClick={() => setSelectedLessonKey(meta.key)}>
                            <div className="acad-icon">{meta.icon}</div>
                            <div className="acad-t">{meta.title}</div>
                            <div className="acad-desc">{meta.desc}</div>
                            <div className="acad-prog">
                                <div className="acad-prog-bar"><div className="acad-prog-fill" style={{ width: '0%' }}></div></div>
                                <span>0/{meta.total} lessons</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modal */}
            {selectedLessonKey && (
                <div className="lesson-m open">
                    <div className="lesson-box">
                        <div className="lesson-hdr">
                            <div className="lesson-hdr-l">
                                <div className="lesson-tag">{selectedLesson?.tag || 'Module'}</div>
                                <div className="lesson-t">{selectedLesson?.title || 'Loading...'}</div>
                                <div className="lesson-meta"><span>{selectedLesson?.meta}</span></div>
                            </div>
                            <div className="lesson-close" onClick={() => setSelectedLessonKey(null)}>×</div>
                        </div>
                        <div className="lesson-cnt">
                            {selectedLesson ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }}></div>
                            ) : (
                                <p>Content coming soon...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Academy;
