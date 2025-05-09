"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const court_proceeding_controller_1 = __importDefault(require("../controllers/court-proceeding.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Create court proceeding
router.post('/', court_proceeding_controller_1.default.createCourtProceeding);
// Get all court proceedings by case
router.get('/case/:caseId', (0, validation_1.validateParams)(joi_1.default.object({
    caseId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), court_proceeding_controller_1.default.getCourtProceedingsByCase);
// Get upcoming court proceedings
router.get('/upcoming', (0, validation_1.validateQuery)(joi_1.default.object({
    days: joi_1.default.number().integer().min(1).max(90).default(7),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), court_proceeding_controller_1.default.getUpcomingCourtProceedings);
// Get court proceedings by status
router.get('/status/:status', (0, validation_1.validateParams)(joi_1.default.object({
    status: joi_1.default.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), court_proceeding_controller_1.default.getCourtProceedingsByStatus);
// Get court proceeding by ID
router.get('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), court_proceeding_controller_1.default.getCourtProceedingById);
// Update court proceeding
router.put('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), court_proceeding_controller_1.default.updateCourtProceeding);
// Delete court proceeding
router.delete('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), court_proceeding_controller_1.default.deleteCourtProceeding);
// Add attendee to court proceeding
router.post('/:id/attendees', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    name: joi_1.default.string().required(),
    role: joi_1.default.string().required(),
    type: joi_1.default.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
    present: joi_1.default.boolean().required(),
    notes: joi_1.default.string().optional(),
})), court_proceeding_controller_1.default.addAttendee);
// Add document to court proceeding
router.post('/:id/documents', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    documentId: joi_1.default.string().uuid().required(),
    name: joi_1.default.string().required(),
    type: joi_1.default.string().required(),
    status: joi_1.default.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
    notes: joi_1.default.string().optional(),
})), court_proceeding_controller_1.default.addDocument);
// Add task to court proceeding
router.post('/:id/tasks', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    dueDate: joi_1.default.date().required(),
    assignedTo: joi_1.default.string().uuid().required(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').required(),
    notes: joi_1.default.string().optional(),
})), court_proceeding_controller_1.default.addTask);
// Update court proceeding status
router.patch('/:id/status', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    status: joi_1.default.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
})), court_proceeding_controller_1.default.updateStatus);
// Add note to court proceeding
router.post('/:id/notes', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    note: joi_1.default.string().required(),
})), court_proceeding_controller_1.default.addNote);
// Set next hearing date
router.patch('/:id/next-hearing', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    nextDate: joi_1.default.date().required(),
})), court_proceeding_controller_1.default.setNextHearingDate);
// Record outcome
router.patch('/:id/outcome', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    outcome: joi_1.default.string().required(),
})), court_proceeding_controller_1.default.recordOutcome);
exports.default = router;
