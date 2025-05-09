"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const communication_model_1 = require("../../models/communication.model");
const logger_1 = require("../../utils/logger");
const sequelize_1 = require("sequelize");
const user_model_1 = require("../../models/user.model");
const client_model_1 = require("../../models/client.model");
const case_model_1 = require("../../models/case.model");
class CommunicationService {
    /**
     * Create a new message
     * @param messageData Message data
     * @param connection Sequelize connection
     * @returns Created message
     */
    async createMessage(messageData, connection) {
        try {
            // Set the model to use the tenant connection
            const MessageModel = connection.model(communication_model_1.Message.name);
            const ConversationModel = connection.model(communication_model_1.Conversation.name);
            // Create message
            const message = await MessageModel.create({
                content: messageData.content,
                contentType: messageData.contentType || 'text',
                messageType: messageData.messageType || 'chat',
                status: 'sent',
                isSystemMessage: messageData.isSystemMessage || false,
                attachments: messageData.attachments,
                tenantId: messageData.tenantId,
                senderId: messageData.senderId,
                recipientId: messageData.recipientId,
                clientId: messageData.clientId,
                caseId: messageData.caseId,
                metadata: messageData.metadata || {},
            });
            // If conversation ID is provided, add message to conversation
            if (messageData.conversationId) {
                const conversation = await ConversationModel.findByPk(messageData.conversationId);
                if (conversation) {
                    await message.update({ conversationId: messageData.conversationId });
                }
            }
            logger_1.logger.info(`Message created: ${message.id}`);
            return message;
        }
        catch (error) {
            logger_1.logger.error('Error creating message', error);
            throw error;
        }
    }
    /**
     * Get message by ID
     * @param messageId Message ID
     * @param connection Sequelize connection
     * @returns Message
     */
    async getMessageById(messageId, connection) {
        try {
            // Set the model to use the tenant connection
            const MessageModel = connection.model(communication_model_1.Message.name);
            const UserModel = connection.model(user_model_1.User.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            return await MessageModel.findByPk(messageId, {
                include: [
                    { model: UserModel, as: 'sender' },
                    { model: UserModel, as: 'recipient' },
                    { model: ClientModel, as: 'client' },
                    { model: CaseModel, as: 'case' },
                ],
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting message by ID: ${messageId}`, error);
            throw error;
        }
    }
    /**
     * Create a new conversation
     * @param conversationData Conversation data
     * @param connection Sequelize connection
     * @returns Created conversation
     */
    async createConversation(conversationData, connection) {
        try {
            // Set the model to use the tenant connection
            const ConversationModel = connection.model(communication_model_1.Conversation.name);
            // Create conversation
            const conversation = await ConversationModel.create({
                title: conversationData.title,
                status: 'active',
                type: conversationData.type,
                tenantId: conversationData.tenantId,
                caseId: conversationData.caseId,
                clientId: conversationData.clientId,
                participants: conversationData.participants,
                metadata: conversationData.metadata || {},
            });
            logger_1.logger.info(`Conversation created: ${conversation.id}`);
            return conversation;
        }
        catch (error) {
            logger_1.logger.error('Error creating conversation', error);
            throw error;
        }
    }
    /**
     * Get conversation by ID
     * @param conversationId Conversation ID
     * @param connection Sequelize connection
     * @returns Conversation
     */
    async getConversationById(conversationId, connection) {
        try {
            // Set the model to use the tenant connection
            const ConversationModel = connection.model(communication_model_1.Conversation.name);
            const MessageModel = connection.model(communication_model_1.Message.name);
            const UserModel = connection.model(user_model_1.User.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            return await ConversationModel.findByPk(conversationId, {
                include: [
                    {
                        model: MessageModel,
                        as: 'messages',
                        include: [
                            { model: UserModel, as: 'sender' },
                        ],
                        order: [['createdAt', 'ASC']],
                    },
                    { model: ClientModel, as: 'client' },
                    { model: CaseModel, as: 'case' },
                ],
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting conversation by ID: ${conversationId}`, error);
            throw error;
        }
    }
    /**
     * Get conversations by user ID
     * @param userId User ID
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Conversations
     */
    async getConversationsByUserId(userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const ConversationModel = connection.model(communication_model_1.Conversation.name);
            const MessageModel = connection.model(communication_model_1.Message.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const { count, rows } = await ConversationModel.findAndCountAll({
                where: {
                    participants: {
                        [sequelize_1.Op.contains]: [userId],
                    },
                    status: {
                        [sequelize_1.Op.ne]: 'deleted',
                    },
                },
                limit,
                offset,
                order: [['updatedAt', 'DESC']],
                include: [
                    {
                        model: MessageModel,
                        as: 'messages',
                        limit: 1,
                        order: [['createdAt', 'DESC']],
                    },
                    { model: ClientModel, as: 'client' },
                    { model: CaseModel, as: 'case' },
                ],
            });
            return {
                conversations: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting conversations by user ID: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Get messages by conversation ID
     * @param conversationId Conversation ID
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Messages
     */
    async getMessagesByConversationId(conversationId, limit = 50, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const MessageModel = connection.model(communication_model_1.Message.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await MessageModel.findAndCountAll({
                where: { conversationId },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: UserModel, as: 'sender' },
                ],
            });
            return {
                messages: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting messages by conversation ID: ${conversationId}`, error);
            throw error;
        }
    }
    /**
     * Create a new notification
     * @param notificationData Notification data
     * @param connection Sequelize connection
     * @returns Created notification
     */
    async createNotification(notificationData, connection) {
        try {
            // Set the model to use the tenant connection
            const NotificationModel = connection.model(communication_model_1.Notification.name);
            // Create notification
            const notification = await NotificationModel.create({
                title: notificationData.title,
                content: notificationData.content,
                type: notificationData.type,
                status: 'unread',
                link: notificationData.link,
                action: notificationData.action,
                tenantId: notificationData.tenantId,
                userId: notificationData.userId,
                caseId: notificationData.caseId,
                clientId: notificationData.clientId,
                metadata: notificationData.metadata || {},
            });
            logger_1.logger.info(`Notification created: ${notification.id}`);
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error creating notification', error);
            throw error;
        }
    }
    /**
     * Get notifications by user ID
     * @param userId User ID
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Notifications
     */
    async getNotificationsByUserId(userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const NotificationModel = connection.model(communication_model_1.Notification.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const { count, rows } = await NotificationModel.findAndCountAll({
                where: { userId },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: CaseModel, as: 'case' },
                    { model: ClientModel, as: 'client' },
                ],
            });
            return {
                notifications: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting notifications by user ID: ${userId}`, error);
            throw error;
        }
    }
    /**
     * Mark notification as read
     * @param notificationId Notification ID
     * @param connection Sequelize connection
     * @returns Updated notification
     */
    async markNotificationAsRead(notificationId, connection) {
        try {
            // Set the model to use the tenant connection
            const NotificationModel = connection.model(communication_model_1.Notification.name);
            const notification = await NotificationModel.findByPk(notificationId);
            if (!notification) {
                return null;
            }
            // Update notification status
            await notification.update({ status: 'read' });
            logger_1.logger.info(`Notification marked as read: ${notification.id}`);
            return notification;
        }
        catch (error) {
            logger_1.logger.error(`Error marking notification as read: ${notificationId}`, error);
            throw error;
        }
    }
    /**
     * Mark all notifications as read for a user
     * @param userId User ID
     * @param connection Sequelize connection
     * @returns Number of notifications updated
     */
    async markAllNotificationsAsRead(userId, connection) {
        try {
            // Set the model to use the tenant connection
            const NotificationModel = connection.model(communication_model_1.Notification.name);
            const [count] = await NotificationModel.update({ status: 'read' }, {
                where: {
                    userId,
                    status: 'unread',
                },
            });
            logger_1.logger.info(`Marked ${count} notifications as read for user: ${userId}`);
            return count;
        }
        catch (error) {
            logger_1.logger.error(`Error marking all notifications as read for user: ${userId}`, error);
            throw error;
        }
    }
}
exports.CommunicationService = CommunicationService;
exports.default = new CommunicationService();
