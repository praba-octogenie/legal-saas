"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure log directory exists
const logDir = 'logs';
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || path_1.default.join(logDir, 'app.log');
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'legal-crm' },
    transports: [
        // Write logs to console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
        }),
        // Write logs to file
        new winston_1.default.transports.File({
            filename: logFile,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write error logs to separate file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// Add request logger middleware for Express
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
        if (res.statusCode >= 500) {
            exports.logger.error(message);
        }
        else if (res.statusCode >= 400) {
            exports.logger.warn(message);
        }
        else {
            exports.logger.info(message);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
exports.default = {
    logger: exports.logger,
    requestLogger: exports.requestLogger,
};
