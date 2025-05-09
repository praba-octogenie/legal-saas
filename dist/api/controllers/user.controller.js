"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = __importDefault(require("../../services/user-management/user.service"));
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
// Validation schemas
const createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    role: joi_1.default.string().valid('admin', 'manager', 'lawyer', 'paralegal', 'staff', 'user').required(),
    tenantId: joi_1.default.string().uuid().optional(),
    permissions: joi_1.default.array().items(joi_1.default.string()).optional(),
});
const updateUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().optional(),
    firstName: joi_1.default.string().optional(),
    lastName: joi_1.default.string().optional(),
    role: joi_1.default.string().valid('admin', 'manager', 'lawyer', 'paralegal', 'staff', 'user').optional(),
    status: joi_1.default.string().valid('active', 'inactive', 'suspended').optional(),
    permissions: joi_1.default.array().items(joi_1.default.string()).optional(),
}).min(1);
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
const changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(8).required(),
});
class UserController {
    /**
     * Register a new user
     * @param req Request
     * @param res Response
     */
    async registerUser(req, res) {
        try {
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(createUserSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // If tenant-specific request, set tenant ID from request
            if (req.tenant && !value.tenantId) {
                value.tenantId = req.tenant.id;
            }
            // Create user
            const user = await user_service_1.default.createUser(value);
            res.status(201).json({
                message: 'User registered successfully',
                user,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in registerUser controller', error);
            if (error.message === 'Email already exists') {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Login user
     * @param req Request
     * @param res Response
     */
    async loginUser(req, res) {
        try {
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(loginSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Login user
            const result = await user_service_1.default.login(value);
            res.status(200).json({
                message: 'Login successful',
                user: result.user,
                token: result.token,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in loginUser controller', error);
            if (error.message === 'Invalid email or password' || error.message === 'User account is not active') {
                res.status(401).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Refresh user token
     * @param req Request
     * @param res Response
     */
    async refreshToken(req, res) {
        try {
            // Check for refresh token in cookies or authorization header
            const refreshToken = req.cookies?.refreshToken ||
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
                    ? req.headers.authorization.split(' ')[1]
                    : null);
            if (!refreshToken) {
                res.status(401).json({ error: 'Refresh token is required' });
                return;
            }
            // Verify and generate new token
            const result = await user_service_1.default.refreshToken(refreshToken);
            res.status(200).json({
                message: 'Token refreshed successfully',
                token: result.token,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in refreshToken controller', error);
            if (error.message === 'Invalid or expired refresh token') {
                res.status(401).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get user profile
     * @param req Request
     * @param res Response
     */
    async getUserProfile(req, res) {
        try {
            // User is set in request by authentication middleware
            res.status(200).json({
                user: req.user,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getUserProfile controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update user profile
     * @param req Request
     * @param res Response
     */
    async updateUserProfile(req, res) {
        try {
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(updateUserSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Update user
            const user = await user_service_1.default.updateUser(req.user.id, value);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({
                message: 'User profile updated successfully',
                user,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in updateUserProfile controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Change user password
     * @param req Request
     * @param res Response
     */
    async changePassword(req, res) {
        try {
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(changePasswordSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Change password
            const success = await user_service_1.default.changePassword(req.user.id, value.currentPassword, value.newPassword);
            if (!success) {
                res.status(400).json({ error: 'Failed to change password' });
                return;
            }
            res.status(200).json({
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in changePassword controller', error);
            if (error.message === 'Current password is incorrect') {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get user by ID (admin only)
     * @param req Request
     * @param res Response
     */
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            // Get user
            const user = await user_service_1.default.getUserById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({ user });
        }
        catch (error) {
            logger_1.logger.error('Error in getUserById controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all users (admin only)
     * @param req Request
     * @param res Response
     */
    async getAllUsers(req, res) {
        try {
            const limit = parseInt(req.query.limit || '10', 10);
            const offset = parseInt(req.query.offset || '0', 10);
            // Get users
            const { users, total } = await user_service_1.default.getAllUsers(limit, offset);
            res.status(200).json({
                users,
                pagination: {
                    total,
                    limit,
                    offset,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAllUsers controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update user (admin only)
     * @param req Request
     * @param res Response
     */
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(updateUserSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Update user
            const user = await user_service_1.default.updateUser(userId, value);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({
                message: 'User updated successfully',
                user,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in updateUser controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete user (admin only)
     * @param req Request
     * @param res Response
     */
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            // Delete user
            const deleted = await user_service_1.default.deleteUser(userId);
            if (!deleted) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.status(200).json({
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in deleteUser controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
exports.default = new UserController();
