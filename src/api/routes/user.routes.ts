import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validateBody } from '../../utils/validation';
import Joi from 'joi';
import { authenticate, authenticateAdmin, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('manager', 'lawyer', 'paralegal', 'staff', 'user').required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// Public routes
router.post('/register', validateBody(registerSchema), userController.registerUser);
router.post('/login', validateBody(loginSchema), userController.loginUser);
router.post('/refresh-token', userController.refreshToken);

// Protected routes (require authentication)
router.get('/profile', authenticate, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateUserProfile);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), userController.changePassword);

// Admin routes (require admin authentication)
router.get('/', authenticateAdmin, userController.getAllUsers);
router.get('/:id', authenticateAdmin, userController.getUserById);
router.put('/:id', authenticateAdmin, userController.updateUser);
router.delete('/:id', authenticateAdmin, userController.deleteUser);

export default router;