import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    resetPassword: (email) => api.post('/auth/reset-password', { email }),
    verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
    setNewPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

// User API
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    searchUsers: (query) => api.get(`/users/search?query=${query}`),
    sendFriendRequest: (userId) => api.post(`/users/friend-request/${userId}`),
    acceptFriendRequest: (userId) => api.post(`/users/accept-friend-request/${userId}`),
    removeFriend: (userId) => api.delete(`/users/friend/${userId}`)
};

// Messages API
export const messageAPI = {
    getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
    sendMessage: (conversationId, data) => api.post(`/messages/${conversationId}`, data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    editMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
    markAsRead: (messageId) => api.post(`/messages/${messageId}/read`)
};

// Groups API
export const groupAPI = {
    createGroup: (data) => api.post('/groups', data),
    getGroup: (groupId) => api.get(`/groups/${groupId}`),
    updateGroup: (groupId, data) => api.put(`/groups/${groupId}`, data),
    deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
    addMember: (groupId, userId) => api.post(`/groups/${groupId}/members/${userId}`),
    removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
    leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`)
};

// Giphy API
export const giphyAPI = {
    search: (query, limit = 20, offset = 0) => api.get('/giphy/search', { params: { q: query, limit, offset } }),
    trending: (limit = 20) => api.get('/giphy/trending', { params: { limit } }),
    getById: (id) => api.get(`/giphy/${id}`)
};

export default api;
