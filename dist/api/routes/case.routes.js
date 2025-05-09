"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const case_controller_1 = __importDefault(require("../controllers/case.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Create case
router.post('/', case_controller_1.default.createCase);
// Get all cases
router.get('/', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getAllCases);
// Search cases
router.get('/search', (0, validation_1.validateQuery)(joi_1.default.object({
    searchTerm: joi_1.default.string().required(),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.searchCases);
// Get upcoming hearings
router.get('/upcoming-hearings', (0, validation_1.validateQuery)(joi_1.default.object({
    days: joi_1.default.number().integer().min(1).max(90).default(7),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getUpcomingHearings);
// Get cases by status
router.get('/status/:status', (0, validation_1.validateParams)(joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getCasesByStatus);
// Get cases by court
router.get('/court/:court', (0, validation_1.validateParams)(joi_1.default.object({
    court: joi_1.default.string().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getCasesByCourt);
// Get cases by client
router.get('/client/:clientId', (0, validation_1.validateParams)(joi_1.default.object({
    clientId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getCasesByClient);
// Get cases by assigned user
router.get('/assigned/:userId', (0, validation_1.validateParams)(joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), case_controller_1.default.getCasesByAssignedUser);
// Get case by ID
router.get('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), case_controller_1.default.getCaseById);
// Update case
router.put('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), case_controller_1.default.updateCase);
// Delete case
router.delete('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), case_controller_1.default.deleteCase);
// Add timeline event
router.post('/:id/timeline', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), case_controller_1.default.addTimelineEvent);
// Update case status
router.patch('/:id/status', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').required(),
})), case_controller_1.default.updateCaseStatus);
exports.default = router;
