"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
var _express = _interopRequireDefault(require("express"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _cors = _interopRequireDefault(require("cors"));
var _compression = _interopRequireDefault(require("compression"));
var _helmet = _interopRequireDefault(require("helmet"));
var _http = _interopRequireDefault(require("http"));
var _socketService = _interopRequireDefault(require("./socket/socketService.js"));
var _messageEncryptionService = _interopRequireDefault(require("./services/messageEncryptionService.js"));
var _logger = _interopRequireDefault(require("./utils/logger.js"));
var _error = require("./middleware/error.js");
var _auth = require("./middleware/auth.js");
var _users = _interopRequireDefault(require("./routes/users.js"));
var _messages = _interopRequireDefault(require("./routes/messages.js"));
var _groups = _interopRequireDefault(require("./routes/groups.js"));
// Import routes

_dotenv.default.config();

// Create Express app
const app = (0, _express.default)();

// Create HTTP server
const server = _http.default.createServer(app);

// Initialize Socket.IO
_socketService.default.initialize(server);

// Initialize Signal Protocol
(async () => {
  try {
    await _messageEncryptionService.default.initialize();
    _logger.default.info('Signal Protocol initialized successfully');
  } catch (error) {
    _logger.default.error('Failed to initialize Signal Protocol:', error);
    process.exit(1);
  }
})();

// Connect to MongoDB
_mongoose.default.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  _logger.default.info('Connected to MongoDB');
}).catch(error => {
  _logger.default.error('MongoDB connection error:', error);
  process.exit(1);
});

// Middleware
app.use(_express.default.json());
app.use(_express.default.urlencoded({
  extended: true
}));
app.use((0, _cors.default)({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use((0, _compression.default)());
app.use((0, _helmet.default)());

// Request logging
app.use(_logger.default.requestMiddleware);

// Rate limiting
app.use('/api/auth', _auth.authLimiter);

// Routes
app.use('/api/users', _users.default);
app.use('/api/messages', _messages.default);
app.use('/api/groups', _groups.default);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(_error.notFound);
app.use(_error.errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  _logger.default.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  _logger.default.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  _logger.default.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  _logger.default.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    _logger.default.info('Process terminated');
    _mongoose.default.connection.close(false, () => {
      process.exit(0);
    });
  });
});
var _default = exports.default = server;