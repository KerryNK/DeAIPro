import React, { useState, useEffect } from 'react';

const SubnetExplorer = () => {
    const [subnets, setSubnets] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/api/subnets')
            .then(res => res.json())
            .then(data => {
                setSubnets(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch subnets", err);
                setLoading(false);
            });
    }, []);

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedSubnets = [...subnets].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.5 }}>↕</span>;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const getGradeClass = (score) => {
        if (score >= 80) return 'grade-a';
        if (score >= 60) return 'grade-b';
        if (score >= 40) return 'grade-c';
        return 'grade-d';
    };

    const getGradeLabel = (score) => {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    };

    if (loading) return <div className="cont">Loading explorer...</div>;

    return (
        <div id="subnet-view" className="view act">
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Subnet Explorer</div>
                        <div className="sec-sub">Comprehensive subnet analytics and metrics • Click any row to expand</div>
                    </div>
                    <div className="sec-act">
                        {/* Sort dropdown could go here, but column headers are sortable */}
                    </div>
                </div>

                <div className="pill-g" id="pillG"></div>

                <table className="tbl">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>ID</th>
                            <th>Subnet</th>
                            <th>Grade</th>
                            <th className="sortable" onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>Score {getSortIndicator('score')}</th>
                            <th className="sortable" onClick={() => handleSort('alpha')} style={{ cursor: 'pointer' }}>Alpha {getSortIndicator('alpha')}</th>
                            <th className="sortable" onClick={() => handleSort('mc')} style={{ cursor: 'pointer' }}>Market Cap {getSortIndicator('mc')}</th>
                            <th className="sortable" onClick={() => handleSort('em')} style={{ cursor: 'pointer' }}>EM % {getSortIndicator('em')}</th>
                            <th className="sortable" onClick={() => handleSort('val')} style={{ cursor: 'pointer' }}>Validators {getSortIndicator('val')}</th>
                            {/* <th className="sortable" onClick={() => handleSort('aem')} style={{cursor:'pointer'}}>A/EM {getSortIndicator('aem')}</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSubnets.map((sub, index) => (
                            <tr key={sub.id}>
                                <td className="rank">{index + 1}</td>
                                <td className="val">{sub.id}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="subnet-icon">{sub.n.substring(0, 2).toUpperCase()}</div>
                                        <div>
                                            <div className="n">{sub.n}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--mute)' }}>{sub.cat}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`grade ${getGradeClass(sub.score)}`}>{getGradeLabel(sub.score)}</span>
                                </td>
                                <td className="val">{sub.score}</td>
                                <td className="val">{sub.alpha}</td>
                                <td className="val">${sub.mc}M</td>
                                <td className="val">{sub.share}%</td>
                                <td className="val">{sub.validators}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default SubnetExplorer;
