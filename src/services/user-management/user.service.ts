import { logger } from '../../utils/logger';
import { hashPassword, comparePassword } from '../../utils/encryption';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/user.model';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  permissions?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

// Now using the actual User model from the database

export class UserService {
  /**
   * Create a new user
   * @param userData User data
   * @returns Created user
   */
  async createUser(userData: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        throw new Error('Email already exists');
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const newUser = await User.create({
        id: uuidv4(),
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: 'active',
        tenantId: userData.tenantId,
        permissions: userData.permissions || [],
      });
      
      // Return user without password
      const userJson = newUser.toJSON();
      delete userJson.password;
      
      logger.info(`User created: ${newUser.email} (${newUser.id})`);
      
      return userJson;
    } catch (error) {
      logger.error('Error creating user', error);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param userId User ID
   * @returns User
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }
      
      // Return user without password
      const userJson = user.toJSON();
      delete userJson.password;
      
      return userJson;
    } catch (error) {
      logger.error(`Error getting user by ID: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Get user by email
   * @param email User email
   * @returns User
   */
  async getUserByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    try {
      // Find user
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return null;
      }
      
      // Return user without password
      const userJson = user.toJSON();
      delete userJson.password;
      
      return userJson;
    } catch (error) {
      logger.error(`Error getting user by email: ${email}`, error);
      throw error;
    }
  }
  
  /**
   * Update user
   * @param userId User ID
   * @param updateData Update data
   * @returns Updated user
   */
  async updateUser(userId: string, updateData: UpdateUserDto): Promise<Omit<User, 'password'> | null> {
    try {
      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        return null;
      }
      
      // Update user
      await user.update(updateData);
      
      // Reload user to get updated data
      await user.reload();
      
      // Return user without password
      const userJson = user.toJSON();
      delete userJson.password;
      
      logger.info(`User updated: ${user.email} (${user.id})`);
      
      return userJson;
    } catch (error) {
      logger.error(`Error updating user: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete user
   * @param userId User ID
   * @returns True if user was deleted
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        return false;
      }
      
      // Delete user
      await user.destroy();
      
      logger.info(`User deleted: ${userId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting user: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all users
   * @param limit Limit
   * @param offset Offset
   * @returns Users
   */
  async getAllUsers(limit: number = 10, offset: number = 0): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    try {
      // Get users
      const { count, rows } = await User.findAndCountAll({
        limit,
        offset,
        attributes: { exclude: ['password'] }
      });
      
      return {
        users: rows,
        total: count,
      };
    } catch (error) {
      logger.error('Error getting all users', error);
      throw error;
    }
  }
  
  /**
   * Login user
   * @param loginData Login data
   * @returns Login result
   */
  async login(loginData: LoginDto): Promise<{ user: Omit<User, 'password'>; token: string }> {
    try {
      // Find user
      const user = await User.findOne({ where: { email: loginData.email } });
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }
      
      // Compare password
      const passwordMatch = await comparePassword(loginData.password, user.password);
      
      if (!passwordMatch) {
        throw new Error('Invalid email or password');
      }
      
      // Update last login
      await user.update({ lastLogin: new Date() });
      
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        process.env.JWT_SECRET || 'default-secret',
        {
          expiresIn: process.env.JWT_EXPIRATION || '24h',
        } as jwt.SignOptions
      );
      
      // Return user without password
      const userJson = user.toJSON();
      delete userJson.password;
      
      logger.info(`User logged in: ${user.email} (${user.id})`);
      
      return {
        user: userJson,
        token,
      };
    } catch (error) {
      logger.error('Error logging in user', error);
      throw error;
    }
  }
  
  /**
   * Refresh user token
   * @param refreshToken Refresh token
   * @returns New token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret'
      ) as jwt.JwtPayload;
      
      if (!decoded.userId) {
        throw new Error('Invalid or expired refresh token');
      }
      
      // Find user
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }
      
      // Generate new JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        process.env.JWT_SECRET || 'default-secret',
        {
          expiresIn: process.env.JWT_EXPIRATION || '24h',
        } as jwt.SignOptions
      );
      
      logger.info(`Token refreshed for user: ${user.email} (${user.id})`);
      
      return { token };
    } catch (error) {
      logger.error('Error refreshing token', error);
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
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Compare current password
      const passwordMatch = await comparePassword(currentPassword, user.password);
      
      if (!passwordMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await user.update({
        password: hashedPassword
      });
      
      logger.info(`User password changed: ${user.email} (${user.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error changing user password: ${userId}`, error);
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
  async getUsersByTenantId(tenantId: string, limit: number = 10, offset: number = 0): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    try {
      // Get users by tenant ID
      const { count, rows } = await User.findAndCountAll({
        where: { tenantId },
        limit,
        offset,
        attributes: { exclude: ['password'] }
      });
      
      return {
        users: rows,
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting users by tenant ID: ${tenantId}`, error);
      throw error;
    }
  }
}

export default new UserService();