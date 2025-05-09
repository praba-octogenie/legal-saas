"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const document_model_1 = require("../../models/document.model");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const user_model_1 = require("../../models/user.model");
const case_model_1 = require("../../models/case.model");
const client_model_1 = require("../../models/client.model");
class DocumentService {
    /**
     * Check if user has access to document
     * @param document Document
     * @param userId User ID
     * @param permission Permission to check
     * @returns True if user has access
     */
    hasAccess(document, userId, permission) {
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
    async createDocument(documentData, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            // Create initial version
            const initialVersion = {
                id: (0, uuid_1.v4)(),
                version: documentData.version || '1.0',
                fileName: documentData.fileName,
                filePath: documentData.filePath,
                fileSize: documentData.fileSize,
                createdAt: new Date(),
                createdBy: documentData.createdBy,
            };
            // Create initial history event
            const initialHistoryEvent = {
                id: (0, uuid_1.v4)(),
                action: 'created',
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
            logger_1.logger.info(`Document created: ${document.name} (${document.id})`);
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error creating document', error);
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
    async getDocumentById(documentId, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const document = await DocumentModel.findByPk(documentId, {
                include: [
                    { model: UserModel, as: 'creator' },
                    { model: CaseModel, as: 'case' },
                    { model: ClientModel, as: 'client' },
                ],
            });
            if (!document) {
                return null;
            }
            // Check access control
            if (!document.isPublic && !this.hasAccess(document, userId, 'read')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to access document ${documentId}`);
                return null;
            }
            // Add view history
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'viewed',
                timestamp: new Date(),
                userId,
            };
            document.history = [...document.history, historyEvent];
            await document.save();
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error getting document by ID: ${documentId}`, error);
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
    async updateDocument(documentId, updateData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return null;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'write')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to update document ${documentId}`);
                return null;
            }
            // Add update history
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'updated',
                timestamp: new Date(),
                userId,
                details: 'Document metadata updated',
            };
            // Update document
            await document.update({
                ...updateData,
                history: [...document.history, historyEvent],
            });
            logger_1.logger.info(`Document updated: ${document.name} (${document.id})`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error updating document: ${documentId}`, error);
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
    async deleteDocument(documentId, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return false;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'delete')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to delete document ${documentId}`);
                return false;
            }
            // Add delete history
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'deleted',
                timestamp: new Date(),
                userId,
            };
            // Soft delete by updating status
            await document.update({
                status: 'deleted',
                history: [...document.history, historyEvent],
            });
            logger_1.logger.info(`Document deleted: ${document.name} (${document.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting document: ${documentId}`, error);
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
    async getDocumentsByTenantId(tenantId, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    tenantId,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting documents by tenant ID: ${tenantId}`, error);
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
    async getDocumentsByCaseId(caseId, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    caseId,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting documents by case ID: ${caseId}`, error);
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
    async getDocumentsByClientId(clientId, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    clientId,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting documents by client ID: ${clientId}`, error);
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
    async getDocumentsByType(tenantId, documentType, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    tenantId,
                    documentType,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting documents by type: ${documentType}`, error);
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
    async getTemplateDocuments(tenantId, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    tenantId,
                    isTemplate: true,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting template documents`, error);
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
    async searchDocuments(tenantId, searchTerm, userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await DocumentModel.findAndCountAll({
                where: {
                    tenantId,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                    [sequelize_1.Op.and]: [
                        {
                            [sequelize_1.Op.or]: [
                                { name: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                                { description: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                                { textContent: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                                { '$tags$': { [sequelize_1.Op.contains]: [searchTerm] } },
                            ],
                        },
                        {
                            [sequelize_1.Op.or]: [
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
                documents: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error searching documents: ${searchTerm}`, error);
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
    async addDocumentVersion(documentId, versionData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return null;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'write')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to add version to document ${documentId}`);
                return null;
            }
            // Create new version
            const newVersion = {
                id: (0, uuid_1.v4)(),
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
                id: (0, uuid_1.v4)(),
                action: 'updated',
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
            logger_1.logger.info(`Document version added: ${document.name} (${document.id}) - ${versionData.version}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error adding document version: ${documentId}`, error);
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
    async shareDocument(documentId, targetUserId, permissions, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return null;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'share')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to share document ${documentId}`);
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
            }
            else {
                // Add new access
                accessControl.push({
                    userId: targetUserId,
                    permissions,
                });
            }
            // Add history event
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'shared',
                timestamp: new Date(),
                userId,
                details: `Shared with user ${targetUserId}`,
            };
            // Update document
            await document.update({
                accessControl,
                history: [...document.history, historyEvent],
            });
            logger_1.logger.info(`Document shared: ${document.name} (${document.id}) with user ${targetUserId}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error sharing document: ${documentId}`, error);
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
    async archiveDocument(documentId, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return null;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'write')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to archive document ${documentId}`);
                return null;
            }
            // Add history event
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'updated',
                timestamp: new Date(),
                userId,
                details: 'Document archived',
            };
            // Update document
            await document.update({
                status: 'archived',
                history: [...document.history, historyEvent],
            });
            logger_1.logger.info(`Document archived: ${document.name} (${document.id})`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error archiving document: ${documentId}`, error);
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
    async restoreDocument(documentId, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const DocumentModel = connection.model(document_model_1.Document.name);
            const document = await DocumentModel.findByPk(documentId);
            if (!document) {
                return null;
            }
            // Check access control
            if (!this.hasAccess(document, userId, 'write')) {
                logger_1.logger.warn(`Access denied: User ${userId} attempted to restore document ${documentId}`);
                return null;
            }
            // Add history event
            const historyEvent = {
                id: (0, uuid_1.v4)(),
                action: 'updated',
                timestamp: new Date(),
                userId,
                details: 'Document restored',
            };
            // Update document
            await document.update({
                status: 'active',
                history: [...document.history, historyEvent],
            });
            logger_1.logger.info(`Document restored: ${document.name} (${document.id})`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error restoring document: ${documentId}`, error);
            throw error;
        }
    }
}
exports.DocumentService = DocumentService;
exports.default = new DocumentService();
