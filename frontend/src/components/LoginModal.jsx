import React, { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const LoginModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            onClose();
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            setError("Failed to sign in with Google. Check console for details.");
        }
    };

    const handleEmailLogin = (e) => {
        e.preventDefault();
        // Allow manual entry for testing different domains
        login({
            name: email.split('@')[0],
            email: email,
            photo: null
        });
        onClose();
    };

    return (
        <div className={`modal ${isOpen ? 'open' : ''}`}>
            <div className="modal-box">
                <div className="modal-t">Sign in to DeAI Nexus Pro</div>
                <p style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '24px' }}>Access advanced analytics, personalized alerts, and portfolio tracking</p>

                <button className="btn btn-w" onClick={handleGoogleLogin} style={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fff', color: '#000' }}>
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="G" style={{ width: '18px' }} />
                    Sign in with Google
                </button>

                {error && <div style={{ color: 'var(--rose)', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}

                <div style={{ textAlign: 'center', color: 'var(--mute)', fontSize: '12px', margin: '16px 0' }}>OR</div>

                <form onSubmit={handleEmailLogin}>
                    <div className="form-row">
                        <label className="form-l">Email Address</label>
                        <input
                            type="email"
                            className="form-in"
                            placeholder="your@deaistrategies.io"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-act">
                        <button type="button" className="btn btn-g" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-p">Continue</button>
                    </div>
                </form>
                <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center', marginTop: '20px' }}>
                    Try <b>test@deaistrategies.io</b> for full access
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
