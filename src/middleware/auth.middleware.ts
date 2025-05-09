import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import userService from '../services/user-management/user.service';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAdmin?: boolean;
    }
  }
}

/**
 * Middleware to authenticate user using JWT
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    // Get user from database
    const user = await userService.getUserById(decoded.userId);
    
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
  } catch (error) {
    logger.error('Authentication error', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to authenticate admin user
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First authenticate user
    await authenticate(req, res, () => {
      // Check if user is admin
      if (!req.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }
      
      next();
    });
  } catch (error) {
    logger.error('Admin authentication error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check user role
 * @param requiredRole Required role
 * @returns Middleware
 */
export const requireRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

/**
 * Middleware to check user permission
 * @param requiredPermission Required permission
 * @returns Middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export default {
  authenticate,
  authenticateAdmin,
  requireRole,
  requirePermission,
};