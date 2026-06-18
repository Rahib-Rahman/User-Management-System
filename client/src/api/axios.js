import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://rahib-user-management-system.onrender.com/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

// ========================================
// AXIOS INTERCEPTOR: Global response handling
// If 401 or 403: user is blocked/deleted/logout
// Clear tokens and redirect to login immediately
// ========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // User is blocked or deleted - force logout
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberMe');
            // Redirect to login immediately
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
