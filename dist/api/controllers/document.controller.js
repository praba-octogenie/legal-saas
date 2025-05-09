"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_service_1 = __importDefault(require("../../services/document-management/document.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
// Document validation schemas
const createDocumentSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    documentType: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    isTemplate: joi_1.default.boolean().optional(),
    isPublic: joi_1.default.boolean().optional(),
    caseId: joi_1.default.string().uuid().optional(),
    clientId: joi_1.default.string().uuid().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    accessControl: joi_1.default.array().items(joi_1.default.object({
        userId: joi_1.default.string().uuid().required(),
        permissions: joi_1.default.array().items(joi_1.default.string().valid('read', 'write', 'delete', 'share')).required(),
    })).optional(),
    metadata: joi_1.default.object({
        language: joi_1.default.string().optional(),
        court: joi_1.default.string().optional(),
        jurisdiction: joi_1.default.string().optional(),
        signatories: joi_1.default.array().items(joi_1.default.string()).optional(),
        expiryDate: joi_1.default.date().optional(),
        keywords: joi_1.default.array().items(joi_1.default.string()).optional(),
        customFields: joi_1.default.object().optional(),
    }).optional(),
});
const updateDocumentSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    documentType: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    isTemplate: joi_1.default.boolean().optional(),
    isPublic: joi_1.default.boolean().optional(),
    caseId: joi_1.default.string().uuid().optional().allow(null),
    clientId: joi_1.default.string().uuid().optional().allow(null),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    accessControl: joi_1.default.array().items(joi_1.default.object({
        userId: joi_1.default.string().uuid().required(),
        permissions: joi_1.default.array().items(joi_1.default.string().valid('read', 'write', 'delete', 'share')).required(),
    })).optional(),
    metadata: joi_1.default.object({
        language: joi_1.default.string().optional(),
        court: joi_1.default.string().optional(),
        jurisdiction: joi_1.default.string().optional(),
        signatories: joi_1.default.array().items(joi_1.default.string()).optional(),
        expiryDate: joi_1.default.date().optional(),
        keywords: joi_1.default.array().items(joi_1.default.string()).optional(),
        customFields: joi_1.default.object().optional(),
    }).optional(),
});
const shareDocumentSchema = joi_1.default.object({
    targetUserId: joi_1.default.string().uuid().required(),
    permissions: joi_1.default.array().items(joi_1.default.string().valid('read', 'write', 'delete', 'share')).required(),
});
const documentVersionSchema = joi_1.default.object({
    version: joi_1.default.string().required(),
    notes: joi_1.default.string().optional(),
});
class DocumentController {
    /**
     * Upload and create a new document
     * @param req Request
     * @param res Response
     */
    async uploadDocument(req, res) {
        try {
            // Check if file was uploaded
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(createDocumentSchema, req.body);
            if (error) {
                // Remove uploaded file if validation fails
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                // Remove uploaded file if tenant not found
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                // Remove uploaded file if user not found
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Extract file information
            const { originalname, mimetype, path: filePath, size } = req.file;
            const fileExtension = path_1.default.extname(originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
            // Create document
            const document = await document_service_1.default.createDocument({
                name: value.name,
                fileName,
                fileType: mimetype,
                filePath,
                fileSize: size,
                documentType: value.documentType,
                description: value.description,
                isTemplate: value.isTemplate,
                isPublic: value.isPublic,
                tenantId: req.tenant.id,
                createdBy: userId,
                caseId: value.caseId,
                clientId: value.clientId,
                tags: value.tags,
                accessControl: value.accessControl,
                metadata: value.metadata,
            }, req.tenantConnection);
            res.status(201).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error uploading document', error);
            // Remove uploaded file if error occurs
            if (req.file && req.file.path && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get document by ID
     * @param req Request
     * @param res Response
     */
    async getDocumentById(req, res) {
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
            // Get document
            const document = await document_service_1.default.getDocumentById(id, userId, req.tenantConnection);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error getting document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update document
     * @param req Request
     * @param res Response
     */
    async updateDocument(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateDocumentSchema, req.body);
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
            // Update document
            const document = await document_service_1.default.updateDocument(id, value, userId, req.tenantConnection);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error updating document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete document
     * @param req Request
     * @param res Response
     */
    async deleteDocument(req, res) {
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
            // Delete document
            const deleted = await document_service_1.default.deleteDocument(id, userId, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all documents
     * @param req Request
     * @param res Response
     */
    async getAllDocuments(req, res) {
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
            // Get documents
            const result = await document_service_1.default.getDocumentsByTenantId(req.tenant.id, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting documents', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get documents by case
     * @param req Request
     * @param res Response
     */
    async getDocumentsByCase(req, res) {
        try {
            const { caseId } = req.params;
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
            // Get documents
            const result = await document_service_1.default.getDocumentsByCaseId(caseId, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting documents by case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get documents by client
     * @param req Request
     * @param res Response
     */
    async getDocumentsByClient(req, res) {
        try {
            const { clientId } = req.params;
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
            // Get documents
            const result = await document_service_1.default.getDocumentsByClientId(clientId, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting documents by client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get documents by type
     * @param req Request
     * @param res Response
     */
    async getDocumentsByType(req, res) {
        try {
            const { documentType } = req.params;
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
            // Get documents
            const result = await document_service_1.default.getDocumentsByType(req.tenant.id, documentType, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting documents by type', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get template documents
     * @param req Request
     * @param res Response
     */
    async getTemplateDocuments(req, res) {
        try {
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
            // Get template documents
            const result = await document_service_1.default.getTemplateDocuments(req.tenant.id, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting template documents', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Search documents
     * @param req Request
     * @param res Response
     */
    async searchDocuments(req, res) {
        try {
            const { searchTerm } = req.query;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            if (!searchTerm) {
                res.status(400).json({ error: 'Search term is required' });
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
            // Search documents
            const result = await document_service_1.default.searchDocuments(req.tenant.id, searchTerm, userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error searching documents', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Upload new document version
     * @param req Request
     * @param res Response
     */
    async uploadDocumentVersion(req, res) {
        try {
            const { id } = req.params;
            // Check if file was uploaded
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(documentVersionSchema, req.body);
            if (error) {
                // Remove uploaded file if validation fails
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                // Remove uploaded file if tenant not found
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                // Remove uploaded file if user not found
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Extract file information
            const { originalname, path: filePath, size } = req.file;
            const fileExtension = path_1.default.extname(originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
            // Add document version
            const document = await document_service_1.default.addDocumentVersion(id, {
                version: value.version,
                fileName,
                filePath,
                fileSize: size,
                createdBy: userId,
                notes: value.notes,
            }, userId, req.tenantConnection);
            if (!document) {
                // Remove uploaded file if document not found
                if (req.file.path && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error uploading document version', error);
            // Remove uploaded file if error occurs
            if (req.file && req.file.path && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Share document with user
     * @param req Request
     * @param res Response
     */
    async shareDocument(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(shareDocumentSchema, req.body);
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
            // Share document
            const document = await document_service_1.default.shareDocument(id, value.targetUserId, value.permissions, userId, req.tenantConnection);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error sharing document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Archive document
     * @param req Request
     * @param res Response
     */
    async archiveDocument(req, res) {
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
            // Archive document
            const document = await document_service_1.default.archiveDocument(id, userId, req.tenantConnection);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error archiving document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Restore document
     * @param req Request
     * @param res Response
     */
    async restoreDocument(req, res) {
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
            // Restore document
            const document = await document_service_1.default.restoreDocument(id, userId, req.tenantConnection);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            res.status(200).json(document);
        }
        catch (error) {
            logger_1.logger.error('Error restoring document', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.DocumentController = DocumentController;
exports.default = new DocumentController();
