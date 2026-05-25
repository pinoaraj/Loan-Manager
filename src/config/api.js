const resolveDefaultApiUrl = () => {
    if (typeof window === 'undefined') {
        return 'http://127.0.0.1:3011/api';
    }

    const { protocol, hostname } = window.location;
    if (protocol === 'file:') {
        return 'http://127.0.0.1:3011/api';
    }

    const resolvedHost = hostname === 'localhost' ? 'localhost' : '127.0.0.1';
    return `http://${resolvedHost}:3011/api`;
};

export const API_URL = import.meta.env.VITE_API_URL || resolveDefaultApiUrl();
