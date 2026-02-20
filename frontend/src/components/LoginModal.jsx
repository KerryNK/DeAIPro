import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const LoginModal = ({ isOpen, onClose }) => {
    const [tab, setTab] = useState('signin'); // 'signin' | 'request'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            onClose();
        } catch (err) {
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onClose();
        } catch (err) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email. Request access below.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please reset your password or try later.');
            } else {
                setError('Sign in failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setSuccess('Password reset email sent! The link expires in 24 hours.');
        } catch (err) {
            setError('Could not send reset email. Check the address and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Check for an existing pending/approved request
            const q = query(
                collection(db, 'accessRequests'),
                where('email', '==', email.toLowerCase())
            );
            const existing = await getDocs(q);
            if (!existing.empty) {
                const doc = existing.docs[0].data();
                if (doc.status === 'approved') {
                    setError('Your request has already been approved. Check your email for your login link.');
                } else if (doc.status === 'pending') {
                    setSuccess('Your request is already pending review. We\'ll email you when approved.');
                } else {
                    setError('Your previous request was not approved. Contact the DeAI Strategies team directly.');
                }
                setLoading(false);
                return;
            }

            // Write new access request to Firestore
            await addDoc(collection(db, 'accessRequests'), {
                email: email.toLowerCase(),
                role: role || 'Not specified',
                status: 'pending',
                requestedAt: serverTimestamp(),
            });

            setSuccess(`Access request submitted for ${email}. If approved, you'll receive a login link by email valid for 24 hours.`);
            setEmail('');
            setRole('');
        } catch (err) {
            console.error('Request access error:', err);
            setError('Failed to submit request. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setError('');
        setSuccess('');
        setShowReset(false);
        setEmail('');
        setPassword('');
        setRole('');
        setResetEmail('');
    };

    return (
        <div className={`modal ${isOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: '420px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="modal-t" style={{ marginBottom: 0 }}>
                        {showReset ? 'Reset Password' : 'Sign in to DeAI Nexus Pro'}
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                    >×</button>
                </div>

                {!showReset && (
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg3)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
                        {['signin', 'request'].map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); resetForm(); }}
                                style={{
                                    flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    background: tab === t ? 'var(--bg4)' : 'transparent',
                                    color: tab === t ? 'var(--txt)' : 'var(--mute)',
                                    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
                                }}
                            >
                                {t === 'signin' ? 'Sign In' : 'Request Access'}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--rose)', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green)', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                        {success}
                    </div>
                )}

                {/* Password Reset View */}
                {showReset && (
                    <>
                        <p style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '20px', lineHeight: 1.6 }}>
                            Enter your email and we'll send a password reset link. The link expires after{' '}
                            <strong style={{ color: 'var(--cyan)' }}>24 hours</strong>.
                        </p>
                        <form onSubmit={handlePasswordReset}>
                            <div className="form-row">
                                <label className="form-l">Email Address</label>
                                <input
                                    type="email" className="form-in"
                                    placeholder="your@email.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-act">
                                <button type="button" className="btn btn-g" onClick={() => setShowReset(false)}>Back</button>
                                <button type="submit" className="btn btn-p" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* Sign In */}
                {!showReset && tab === 'signin' && (
                    <>
                        <button
                            className="btn btn-w"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fff', color: '#000' }}
                        >
                            <img src="https://developers.google.com/identity/images/g-logo.png" alt="G" style={{ width: '18px' }} />
                            Sign in with Google
                        </button>

                        <div style={{ textAlign: 'center', color: 'var(--mute)', fontSize: '12px', margin: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
                            OR
                            <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
                        </div>

                        <form onSubmit={handleEmailLogin}>
                            <div className="form-row">
                                <label className="form-l">Email Address</label>
                                <input
                                    type="email" className="form-in"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-l">Password</label>
                                <input
                                    type="password" className="form-in"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowReset(true); setError(''); setSuccess(''); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="form-act">
                                <button type="button" className="btn btn-g" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn btn-p" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </div>
                        </form>

                        <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center', marginTop: '16px' }}>
                            Don't have access?{' '}
                            <button onClick={() => { setTab('request'); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                                Request it here
                            </button>
                        </p>
                    </>
                )}

                {/* Request Access */}
                {!showReset && tab === 'request' && (
                    <>
                        <p style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '20px', lineHeight: 1.6 }}>
                            Submit a request for access. A <strong style={{ color: 'var(--cyan)' }}>@deaistrategies.io</strong> admin will review and, if approved, you'll receive a login link by email valid for <strong style={{ color: 'var(--cyan)' }}>24 hours</strong>.
                        </p>
                        <form onSubmit={handleRequestAccess}>
                            <div className="form-row">
                                <label className="form-l">Your Email Address</label>
                                <input
                                    type="email" className="form-in"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={!!success}
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-l">Organisation / Role (optional)</label>
                                <input
                                    type="text" className="form-in"
                                    placeholder="e.g. Validator, Investor, Researcher"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={!!success}
                                />
                            </div>
                            <div className="form-act">
                                <button type="button" className="btn btn-g" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn btn-p" disabled={loading || !!success}>
                                    {loading ? 'Submitting...' : 'Request Access'}
                                </button>
                            </div>
                        </form>
                        <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center', marginTop: '16px' }}>
                            Already have an account?{' '}
                            <button onClick={() => { setTab('signin'); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                                Sign in
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginModal;
