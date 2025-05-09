import { Request, Response } from 'express';
import communicationService from '../../services/communication/communication.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';

// Communication validation schemas
const createMessageSchema = Joi.object({
  content: Joi.string().required(),
  contentType: Joi.string().valid('text', 'html', 'markdown').default('text'),
  messageType: Joi.string().valid('chat', 'email', 'sms', 'notification').default('chat'),
  isSystemMessage: Joi.boolean().default(false),
  attachments: Joi.array().items(Joi.string()).optional(),
  recipientId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().optional(),
  caseId: Joi.string().uuid().optional(),
  conversationId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional(),
});

const createConversationSchema = Joi.object({
  title: Joi.string().optional(),
  type: Joi.string().valid('direct', 'group', 'case', 'client').required(),
  caseId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().optional(),
  participants: Joi.array().items(Joi.string().uuid()).required().min(1),
  metadata: Joi.object().optional(),
});

const createNotificationSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  type: Joi.string().valid('info', 'success', 'warning', 'error').required(),
  link: Joi.string().uri().optional(),
  action: Joi.string().optional(),
  userId: Joi.string().uuid().required(),
  caseId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().optional(),
  metadata: Joi.object().optional(),
});

export class CommunicationController {
  /**
   * Create a new message
   * @param req Request
   * @param res Response
   */
  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createMessageSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Create message
      const message = await communicationService.createMessage({
        ...(value as any),
        tenantId: req.tenant.id,
        senderId: userId,
      }, req.tenantConnection);
      
      res.status(201).json(message);
    } catch (error) {
      logger.error('Error creating message', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get message by ID
   * @param req Request
   * @param res Response
   */
  async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get message
      const message = await communicationService.getMessageById(id, req.tenantConnection);
      
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.status(200).json(message);
    } catch (error) {
      logger.error('Error getting message', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Create a new conversation
   * @param req Request
   * @param res Response
   */
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createConversationSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Ensure current user is in participants
      const participants = (value as any).participants;
      if (!participants.includes(userId)) {
        participants.push(userId);
      }
      
      // Create conversation
      const conversation = await communicationService.createConversation({
        ...(value as any),
        tenantId: req.tenant.id,
        participants,
      }, req.tenantConnection);
      
      res.status(201).json(conversation);
    } catch (error) {
      logger.error('Error creating conversation', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get conversation by ID
   * @param req Request
   * @param res Response
   */
  async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Get conversation
      const conversation = await communicationService.getConversationById(id, req.tenantConnection);
      
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      // Check if user is a participant
      if (!conversation.participants.includes(userId)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      res.status(200).json(conversation);
    } catch (error) {
      logger.error('Error getting conversation', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get conversations by user
   * @param req Request
   * @param res Response
   */
  async getConversationsByUser(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Get conversations
      const result = await communicationService.getConversationsByUserId(
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting conversations', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get messages by conversation
   * @param req Request
   * @param res Response
   */
  async getMessagesByConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Get conversation to check access
      const conversation = await communicationService.getConversationById(conversationId, req.tenantConnection);
      
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      // Check if user is a participant
      if (!conversation.participants.includes(userId)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      // Get messages
      const result = await communicationService.getMessagesByConversationId(
        conversationId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting messages by conversation', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Create a new notification
   * @param req Request
   * @param res Response
   */
  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createNotificationSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Create notification
      const notification = await communicationService.createNotification({
        ...(value as any),
        tenantId: req.tenant.id,
      }, req.tenantConnection);
      
      res.status(201).json(notification);
    } catch (error) {
      logger.error('Error creating notification', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get notifications by user
   * @param req Request
   * @param res Response
   */
  async getNotificationsByUser(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Get notifications
      const result = await communicationService.getNotificationsByUserId(
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting notifications', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Mark notification as read
   * @param req Request
   * @param res Response
   */
  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Mark notification as read
      const notification = await communicationService.markNotificationAsRead(id, req.tenantConnection);
      
      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }
      
      res.status(200).json(notification);
    } catch (error) {
      logger.error('Error marking notification as read', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Mark all notifications as read
   * @param req Request
   * @param res Response
   */
  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Mark all notifications as read
      const count = await communicationService.markAllNotificationsAsRead(userId, req.tenantConnection);
      
      res.status(200).json({ count });
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CommunicationController();