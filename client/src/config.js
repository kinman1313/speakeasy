const config = {
    api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080',
        timeout: 30000 // 30 seconds
    },
    socket: {
        url: process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080',
        options: {
            transports: ['websocket'],
            upgrade: false
        }
    }
};

export default config;
