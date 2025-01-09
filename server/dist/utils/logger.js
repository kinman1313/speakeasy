"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _winston = _interopRequireDefault(require("winston"));
var _path = _interopRequireDefault(require("path"));
const logger = _winston.default.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: _winston.default.format.combine(_winston.default.format.timestamp(), _winston.default.format.json()),
  transports: [new _winston.default.transports.Console({
    format: _winston.default.format.combine(_winston.default.format.colorize(), _winston.default.format.simple())
  })]
});

// Add request logging middleware
const requestMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
};
logger.requestMiddleware = requestMiddleware;
var _default = exports.default = logger;