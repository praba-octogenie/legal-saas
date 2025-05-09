import { Router } from 'express';
import documentController from '../controllers/document.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create tenant-specific upload directory if it doesn't exist
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) {
      return cb(new Error('Tenant not found'), '');
    }
    
    const uploadDir = path.join(process.cwd(), 'uploads', tenantId);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    // In production, you might want to restrict to specific file types
    cb(null, true);
  },
});

// Upload document
router.post(
  '/',
  upload.single('file'),
  documentController.uploadDocument
);

// Get all documents
router.get(
  '/',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.getAllDocuments
);

// Search documents
router.get(
  '/search',
  validateQuery(Joi.object({
    searchTerm: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.searchDocuments
);

// Get template documents
router.get(
  '/templates',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.getTemplateDocuments
);

// Get documents by type
router.get(
  '/type/:documentType',
  validateParams(Joi.object({
    documentType: Joi.string().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.getDocumentsByType
);

// Get documents by case
router.get(
  '/case/:caseId',
  validateParams(Joi.object({
    caseId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.getDocumentsByCase
);

// Get documents by client
router.get(
  '/client/:clientId',
  validateParams(Joi.object({
    clientId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  documentController.getDocumentsByClient
);

// Get document by ID
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  documentController.getDocumentById
);

// Update document
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  documentController.updateDocument
);

// Delete document
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  documentController.deleteDocument
);

// Upload new document version
router.post(
  '/:id/versions',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  upload.single('file'),
  documentController.uploadDocumentVersion
);

// Share document with user
router.post(
  '/:id/share',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    targetUserId: Joi.string().uuid().required(),
    permissions: Joi.array().items(
      Joi.string().valid('read', 'write', 'delete', 'share')
    ).required(),
  })),
  documentController.shareDocument
);

// Archive document
router.post(
  '/:id/archive',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  documentController.archiveDocument
);

// Restore document
router.post(
  '/:id/restore',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  documentController.restoreDocument
);

export default router;