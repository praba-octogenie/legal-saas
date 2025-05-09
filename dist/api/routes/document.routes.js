"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = __importDefault(require("../controllers/document.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Create tenant-specific upload directory if it doesn't exist
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return cb(new Error('Tenant not found'), '');
        }
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', tenantId);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueFilename = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    },
});
const upload = (0, multer_1.default)({
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
router.post('/', upload.single('file'), document_controller_1.default.uploadDocument);
// Get all documents
router.get('/', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.getAllDocuments);
// Search documents
router.get('/search', (0, validation_1.validateQuery)(joi_1.default.object({
    searchTerm: joi_1.default.string().required(),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.searchDocuments);
// Get template documents
router.get('/templates', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.getTemplateDocuments);
// Get documents by type
router.get('/type/:documentType', (0, validation_1.validateParams)(joi_1.default.object({
    documentType: joi_1.default.string().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.getDocumentsByType);
// Get documents by case
router.get('/case/:caseId', (0, validation_1.validateParams)(joi_1.default.object({
    caseId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.getDocumentsByCase);
// Get documents by client
router.get('/client/:clientId', (0, validation_1.validateParams)(joi_1.default.object({
    clientId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), document_controller_1.default.getDocumentsByClient);
// Get document by ID
router.get('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), document_controller_1.default.getDocumentById);
// Update document
router.put('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), document_controller_1.default.updateDocument);
// Delete document
router.delete('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), document_controller_1.default.deleteDocument);
// Upload new document version
router.post('/:id/versions', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), upload.single('file'), document_controller_1.default.uploadDocumentVersion);
// Share document with user
router.post('/:id/share', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    targetUserId: joi_1.default.string().uuid().required(),
    permissions: joi_1.default.array().items(joi_1.default.string().valid('read', 'write', 'delete', 'share')).required(),
})), document_controller_1.default.shareDocument);
// Archive document
router.post('/:id/archive', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), document_controller_1.default.archiveDocument);
// Restore document
router.post('/:id/restore', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), document_controller_1.default.restoreDocument);
exports.default = router;
