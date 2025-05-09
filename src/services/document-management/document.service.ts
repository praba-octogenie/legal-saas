import { Document } from '../../models/document.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, Op } from 'sequelize';
import { User } from '../../models/user.model';
import { Case } from '../../models/case.model';
import { Client } from '../../models/client.model';
import path from 'path';
import fs from 'fs';

export interface CreateDocumentDto {
  name: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  documentType: string;
  description?: string;
  version?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  textContent?: string;
  tenantId: string;
  createdBy: string;
  caseId?: string;
  clientId?: string;
  tags?: string[];
  accessControl?: {
    userId: string;
    permissions: ('read' | 'write' | 'delete' | 'share')[];
  }[];
  metadata?: {
    language?: string;
    court?: string;
    jurisdiction?: string;
    signatories?: string[];
    expiryDate?: Date;
    keywords?: string[];
    customFields?: Record<string, any>;
  };
}

export interface UpdateDocumentDto {
  name?: string;
  description?: string;
  documentType?: string;
  status?: 'active' | 'archived' | 'deleted';
  isTemplate?: boolean;
  isPublic?: boolean;
  caseId?: string;
  clientId?: string;
  tags?: string[];
  accessControl?: {
    userId: string;
    permissions: ('read' | 'write' | 'delete' | 'share')[];
  }[];
  metadata?: {
    language?: string;
    court?: string;
    jurisdiction?: string;
    signatories?: string[];
    expiryDate?: Date;
    keywords?: string[];
    customFields?: Record<string, any>;
  };
}

export interface DocumentVersionDto {
  version: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdBy: string;
  notes?: string;
}

export class DocumentService {
  /**
   * Check if user has access to document
   * @param document Document
   * @param userId User ID
   * @param permission Permission to check
   * @returns True if user has access
   */
  private hasAccess(document: Document, userId: string, permission: 'read' | 'write' | 'delete' | 'share'): boolean {
    // Document creator has all permissions
    if (document.createdBy === userId) {
      return true;
    }
    
    // Check access control list
    const userAccess = document.accessControl.find(access => access.userId === userId);
    if (userAccess && userAccess.permissions.includes(permission)) {
      return true;
    }
    
    return false;
  }

  /**
   * Create a new document
   * @param documentData Document data
   * @param connection Sequelize connection
   * @returns Created document
   */
  async createDocument(documentData: CreateDocumentDto, connection: Sequelize): Promise<Document> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      // Create initial version
      const initialVersion = {
        id: uuidv4(),
        version: documentData.version || '1.0',
        fileName: documentData.fileName,
        filePath: documentData.filePath,
        fileSize: documentData.fileSize,
        createdAt: new Date(),
        createdBy: documentData.createdBy,
      };
      
      // Create initial history event
      const initialHistoryEvent = {
        id: uuidv4(),
        action: 'created' as const,
        timestamp: new Date(),
        userId: documentData.createdBy,
        details: 'Document created',
      };
      
      // Create document
      const document = await DocumentModel.create({
        name: documentData.name,
        fileName: documentData.fileName,
        fileType: documentData.fileType,
        filePath: documentData.filePath,
        fileSize: documentData.fileSize,
        status: 'active',
        documentType: documentData.documentType,
        description: documentData.description,
        version: documentData.version || '1.0',
        isTemplate: documentData.isTemplate || false,
        isPublic: documentData.isPublic || false,
        textContent: documentData.textContent,
        tenantId: documentData.tenantId,
        createdBy: documentData.createdBy,
        caseId: documentData.caseId,
        clientId: documentData.clientId,
        tags: documentData.tags || [],
        versions: [initialVersion],
        accessControl: documentData.accessControl || [],
        metadata: documentData.metadata || {},
        history: [initialHistoryEvent],
      });
      
      logger.info(`Document created: ${document.name} (${document.id})`);
      
