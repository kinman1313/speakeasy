// Default to production URL if not in development
const API_URL = process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : 'https://lies-server.onrender.com');

// Axios default config
import axios from 'axios';
axios.defaults.withCredentials = true;

export const config = {
    API_URL,
    SOCKET_URL: API_URL
}; 