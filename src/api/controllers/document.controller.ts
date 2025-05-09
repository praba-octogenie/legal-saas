import { Request, Response } from 'express';
import documentService from '../../services/document-management/document.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Document validation schemas
const createDocumentSchema = Joi.object({
  name: Joi.string().required(),
  documentType: Joi.string().required(),
  description: Joi.string().optional(),
  isTemplate: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  caseId: Joi.string().uuid().optional(),
  clientId: Joi.string().uuid().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  accessControl: Joi.array().items(
    Joi.object({
      userId: Joi.string().uuid().required(),
      permissions: Joi.array().items(
        Joi.string().valid('read', 'write', 'delete', 'share')
      ).required(),
    })
  ).optional(),
  metadata: Joi.object({
    language: Joi.string().optional(),
    court: Joi.string().optional(),
    jurisdiction: Joi.string().optional(),
    signatories: Joi.array().items(Joi.string()).optional(),
    expiryDate: Joi.date().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    customFields: Joi.object().optional(),
  }).optional(),
});

const updateDocumentSchema = Joi.object({
  name: Joi.string().optional(),
  documentType: Joi.string().optional(),
  description: Joi.string().optional(),
  isTemplate: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  caseId: Joi.string().uuid().optional().allow(null),
  clientId: Joi.string().uuid().optional().allow(null),
  tags: Joi.array().items(Joi.string()).optional(),
  accessControl: Joi.array().items(
    Joi.object({
      userId: Joi.string().uuid().required(),
      permissions: Joi.array().items(
        Joi.string().valid('read', 'write', 'delete', 'share')
      ).required(),
    })
  ).optional(),
  metadata: Joi.object({
    language: Joi.string().optional(),
    court: Joi.string().optional(),
    jurisdiction: Joi.string().optional(),
    signatories: Joi.array().items(Joi.string()).optional(),
    expiryDate: Joi.date().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    customFields: Joi.object().optional(),
  }).optional(),
});

const shareDocumentSchema = Joi.object({
  targetUserId: Joi.string().uuid().required(),
  permissions: Joi.array().items(
    Joi.string().valid('read', 'write', 'delete', 'share')
  ).required(),
});

const documentVersionSchema = Joi.object({
  version: Joi.string().required(),
  notes: Joi.string().optional(),
});

export class DocumentController {
  /**
   * Upload and create a new document
   * @param req Request
   * @param res Response
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      // Validate request body
      const { error, value } = validateSchema(createDocumentSchema, req.body);
      
      if (error) {
        // Remove uploaded file if validation fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        // Remove uploaded file if tenant not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        // Remove uploaded file if user not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Extract file information
      const { originalname, mimetype, path: filePath, size } = req.file;
      const fileExtension = path.extname(originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Create document
      const document = await documentService.createDocument({
        name: (value as any).name,
        fileName,
        fileType: mimetype,
        filePath,
        fileSize: size,
        documentType: (value as any).documentType,
        description: (value as any).description,
        isTemplate: (value as any).isTemplate,
        isPublic: (value as any).isPublic,
        tenantId: req.tenant.id,
        createdBy: userId,
        caseId: (value as any).caseId,
        clientId: (value as any).clientId,
        tags: (value as any).tags,
        accessControl: (value as any).accessControl,
        metadata: (value as any).metadata,
      }, req.tenantConnection);
      
      res.status(201).json(document);
    } catch (error) {
      logger.error('Error uploading document', error);
      
      // Remove uploaded file if error occurs
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get document by ID
   * @param req Request
   * @param res Response
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
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
      
      // Get document
      const document = await documentService.getDocumentById(id, userId, req.tenantConnection);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error getting document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update document
   * @param req Request
   * @param res Response
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateDocumentSchema, req.body);
      
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
      
      // Update document
      const document = await documentService.updateDocument(id, value as any, userId, req.tenantConnection);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error updating document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete document
   * @param req Request
   * @param res Response
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
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
      
      // Delete document
      const deleted = await documentService.deleteDocument(id, userId, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all documents
   * @param req Request
   * @param res Response
   */
  async getAllDocuments(req: Request, res: Response): Promise<void> {
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
      
      // Get documents
      const result = await documentService.getDocumentsByTenantId(
        req.tenant.id,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting documents', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get documents by case
   * @param req Request
   * @param res Response
   */
  async getDocumentsByCase(req: Request, res: Response): Promise<void> {
    try {
      const { caseId } = req.params;
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
      
      // Get documents
      const result = await documentService.getDocumentsByCaseId(
        caseId,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting documents by case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get documents by client
   * @param req Request
   * @param res Response
   */
  async getDocumentsByClient(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
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
      
      // Get documents
      const result = await documentService.getDocumentsByClientId(
        clientId,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting documents by client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get documents by type
   * @param req Request
   * @param res Response
   */
  async getDocumentsByType(req: Request, res: Response): Promise<void> {
    try {
      const { documentType } = req.params;
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
      
      // Get documents
      const result = await documentService.getDocumentsByType(
        req.tenant.id,
        documentType,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting documents by type', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get template documents
   * @param req Request
   * @param res Response
   */
  async getTemplateDocuments(req: Request, res: Response): Promise<void> {
    try {
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
      
      // Get template documents
      const result = await documentService.getTemplateDocuments(
        req.tenant.id,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting template documents', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Search documents
   * @param req Request
   * @param res Response
   */
  async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
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
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Search documents
      const result = await documentService.searchDocuments(
        req.tenant.id,
        searchTerm as string,
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error searching documents', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Upload new document version
   * @param req Request
   * @param res Response
   */
  async uploadDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      // Validate request body
      const { error, value } = validateSchema(documentVersionSchema, req.body);
      
      if (error) {
        // Remove uploaded file if validation fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        // Remove uploaded file if tenant not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        // Remove uploaded file if user not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Extract file information
      const { originalname, path: filePath, size } = req.file;
      const fileExtension = path.extname(originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Add document version
      const document = await documentService.addDocumentVersion(
        id,
        {
          version: (value as any).version,
          fileName,
          filePath,
          fileSize: size,
          createdBy: userId,
          notes: (value as any).notes,
        },
        userId,
        req.tenantConnection
      );
      
      if (!document) {
        // Remove uploaded file if document not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error uploading document version', error);
      
      // Remove uploaded file if error occurs
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Share document with user
   * @param req Request
   * @param res Response
   */
  async shareDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(shareDocumentSchema, req.body);
      
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
      
      // Share document
      const document = await documentService.shareDocument(
        id,
        (value as any).targetUserId,
        (value as any).permissions,
        userId,
        req.tenantConnection
      );
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error sharing document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Archive document
   * @param req Request
   * @param res Response
   */
  async archiveDocument(req: Request, res: Response): Promise<void> {
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
      
      // Archive document
      const document = await documentService.archiveDocument(
        id,
        userId,
        req.tenantConnection
      );
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error archiving document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Restore document
   * @param req Request
   * @param res Response
   */
  async restoreDocument(req: Request, res: Response): Promise<void> {
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
      
      // Restore document
      const document = await documentService.restoreDocument(
        id,
        userId,
        req.tenantConnection
      );
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.status(200).json(document);
    } catch (error) {
      logger.error('Error restoring document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new DocumentController();