      return document;
    } catch (error) {
      logger.error('Error creating document', error);
      throw error;
    }
  }
  
  /**
   * Get document by ID
   * @param documentId Document ID
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Document
   */
  async getDocumentById(documentId: string, userId: string, connection: Sequelize): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      
      const document = await DocumentModel.findByPk(documentId, {
        include: [
          { model: UserModel, as: 'creator' },
          { model: CaseModel, as: 'case' },
          { model: ClientModel, as: 'client' },
        ],
      }) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!document.isPublic && !this.hasAccess(document, userId, 'read')) {
        logger.warn(`Access denied: User ${userId} attempted to access document ${documentId}`);
        return null;
      }
      
      // Add view history
      const historyEvent = {
        id: uuidv4(),
        action: 'viewed' as const,
        timestamp: new Date(),
        userId,
      };
      
      document.history = [...document.history, historyEvent];
      await document.save();
      
      return document;
    } catch (error) {
      logger.error(`Error getting document by ID: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Update document
   * @param documentId Document ID
   * @param updateData Update data
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Updated document
   */
  async updateDocument(documentId: string, updateData: UpdateDocumentDto, userId: string, connection: Sequelize): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'write')) {
        logger.warn(`Access denied: User ${userId} attempted to update document ${documentId}`);
        return null;
      }
      
      // Add update history
      const historyEvent = {
        id: uuidv4(),
        action: 'updated' as const,
        timestamp: new Date(),
        userId,
        details: 'Document metadata updated',
      };
      
      // Update document
      await document.update({
        ...updateData,
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document updated: ${document.name} (${document.id})`);
      
      return document;
    } catch (error) {
      logger.error(`Error updating document: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete document
   * @param documentId Document ID
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns True if document was deleted
   */
  async deleteDocument(documentId: string, userId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return false;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'delete')) {
        logger.warn(`Access denied: User ${userId} attempted to delete document ${documentId}`);
        return false;
      }
      
      // Add delete history
      const historyEvent = {
        id: uuidv4(),
        action: 'deleted' as const,
        timestamp: new Date(),
        userId,
      };
      
      // Soft delete by updating status
      await document.update({
        status: 'deleted',
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document deleted: ${document.name} (${document.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting document: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all documents for a tenant
   * @param tenantId Tenant ID
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Documents
   */
  async getDocumentsByTenantId(
    tenantId: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          tenantId,
          status: { [Op.ne]: 'deleted' },
          [Op.or]: [
            { isPublic: true },
            { createdBy: userId },
            { '$accessControl.userId$': userId },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting documents by tenant ID: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get documents by case ID
   * @param caseId Case ID
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Documents
   */
  async getDocumentsByCaseId(
    caseId: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          caseId,
          status: { [Op.ne]: 'deleted' },
          [Op.or]: [
            { isPublic: true },
            { createdBy: userId },
            { '$accessControl.userId$': userId },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting documents by case ID: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Get documents by client ID
   * @param clientId Client ID
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Documents
   */
  async getDocumentsByClientId(
    clientId: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          clientId,
          status: { [Op.ne]: 'deleted' },
          [Op.or]: [
            { isPublic: true },
            { createdBy: userId },
            { '$accessControl.userId$': userId },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting documents by client ID: ${clientId}`, error);
      throw error;
    }
  }
  
  /**
   * Get documents by type
   * @param tenantId Tenant ID
   * @param documentType Document type
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Documents
   */
  async getDocumentsByType(
    tenantId: string,
    documentType: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          tenantId,
          documentType,
          status: { [Op.ne]: 'deleted' },
          [Op.or]: [
            { isPublic: true },
            { createdBy: userId },
            { '$accessControl.userId$': userId },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting documents by type: ${documentType}`, error);
      throw error;
    }
  }
  
  /**
   * Get template documents
   * @param tenantId Tenant ID
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Template documents
   */
  async getTemplateDocuments(
    tenantId: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          tenantId,
          isTemplate: true,
          status: { [Op.ne]: 'deleted' },
          [Op.or]: [
            { isPublic: true },
            { createdBy: userId },
            { '$accessControl.userId$': userId },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting template documents`, error);
      throw error;
    }
  }
  
  /**
   * Search documents
   * @param tenantId Tenant ID
   * @param searchTerm Search term
   * @param userId User ID (for access control)
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Documents
   */
  async searchDocuments(
    tenantId: string,
    searchTerm: string,
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await DocumentModel.findAndCountAll({
        where: {
          tenantId,
          status: { [Op.ne]: 'deleted' },
          [Op.and]: [
            {
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { description: { [Op.iLike]: `%${searchTerm}%` } },
                { textContent: { [Op.iLike]: `%${searchTerm}%` } },
                { '$tags$': { [Op.contains]: [searchTerm] } },
              ],
            },
            {
              [Op.or]: [
                { isPublic: true },
                { createdBy: userId },
                { '$accessControl.userId$': userId },
              ],
            },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        documents: rows as Document[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error searching documents: ${searchTerm}`, error);
      throw error;
    }
  }
  
  /**
   * Add new version to document
   * @param documentId Document ID
   * @param versionData Version data
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Updated document
   */
  async addDocumentVersion(
    documentId: string,
    versionData: DocumentVersionDto,
    userId: string,
    connection: Sequelize
  ): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'write')) {
        logger.warn(`Access denied: User ${userId} attempted to add version to document ${documentId}`);
        return null;
      }
      
      // Create new version
      const newVersion = {
        id: uuidv4(),
        version: versionData.version,
        fileName: versionData.fileName,
        filePath: versionData.filePath,
        fileSize: versionData.fileSize,
        createdAt: new Date(),
        createdBy: userId,
        notes: versionData.notes,
      };
      
      // Add history event
      const historyEvent = {
        id: uuidv4(),
        action: 'updated' as const,
        timestamp: new Date(),
        userId,
        details: `New version ${versionData.version} added`,
      };
      
      // Update document
      await document.update({
        fileName: versionData.fileName,
        filePath: versionData.filePath,
        fileSize: versionData.fileSize,
        version: versionData.version,
        versions: [...document.versions, newVersion],
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document version added: ${document.name} (${document.id}) - ${versionData.version}`);
      
      return document;
    } catch (error) {
      logger.error(`Error adding document version: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Share document with user
   * @param documentId Document ID
   * @param targetUserId User ID to share with
   * @param permissions Permissions to grant
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Updated document
   */
  async shareDocument(
    documentId: string,
    targetUserId: string,
    permissions: ('read' | 'write' | 'delete' | 'share')[],
    userId: string,
    connection: Sequelize
  ): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'share')) {
        logger.warn(`Access denied: User ${userId} attempted to share document ${documentId}`);
        return null;
      }
      
      // Update access control
      let accessControl = [...document.accessControl];
      const existingAccess = accessControl.findIndex(access => access.userId === targetUserId);
      
      if (existingAccess >= 0) {
        // Update existing access
        accessControl[existingAccess] = {
          ...accessControl[existingAccess],
          permissions,
        };
      } else {
        // Add new access
        accessControl.push({
          userId: targetUserId,
          permissions,
        });
      }
      
      // Add history event
      const historyEvent = {
        id: uuidv4(),
        action: 'shared' as const,
        timestamp: new Date(),
        userId,
        details: `Shared with user ${targetUserId}`,
      };
      
      // Update document
      await document.update({
        accessControl,
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document shared: ${document.name} (${document.id}) with user ${targetUserId}`);
      
      return document;
    } catch (error) {
      logger.error(`Error sharing document: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Archive document
   * @param documentId Document ID
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Updated document
   */
  async archiveDocument(
    documentId: string,
    userId: string,
    connection: Sequelize
  ): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'write')) {
        logger.warn(`Access denied: User ${userId} attempted to archive document ${documentId}`);
        return null;
      }
      
      // Add history event
      const historyEvent = {
        id: uuidv4(),
        action: 'updated' as const,
        timestamp: new Date(),
        userId,
        details: 'Document archived',
      };
      
      // Update document
      await document.update({
        status: 'archived',
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document archived: ${document.name} (${document.id})`);
      
      return document;
    } catch (error) {
      logger.error(`Error archiving document: ${documentId}`, error);
      throw error;
    }
  }
  
  /**
   * Restore document
   * @param documentId Document ID
   * @param userId User ID (for access control and history)
   * @param connection Sequelize connection
   * @returns Updated document
   */
  async restoreDocument(
    documentId: string,
    userId: string,
    connection: Sequelize
  ): Promise<Document | null> {
    try {
      // Set the model to use the tenant connection
      const DocumentModel = connection.model(Document.name) as typeof Document;
      
      const document = await DocumentModel.findByPk(documentId) as Document | null;
      
      if (!document) {
        return null;
      }
      
      // Check access control
      if (!this.hasAccess(document, userId, 'write')) {
        logger.warn(`Access denied: User ${userId} attempted to restore document ${documentId}`);
        return null;
      }
      
      // Add history event
      const historyEvent = {
        id: uuidv4(),
        action: 'updated' as const,
        timestamp: new Date(),
        userId,
        details: 'Document restored',
      };
      
      // Update document
      await document.update({
        status: 'active',
        history: [...document.history, historyEvent],
      });
      
      logger.info(`Document restored: ${document.name} (${document.id})`);
      
      return document;
    } catch (error) {
      logger.error(`Error restoring document: ${documentId}`, error);
      throw error;
    }
  }
}

export default new DocumentService();