import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Protected routes (require authentication)
router.get('/stats', authenticate, dashboardController.getDashboardStats);

export default router;