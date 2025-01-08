const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss://speakeasy-server.onrender.com", "https://speakeasy-server.onrender.com", "https://api.giphy.com"],
            imgSrc: ["'self'", "https://media.giphy.com", "data:", "blob:"],
            mediaSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            workerSrc: ["'self'", "blob:"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle all routes for SPA
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 