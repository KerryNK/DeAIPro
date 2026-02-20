import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isRestricted, setIsRestricted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // Monitor Firebase Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const userData = {
                    name: currentUser.displayName || currentUser.email?.split('@')[0],
                    email: currentUser.email,
                    photo: currentUser.photoURL,
                    uid: currentUser.uid
                };
                setUser(userData);
                checkAccess(currentUser.email);
                localStorage.setItem('deai_user', JSON.stringify(userData));
            } else {
                setUser(null);
                setIsRestricted(true);
                localStorage.removeItem('deai_user');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const checkAccess = (email) => {
        if (!email) {
            setIsRestricted(true);
            return;
        }
        // Full access for @deaistrategies.io emails
        const hasFullAccess = email.toLowerCase().endsWith('@deaistrategies.io');
        setIsRestricted(!hasFullAccess);
    };

    const openLoginModal = () => setIsLoginOpen(true);
    const closeLoginModal = () => setIsLoginOpen(false);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsRestricted(true);
            localStorage.removeItem('deai_user');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isRestricted,
            isLoading,
            isLoginOpen,
            openLoginModal,
            closeLoginModal,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
