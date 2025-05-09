"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const logger_1 = require("../../utils/logger");
const encryption_1 = require("../../utils/encryption");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
// Temporary in-memory storage for users (for demonstration purposes)
// In a real implementation, this would use a database
const users = [
    {
        id: '1',
        email: 'admin@legalcrm.com',
        password: '$2b$10$X7o4.KM6XRxQ4yyL9Uw9p.xhxCI1W3s4MbL3JGxHXJX5TyWUAE9Vy', // 'admin123'
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        status: 'active',
        permissions: ['*'],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
class UserService {
    /**
     * Create a new user
     * @param userData User data
     * @returns Created user
     */
    async createUser(userData) {
        try {
            // Check if email already exists
            const existingUser = users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error('Email already exists');
            }
            // Hash password
            const hashedPassword = await (0, encryption_1.hashPassword)(userData.password);
            // Create user
            const newUser = {
                id: (0, uuid_1.v4)(),
                email: userData.email,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                status: 'active',
                tenantId: userData.tenantId,
                permissions: userData.permissions || [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Add user to storage
            users.push(newUser);
            // Return user without password
            const { password, ...userWithoutPassword } = newUser;
            logger_1.logger.info(`User created: ${newUser.email} (${newUser.id})`);
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error('Error creating user', error);
            throw error;
        }
    }
    /**
     * Get user by ID
     * @param userId User ID
     * @returns User
     */
    async getUserById(userId) {
        try {
            // Find user
            const user = users.find(user => user.id === userId);
            if (!user) {
                return null;
            }
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error(`Error getting user by ID: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Get user by email
     * @param email User email
     * @returns User
     */
    async getUserByEmail(email) {
        try {
            // Find user
            const user = users.find(user => user.email === email);
            if (!user) {
                return null;
            }
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error(`Error getting user by email: ${email}`, error);
            throw error;
        }
    }
    /**
     * Update user
     * @param userId User ID
     * @param updateData Update data
     * @returns Updated user
     */
    async updateUser(userId, updateData) {
        try {
            // Find user index
            const userIndex = users.findIndex(user => user.id === userId);
            if (userIndex === -1) {
                return null;
            }
            // Update user
            const updatedUser = {
                ...users[userIndex],
                ...updateData,
                updatedAt: new Date(),
            };
            // Update user in storage
            users[userIndex] = updatedUser;
            // Return user without password
            const { password, ...userWithoutPassword } = updatedUser;
            logger_1.logger.info(`User updated: ${updatedUser.email} (${updatedUser.id})`);
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.logger.error(`Error updating user: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Delete user
     * @param userId User ID
     * @returns True if user was deleted
     */
    async deleteUser(userId) {
        try {
            // Find user index
            const userIndex = users.findIndex(user => user.id === userId);
            if (userIndex === -1) {
                return false;
            }
            // Delete user from storage
            users.splice(userIndex, 1);
            logger_1.logger.info(`User deleted: ${userId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting user: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Get all users
     * @param limit Limit
     * @param offset Offset
     * @returns Users
     */
    async getAllUsers(limit = 10, offset = 0) {
        try {
            // Get users
            const paginatedUsers = users.slice(offset, offset + limit);
            // Return users without passwords
            const usersWithoutPasswords = paginatedUsers.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return {
                users: usersWithoutPasswords,
                total: users.length,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting all users', error);
            throw error;
        }
    }
    /**
     * Login user
     * @param loginData Login data
     * @returns Login result
     */
    async login(loginData) {
        try {
            // Find user
            const user = users.find(user => user.email === loginData.email);
            if (!user) {
                throw new Error('Invalid email or password');
            }
            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('User account is not active');
            }
            // Compare password
            const passwordMatch = await (0, encryption_1.comparePassword)(loginData.password, user.password);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }
            // Update last login
            user.lastLogin = new Date();
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            }, process.env.JWT_SECRET || 'default-secret', {
                expiresIn: process.env.JWT_EXPIRATION || '24h',
            });
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            logger_1.logger.info(`User logged in: ${user.email} (${user.id})`);
            return {
                user: userWithoutPassword,
                token,
            };
        }
        catch (error) {
            logger_1.logger.error('Error logging in user', error);
            throw error;
        }
    }
    /**
     * Refresh user token
     * @param refreshToken Refresh token
     * @returns New token
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret');
            if (!decoded.userId) {
                throw new Error('Invalid or expired refresh token');
            }
            // Find user
            const user = users.find(user => user.id === decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('User account is not active');
            }
            // Generate new JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            }, process.env.JWT_SECRET || 'default-secret', {
                expiresIn: process.env.JWT_EXPIRATION || '24h',
            });
            logger_1.logger.info(`Token refreshed for user: ${user.email} (${user.id})`);
            return { token };
        }
        catch (error) {
            logger_1.logger.error('Error refreshing token', error);
            throw new Error('Invalid or expired refresh token');
        }
    }
    /**
     * Change user password
     * @param userId User ID
     * @param currentPassword Current password
     * @param newPassword New password
     * @returns True if password was changed
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Find user index
            const userIndex = users.findIndex(user => user.id === userId);
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            // Compare current password
            const passwordMatch = await (0, encryption_1.comparePassword)(currentPassword, users[userIndex].password);
            if (!passwordMatch) {
                throw new Error('Current password is incorrect');
            }
            // Hash new password
            const hashedPassword = await (0, encryption_1.hashPassword)(newPassword);
            // Update password
            users[userIndex].password = hashedPassword;
            users[userIndex].updatedAt = new Date();
            logger_1.logger.info(`User password changed: ${users[userIndex].email} (${users[userIndex].id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error changing user password: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Get users by tenant ID
     * @param tenantId Tenant ID
     * @param limit Limit
     * @param offset Offset
     * @returns Users
     */
    async getUsersByTenantId(tenantId, limit = 10, offset = 0) {
        try {
            // Filter users by tenant ID
            const tenantUsers = users.filter(user => user.tenantId === tenantId);
            // Paginate users
            const paginatedUsers = tenantUsers.slice(offset, offset + limit);
            // Return users without passwords
            const usersWithoutPasswords = paginatedUsers.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return {
                users: usersWithoutPasswords,
                total: tenantUsers.length,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting users by tenant ID: ${tenantId}`, error);
            throw error;
        }
    }
}
exports.UserService = UserService;
exports.default = new UserService();
