import { Message, Conversation, Notification } from '../../models/communication.model';
import { logger } from '../../utils/logger';
import { Sequelize, Op } from 'sequelize';
import { User } from '../../models/user.model';
import { Client } from '../../models/client.model';
import { Case } from '../../models/case.model';

export interface CreateMessageDto {
  content: string;
  contentType?: 'text' | 'html' | 'markdown';
  messageType?: 'chat' | 'email' | 'sms' | 'notification';
  isSystemMessage?: boolean;
  attachments?: string[];
  tenantId: string;
  senderId: string;
  recipientId?: string;
  clientId?: string;
  caseId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface CreateConversationDto {
  title?: string;
  type: 'direct' | 'group' | 'case' | 'client';
  tenantId: string;
  caseId?: string;
  clientId?: string;
  participants: string[];
  metadata?: Record<string, any>;
}

export interface CreateNotificationDto {
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  action?: string;
  tenantId: string;
  userId: string;
  caseId?: string;
  clientId?: string;
  metadata?: Record<string, any>;
}

export class CommunicationService {
  /**
   * Create a new message
   * @param messageData Message data
   * @param connection Sequelize connection
   * @returns Created message
   */
  async createMessage(messageData: CreateMessageDto, connection: Sequelize): Promise<Message> {
    try {
      // Set the model to use the tenant connection
      const MessageModel = connection.model(Message.name) as typeof Message;
      const ConversationModel = connection.model(Conversation.name) as typeof Conversation;
      
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
      
      logger.info(`Message created: ${message.id}`);
      
      return message;
    } catch (error) {
      logger.error('Error creating message', error);
      throw error;
    }
  }
  
  /**
   * Get message by ID
   * @param messageId Message ID
   * @param connection Sequelize connection
   * @returns Message
   */
  async getMessageById(messageId: string, connection: Sequelize): Promise<Message | null> {
    try {
      // Set the model to use the tenant connection
      const MessageModel = connection.model(Message.name) as typeof Message;
      const UserModel = connection.model(User.name) as typeof User;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      return await MessageModel.findByPk(messageId, {
        include: [
          { model: UserModel, as: 'sender' },
          { model: UserModel, as: 'recipient' },
          { model: ClientModel, as: 'client' },
          { model: CaseModel, as: 'case' },
        ],
      }) as Message | null;
    } catch (error) {
      logger.error(`Error getting message by ID: ${messageId}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new conversation
   * @param conversationData Conversation data
   * @param connection Sequelize connection
   * @returns Created conversation
   */
  async createConversation(conversationData: CreateConversationDto, connection: Sequelize): Promise<Conversation> {
    try {
      // Set the model to use the tenant connection
      const ConversationModel = connection.model(Conversation.name) as typeof Conversation;
      
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
      
      logger.info(`Conversation created: ${conversation.id}`);
      
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation', error);
      throw error;
    }
  }
  
  /**
   * Get conversation by ID
   * @param conversationId Conversation ID
   * @param connection Sequelize connection
   * @returns Conversation
   */
  async getConversationById(conversationId: string, connection: Sequelize): Promise<Conversation | null> {
    try {
      // Set the model to use the tenant connection
      const ConversationModel = connection.model(Conversation.name) as typeof Conversation;
      const MessageModel = connection.model(Message.name) as typeof Message;
      const UserModel = connection.model(User.name) as typeof User;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const CaseModel = connection.model(Case.name) as typeof Case;
      
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
      }) as Conversation | null;
    } catch (error) {
      logger.error(`Error getting conversation by ID: ${conversationId}`, error);
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
  async getConversationsByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ conversations: Conversation[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const ConversationModel = connection.model(Conversation.name) as typeof Conversation;
      const MessageModel = connection.model(Message.name) as typeof Message;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      const { count, rows } = await ConversationModel.findAndCountAll({
        where: {
          participants: {
            [Op.contains]: [userId],
          },
          status: {
            [Op.ne]: 'deleted',
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
        conversations: rows as Conversation[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting conversations by user ID: ${userId}`, error);
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
  async getMessagesByConversationId(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const MessageModel = connection.model(Message.name) as typeof Message;
      const UserModel = connection.model(User.name) as typeof User;
      
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
        messages: rows as Message[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting messages by conversation ID: ${conversationId}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new notification
   * @param notificationData Notification data
   * @param connection Sequelize connection
   * @returns Created notification
   */
  async createNotification(notificationData: CreateNotificationDto, connection: Sequelize): Promise<Notification> {
    try {
      // Set the model to use the tenant connection
      const NotificationModel = connection.model(Notification.name) as typeof Notification;
      
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
      
      logger.info(`Notification created: ${notification.id}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification', error);
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
  async getNotificationsByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const NotificationModel = connection.model(Notification.name) as typeof Notification;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      
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
        notifications: rows as Notification[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting notifications by user ID: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Mark notification as read
   * @param notificationId Notification ID
   * @param connection Sequelize connection
   * @returns Updated notification
   */
  async markNotificationAsRead(notificationId: string, connection: Sequelize): Promise<Notification | null> {
    try {
      // Set the model to use the tenant connection
      const NotificationModel = connection.model(Notification.name) as typeof Notification;
      
      const notification = await NotificationModel.findByPk(notificationId) as Notification | null;
      
      if (!notification) {
        return null;
      }
      
      // Update notification status
      await notification.update({ status: 'read' });
      
      logger.info(`Notification marked as read: ${notification.id}`);
      
      return notification;
    } catch (error) {
      logger.error(`Error marking notification as read: ${notificationId}`, error);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @param connection Sequelize connection
   * @returns Number of notifications updated
   */
  async markAllNotificationsAsRead(userId: string, connection: Sequelize): Promise<number> {
    try {
      // Set the model to use the tenant connection
      const NotificationModel = connection.model(Notification.name) as typeof Notification;
      
      const [count] = await NotificationModel.update(
        { status: 'read' },
        {
          where: {
            userId,
            status: 'unread',
          },
        }
      );
      
      logger.info(`Marked ${count} notifications as read for user: ${userId}`);
      
      return count;
    } catch (error) {
      logger.error(`Error marking all notifications as read for user: ${userId}`, error);
      throw error;
    }
  }
}

export default new CommunicationService();