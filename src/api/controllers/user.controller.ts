import { Request, Response } from 'express';
import userService, { CreateUserDto, UpdateUserDto, LoginDto } from '../../services/user-management/user.service';
import { logger } from '../../utils/logger';
import { validateSchema } from '../../utils/validation';
import Joi from 'joi';

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('admin', 'manager', 'lawyer', 'paralegal', 'staff', 'user').required(),
  tenantId: Joi.string().uuid().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  role: Joi.string().valid('admin', 'manager', 'lawyer', 'paralegal', 'staff', 'user').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
}).min(1);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export class UserController {
  /**
   * Register a new user
   * @param req Request
   * @param res Response
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSchema<CreateUserDto>(createUserSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // If tenant-specific request, set tenant ID from request
      if (req.tenant && !value.tenantId) {
        value.tenantId = req.tenant.id;
      }
      
      // Create user
      const user = await userService.createUser(value);
      
      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error: any) {
      logger.error('Error in registerUser controller', error);
      
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
  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSchema<LoginDto>(loginSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Login user
      const result = await userService.login(value);
      
      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      logger.error('Error in loginUser controller', error);
      
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
  async refreshToken(req: Request, res: Response): Promise<void> {
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
      const result = await userService.refreshToken(refreshToken);
      
      res.status(200).json({
        message: 'Token refreshed successfully',
        token: result.token,
      });
    } catch (error: any) {
      logger.error('Error in refreshToken controller', error);
      
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
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      // User is set in request by authentication middleware
      res.status(200).json({
        user: req.user,
      });
    } catch (error) {
      logger.error('Error in getUserProfile controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update user profile
   * @param req Request
   * @param res Response
   */
  async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSchema<UpdateUserDto>(updateUserSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Update user
      const user = await userService.updateUser(req.user.id, value);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(200).json({
        message: 'User profile updated successfully',
        user,
      });
    } catch (error) {
      logger.error('Error in updateUserProfile controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Change user password
   * @param req Request
   * @param res Response
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSchema<{ currentPassword: string; newPassword: string }>(changePasswordSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Change password
      const success = await userService.changePassword(
        req.user.id,
        value.currentPassword,
        value.newPassword
      );
      
      if (!success) {
        res.status(400).json({ error: 'Failed to change password' });
        return;
      }
      
      res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Error in changePassword controller', error);
      
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
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      // Get user
      const user = await userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(200).json({ user });
    } catch (error) {
      logger.error('Error in getUserById controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all users (admin only)
   * @param req Request
   * @param res Response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '10', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      
      // Get users
      const { users, total } = await userService.getAllUsers(limit, offset);
      
      res.status(200).json({
        users,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error in getAllUsers controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update user (admin only)
   * @param req Request
   * @param res Response
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      // Validate request body
      const { error, value } = validateSchema<UpdateUserDto>(updateUserSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Update user
      const user = await userService.updateUser(userId, value);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(200).json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      logger.error('Error in updateUser controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete user (admin only)
   * @param req Request
   * @param res Response
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      
      // Delete user
      const deleted = await userService.deleteUser(userId);
      
      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteUser controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new UserController();