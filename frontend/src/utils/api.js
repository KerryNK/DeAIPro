import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Wait for Firebase auth to initialise (fires once per page load).
 * Without this, components that mount immediately fetch before
 * onAuthStateChanged fires, get 401s, and never retry.
 */
const waitForAuth = () =>
    new Promise((resolve) => {
        if (auth.currentUser !== undefined) {
            resolve(auth.currentUser);
            return;
        }
        const unsub = auth.onAuthStateChanged((user) => {
            unsub();
            resolve(user);
        });
    });

export const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    // Wait for Firebase auth state to settle
    const currentUser = auth.currentUser ?? await waitForAuth();

    if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
};
