import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isRestricted, setIsRestricted] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Check for persisted user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('deai_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                checkAccess(parsedUser.email);
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('deai_user');
            }
        }
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

    const login = async (userData) => {
        setIsLoading(true);
        // Simulate API call/processing
        setTimeout(() => {
            setUser(userData);
            checkAccess(userData.email);
            localStorage.setItem('deai_user', JSON.stringify(userData));
            setIsLoading(false);
        }, 500);
    };

    const logout = () => {
        setUser(null);
        setIsRestricted(true);
        localStorage.removeItem('deai_user');
    };

    return (
        <AuthContext.Provider value={{ user, isRestricted, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
