import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleLogin = (e) => {
        e.preventDefault();
        alert("Login functionality coming soon via Auth0/Firebase!");
        onClose();
    };

    return (
        <div className={`modal ${isOpen ? 'open' : ''}`}>
            <div className="modal-box">
                <div className="modal-t">Sign in to DeAI Nexus Pro</div>
                <p style={{ fontSize: '13px', color: 'var(--txt2)', marginBottom: '24px' }}>Access advanced analytics, personalized alerts, and portfolio tracking</p>
                <form onSubmit={handleLogin}>
                    <div className="form-row">
                        <label className="form-l">Email Address</label>
                        <input type="email" className="form-in" placeholder="your@email.com" required />
                    </div>
                    <div className="form-act">
                        <button type="button" className="btn btn-g" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-p">Continue</button>
                    </div>
                </form>
                <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center', marginTop: '20px' }}>We'll send you a magic link to sign in securely</p>
            </div>
        </div>
    );
};

export default LoginModal;
