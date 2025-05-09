"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = __importDefault(require("../controllers/client.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Create client
router.post('/', client_controller_1.default.createClient);
// Get all clients
router.get('/', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), client_controller_1.default.getAllClients);
// Search clients
router.get('/search', (0, validation_1.validateQuery)(joi_1.default.object({
    searchTerm: joi_1.default.string().required(),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), client_controller_1.default.searchClients);
// Get clients by category
router.get('/category/:category', (0, validation_1.validateParams)(joi_1.default.object({
    category: joi_1.default.string().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), client_controller_1.default.getClientsByCategory);
// Get client by ID
router.get('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), client_controller_1.default.getClientById);
// Update client
router.put('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), client_controller_1.default.updateClient);
// Delete client
router.delete('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), client_controller_1.default.deleteClient);
// Verify client KYC
router.post('/:id/verify-kyc', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), client_controller_1.default.verifyClientKYC);
// Update client status
router.patch('/:id/status', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    status: joi_1.default.string().valid('active', 'inactive', 'blocked').required(),
})), client_controller_1.default.updateClientStatus);
// Update client portal access
router.patch('/:id/portal-access', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    enabled: joi_1.default.boolean().required(),
    username: joi_1.default.string().when('enabled', {
        is: true,
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional(),
    }),
    accessLevel: joi_1.default.string().valid('full', 'limited', 'readonly').default('readonly'),
})), client_controller_1.default.updateClientPortalAccess);
exports.default = router;
