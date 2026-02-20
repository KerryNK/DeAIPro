import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, serverTimestamp
} from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminPanel = () => {
    const { user, isAdmin } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'denied' | 'all'
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    // Real-time listener on accessRequests collection
    useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, 'accessRequests'), orderBy('requestedAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [isAdmin]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleApprove = async (request) => {
        setActionLoading(request.id);
        try {
            // Get the admin's Firebase ID token to prove admin authority to backend
            const idToken = await auth.currentUser.getIdToken();

            const res = await fetch(`${API_URL}/api/admin/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ email: request.email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Approval failed');
            }

            // Mark as approved in Firestore
            await updateDoc(doc(db, 'accessRequests', request.id), {
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedBy: user.email,
            });

            showToast(`✓ Approved ${request.email} — password reset email sent.`);
        } catch (err) {
            showToast(`✗ ${err.message}`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeny = async (request) => {
        setActionLoading(request.id + '_deny');
        try {
            await updateDoc(doc(db, 'accessRequests', request.id), {
                status: 'denied',
                deniedAt: serverTimestamp(),
                deniedBy: user.email,
            });
            showToast(`Request from ${request.email} denied.`);
        } catch (err) {
            showToast(`Failed to deny: ${err.message}`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    if (!isAdmin) {
        return (
            <div id="admin-view" className="view act">
                <section className="sec" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <div className="sec-t">Access Denied</div>
                    <div className="sec-sub">This panel is only accessible to @deaistrategies.io admins.</div>
                </section>
            </div>
        );
    }

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
    const counts = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        denied: requests.filter(r => r.status === 'denied').length,
    };

    const statusColor = { pending: 'var(--amber)', approved: 'var(--green)', denied: 'var(--rose)' };
    const statusBg = { pending: 'rgba(245,158,11,0.1)', approved: 'rgba(16,185,129,0.1)', denied: 'rgba(244,63,94,0.1)' };

    return (
        <div id="admin-view" className="view act">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
                    background: toast.type === 'error' ? 'rgba(244,63,94,0.95)' : 'rgba(16,185,129,0.95)',
                    color: '#fff', padding: '12px 20px', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    animation: 'fadeIn 0.2s',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <section className="sec">
                <div className="sec-hd">
                    <div>
                        <div className="sec-t">Admin Panel</div>
                        <div className="sec-sub">Review and manage access requests to DeAI Pro</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {[['pending', counts.pending], ['approved', counts.approved], ['denied', counts.denied]].map(([s, c]) => (
                            <div key={s} style={{
                                background: statusBg[s], border: `1px solid ${statusColor[s]}44`,
                                borderRadius: '8px', padding: '8px 16px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: statusColor[s] }}>{c}</div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--mute)', letterSpacing: '0.5px' }}>{s}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filter tabs */}
            <section className="sec">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {['pending', 'approved', 'denied', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 16px', borderRadius: '20px', border: 'none',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                background: filter === f ? 'var(--cyan)' : 'var(--bg3)',
                                color: filter === f ? '#000' : 'var(--txt2)',
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}{f !== 'all' && ` (${counts[f] ?? 0})`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--mute)', padding: '40px' }}>Loading requests...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--mute)', padding: '40px' }}>
                        No {filter === 'all' ? '' : filter} requests.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map(req => {
                            const date = req.requestedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Unknown';
                            const isActing = actionLoading === req.id || actionLoading === req.id + '_deny';

                            return (
                                <div key={req.id} style={{
                                    background: 'var(--bg3)', border: '1px solid var(--bdr)',
                                    borderRadius: '12px', padding: '16px 20px',
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    opacity: isActing ? 0.6 : 1, transition: 'opacity 0.2s',
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                                    }}>
                                        {req.email[0].toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--txt)', fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {req.email}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--txt2)' }}>
                                            {req.role || 'No role specified'} · Requested {date}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <div style={{
                                        padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                        background: statusBg[req.status] || 'var(--bg4)',
                                        color: statusColor[req.status] || 'var(--mute)',
                                        flexShrink: 0,
                                    }}>
                                        {req.status}
                                    </div>

                                    {/* Actions */}
                                    {req.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button
                                                className="btn btn-p"
                                                style={{ fontSize: '12px', padding: '6px 14px' }}
                                                onClick={() => handleApprove(req)}
                                                disabled={isActing}
                                            >
                                                {actionLoading === req.id ? 'Approving...' : '✓ Approve'}
                                            </button>
                                            <button
                                                className="btn btn-g"
                                                style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--rose)', borderColor: 'var(--rose)' }}
                                                onClick={() => handleDeny(req)}
                                                disabled={isActing}
                                            >
                                                {actionLoading === req.id + '_deny' ? 'Denying...' : '✗ Deny'}
                                            </button>
                                        </div>
                                    )}
                                    {req.status === 'approved' && (
                                        <div style={{ fontSize: '11px', color: 'var(--mute)', flexShrink: 0 }}>
                                            by {req.approvedBy || 'admin'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Info note */}
            <section className="sec" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--cyan)' }}>ℹ How approval works:</strong> When you click Approve, the backend creates a Firebase Auth account for the user and sends them a password reset email. The reset link expires in <strong>24 hours</strong> (configure in Firebase Console → Authentication → Templates → Password reset → Token expiry: <code>86400</code>).
                </div>
            </section>
        </div>
    );
};

export default AdminPanel;
