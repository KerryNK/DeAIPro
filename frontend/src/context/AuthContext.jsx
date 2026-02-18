import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isRestricted, setIsRestricted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Monitor Firebase Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // User is signed in
                const userData = {
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photo: currentUser.photoURL,
                    uid: currentUser.uid
                };
                setUser(userData);
                checkAccess(currentUser.email);
                localStorage.setItem('deai_user', JSON.stringify(userData));
            } else {
                // User is signed out
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
        // Check if email ends with @deaistrategies.io
        const hasFullAccess = email.toLowerCase().endsWith('@deaistrategies.io');
        setIsRestricted(!hasFullAccess);
        console.log(`User ${email} access check. Restricted: ${!hasFullAccess}`);
    };

    const login = async () => {
        setIsLoading(true);
        // Auth triggered via LoginModal directly using Firebase methods
        // This function might be deprecated or used for manual login if needed
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setIsRestricted(true);
            localStorage.removeItem('deai_user');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isRestricted, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
