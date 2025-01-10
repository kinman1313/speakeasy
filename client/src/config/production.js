export const config = {
    API_URL: 'https://lies-server-9ayj.onrender.com', // Server URL
    SOCKET_URL: 'wss://lies-server-9ayj.onrender.com', // WebSocket URL
    GIPHY_API_KEY: process.env.REACT_APP_GIPHY_API_KEY,
    FILE_UPLOAD_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    VOICE_MESSAGE_MAX_DURATION: 60, // 60 seconds
    MESSAGE_EXPIRY_OPTIONS: [
        { value: 0, label: 'Never' },
        { value: 300, label: '5 minutes' },
        { value: 3600, label: '1 hour' },
        { value: 86400, label: '24 hours' },
        { value: 604800, label: '7 days' }
    ],
    DEFAULT_NOTIFICATION_SOUND: '/sounds/notification.mp3',
    TYPING_INDICATOR_TIMEOUT: 3000,
}; 