"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationController = void 0;
const communication_service_1 = __importDefault(require("../../services/communication/communication.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
// Communication validation schemas
const createMessageSchema = joi_1.default.object({
    content: joi_1.default.string().required(),
    contentType: joi_1.default.string().valid('text', 'html', 'markdown').default('text'),
    messageType: joi_1.default.string().valid('chat', 'email', 'sms', 'notification').default('chat'),
    isSystemMessage: joi_1.default.boolean().default(false),
    attachments: joi_1.default.array().items(joi_1.default.string()).optional(),
    recipientId: joi_1.default.string().uuid().optional(),
    clientId: joi_1.default.string().uuid().optional(),
    caseId: joi_1.default.string().uuid().optional(),
    conversationId: joi_1.default.string().uuid().optional(),
    metadata: joi_1.default.object().optional(),
});
const createConversationSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('direct', 'group', 'case', 'client').required(),
    caseId: joi_1.default.string().uuid().optional(),
    clientId: joi_1.default.string().uuid().optional(),
    participants: joi_1.default.array().items(joi_1.default.string().uuid()).required().min(1),
    metadata: joi_1.default.object().optional(),
});
const createNotificationSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    content: joi_1.default.string().required(),
    type: joi_1.default.string().valid('info', 'success', 'warning', 'error').required(),
    link: joi_1.default.string().uri().optional(),
    action: joi_1.default.string().optional(),
    userId: joi_1.default.string().uuid().required(),
    caseId: joi_1.default.string().uuid().optional(),
    clientId: joi_1.default.string().uuid().optional(),
    metadata: joi_1.default.object().optional(),
});
class CommunicationController {
    /**
     * Create a new message
     * @param req Request
     * @param res Response
     */
    async createMessage(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createMessageSchema, req.body);
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
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Create message
            const message = await communication_service_1.default.createMessage({
                ...value,
                tenantId: req.tenant.id,
                senderId: userId,
            }, req.tenantConnection);
            res.status(201).json(message);
        }
        catch (error) {
            logger_1.logger.error('Error creating message', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get message by ID
     * @param req Request
     * @param res Response
     */
    async getMessageById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get message
            const message = await communication_service_1.default.getMessageById(id, req.tenantConnection);
            if (!message) {
                res.status(404).json({ error: 'Message not found' });
                return;
            }
            res.status(200).json(message);
        }
        catch (error) {
            logger_1.logger.error('Error getting message', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Create a new conversation
     * @param req Request
     * @param res Response
     */
    async createConversation(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createConversationSchema, req.body);
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
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Ensure current user is in participants
            const participants = value.participants;
            if (!participants.includes(userId)) {
                participants.push(userId);
            }
            // Create conversation
            const conversation = await communication_service_1.default.createConversation({
                ...value,
                tenantId: req.tenant.id,
                participants,
            }, req.tenantConnection);
            res.status(201).json(conversation);
        }
        catch (error) {
            logger_1.logger.error('Error creating conversation', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get conversation by ID
     * @param req Request
     * @param res Response
     */
    async getConversationById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Get conversation
            const conversation = await communication_service_1.default.getConversationById(id, req.tenantConnection);
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
        }
        catch (error) {
            logger_1.logger.error('Error getting conversation', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get conversations by user
     * @param req Request
     * @param res Response
     */
    async getConversationsByUser(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Get conversations
            const result = await communication_service_1.default.getConversationsByUserId(userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting conversations', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get messages by conversation
     * @param req Request
     * @param res Response
     */
    async getMessagesByConversation(req, res) {
        try {
            const { conversationId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Get conversation to check access
            const conversation = await communication_service_1.default.getConversationById(conversationId, req.tenantConnection);
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
            const result = await communication_service_1.default.getMessagesByConversationId(conversationId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting messages by conversation', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Create a new notification
     * @param req Request
     * @param res Response
     */
    async createNotification(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createNotificationSchema, req.body);
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
            const notification = await communication_service_1.default.createNotification({
                ...value,
                tenantId: req.tenant.id,
            }, req.tenantConnection);
            res.status(201).json(notification);
        }
        catch (error) {
            logger_1.logger.error('Error creating notification', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get notifications by user
     * @param req Request
     * @param res Response
     */
    async getNotificationsByUser(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Get notifications
            const result = await communication_service_1.default.getNotificationsByUserId(userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting notifications', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Mark notification as read
     * @param req Request
     * @param res Response
     */
    async markNotificationAsRead(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Mark notification as read
            const notification = await communication_service_1.default.markNotificationAsRead(id, req.tenantConnection);
            if (!notification) {
                res.status(404).json({ error: 'Notification not found' });
                return;
            }
            res.status(200).json(notification);
        }
        catch (error) {
            logger_1.logger.error('Error marking notification as read', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Mark all notifications as read
     * @param req Request
     * @param res Response
     */
    async markAllNotificationsAsRead(req, res) {
        try {
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Mark all notifications as read
            const count = await communication_service_1.default.markAllNotificationsAsRead(userId, req.tenantConnection);
            res.status(200).json({ count });
        }
        catch (error) {
            logger_1.logger.error('Error marking all notifications as read', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.CommunicationController = CommunicationController;
exports.default = new CommunicationController();
