import { Router } from 'express';
import communicationController from '../controllers/communication.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Message routes
router.post(
  '/messages',
  communicationController.createMessage
);

router.get(
  '/messages/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  communicationController.getMessageById
);

router.get(
  '/conversations/:conversationId/messages',
  validateParams(Joi.object({
    conversationId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
  })),
  communicationController.getMessagesByConversation
);

// Conversation routes
router.post(
  '/conversations',
  communicationController.createConversation
);

router.get(
  '/conversations',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  communicationController.getConversationsByUser
);

router.get(
  '/conversations/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  communicationController.getConversationById
);

// Notification routes
router.post(
  '/notifications',
  communicationController.createNotification
);

router.get(
  '/notifications',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  communicationController.getNotificationsByUser
);

router.patch(
  '/notifications/:id/read',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  communicationController.markNotificationAsRead
);

router.patch(
  '/notifications/read-all',
  communicationController.markAllNotificationsAsRead
);

export default router;