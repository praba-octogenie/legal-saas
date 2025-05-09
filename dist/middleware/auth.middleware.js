"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.authenticateAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const user_service_1 = __importDefault(require("../services/user-management/user.service"));
/**
 * Middleware to authenticate user using JWT
 * @param req Request
 * @param res Response
 * @param next Next function
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
        // Check if token is expired
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        // Get user from database
        const user = await user_service_1.default.getUserById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        // Check if user is active
        if (user.status !== 'active') {
            res.status(403).json({ error: 'User account is not active' });
            return;
        }
        // Set user in request
        req.user = user;
        // Check if user is admin
        req.isAdmin = user.role === 'admin';
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to authenticate admin user
 * @param req Request
 * @param res Response
 * @param next Next function
 */
const authenticateAdmin = async (req, res, next) => {
    try {
        // First authenticate user
        await (0, exports.authenticate)(req, res, () => {
            // Check if user is admin
            if (!req.isAdmin) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }
            next();
        });
    }
    catch (error) {
        logger_1.logger.error('Admin authentication error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateAdmin = authenticateAdmin;
/**
 * Middleware to check user role
 * @param requiredRole Required role
 * @returns Middleware
 */
const requireRole = (requiredRole) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Middleware to check user permission
 * @param requiredPermission Required permission
 * @returns Middleware
 */
const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }
        // Check if user has the required permission
        const hasPermission = req.user.permissions?.includes(requiredPermission);
        if (!hasPermission) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
exports.default = {
    authenticate: exports.authenticate,
    authenticateAdmin: exports.authenticateAdmin,
    requireRole: exports.requireRole,
    requirePermission: exports.requirePermission,
};
