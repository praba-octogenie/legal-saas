"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtProceedingController = void 0;
const court_proceeding_service_1 = __importDefault(require("../../services/court-management/court-proceeding.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
// Court proceeding validation schemas
const createCourtProceedingSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    date: joi_1.default.date().required(),
    time: joi_1.default.string().optional(),
    type: joi_1.default.string().required(),
    courtRoom: joi_1.default.string().optional(),
    judge: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    notes: joi_1.default.string().optional(),
    caseId: joi_1.default.string().uuid().required(),
    attendees: joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string().required(),
        role: joi_1.default.string().required(),
        type: joi_1.default.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
        present: joi_1.default.boolean().default(false),
        notes: joi_1.default.string().optional(),
    })).optional(),
    documents: joi_1.default.array().items(joi_1.default.object({
        documentId: joi_1.default.string().uuid().required(),
        name: joi_1.default.string().required(),
        type: joi_1.default.string().required(),
        status: joi_1.default.string().valid('pending', 'submitted', 'accepted', 'rejected').default('pending'),
        notes: joi_1.default.string().optional(),
    })).optional(),
    tasks: joi_1.default.array().items(joi_1.default.object({
        title: joi_1.default.string().required(),
        description: joi_1.default.string().optional(),
        dueDate: joi_1.default.date().required(),
        assignedTo: joi_1.default.string().uuid().required(),
        priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
        notes: joi_1.default.string().optional(),
    })).optional(),
    metadata: joi_1.default.object().optional(),
});
const updateCourtProceedingSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    date: joi_1.default.date().optional(),
    time: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').optional(),
    type: joi_1.default.string().optional(),
    courtRoom: joi_1.default.string().optional(),
    judge: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    notes: joi_1.default.string().optional(),
    nextDate: joi_1.default.date().optional(),
    outcome: joi_1.default.string().optional(),
    attendees: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid().optional(),
        name: joi_1.default.string().required(),
        role: joi_1.default.string().required(),
        type: joi_1.default.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
        present: joi_1.default.boolean().required(),
        notes: joi_1.default.string().optional(),
    })).optional(),
    documents: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid().optional(),
        documentId: joi_1.default.string().uuid().required(),
        name: joi_1.default.string().required(),
        type: joi_1.default.string().required(),
        status: joi_1.default.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
        notes: joi_1.default.string().optional(),
    })).optional(),
    tasks: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid().optional(),
        title: joi_1.default.string().required(),
        description: joi_1.default.string().optional(),
        dueDate: joi_1.default.date().required(),
        assignedTo: joi_1.default.string().uuid().required(),
        status: joi_1.default.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
        priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
        notes: joi_1.default.string().optional(),
    })).optional(),
    metadata: joi_1.default.object().optional(),
});
const addAttendeeSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    role: joi_1.default.string().required(),
    type: joi_1.default.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
    present: joi_1.default.boolean().required(),
    notes: joi_1.default.string().optional(),
});
const addDocumentSchema = joi_1.default.object({
    documentId: joi_1.default.string().uuid().required(),
    name: joi_1.default.string().required(),
    type: joi_1.default.string().required(),
    status: joi_1.default.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
    notes: joi_1.default.string().optional(),
});
const addTaskSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    dueDate: joi_1.default.date().required(),
    assignedTo: joi_1.default.string().uuid().required(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').required(),
    notes: joi_1.default.string().optional(),
});
const addNoteSchema = joi_1.default.object({
    note: joi_1.default.string().required(),
});
const updateStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
});
const setNextHearingDateSchema = joi_1.default.object({
    nextDate: joi_1.default.date().required(),
});
const recordOutcomeSchema = joi_1.default.object({
    outcome: joi_1.default.string().required(),
});
class CourtProceedingController {
    /**
     * Create a new court proceeding
     * @param req Request
     * @param res Response
     */
    async createCourtProceeding(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createCourtProceedingSchema, req.body);
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
            // Create court proceeding
            const proceeding = await court_proceeding_service_1.default.createCourtProceeding({
                ...value,
                tenantId: req.tenant.id,
                createdBy: userId,
            }, req.tenantConnection);
            res.status(201).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error creating court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get court proceeding by ID
     * @param req Request
     * @param res Response
     */
    async getCourtProceedingById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get court proceeding
            const proceeding = await court_proceeding_service_1.default.getCourtProceedingById(id, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error getting court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update court proceeding
     * @param req Request
     * @param res Response
     */
    async updateCourtProceeding(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateCourtProceedingSchema, req.body);
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
            // Update court proceeding
            const proceeding = await court_proceeding_service_1.default.updateCourtProceeding(id, value, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error updating court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete court proceeding
     * @param req Request
     * @param res Response
     */
    async deleteCourtProceeding(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Delete court proceeding
            const deleted = await court_proceeding_service_1.default.deleteCourtProceeding(id, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get court proceedings by case
     * @param req Request
     * @param res Response
     */
    async getCourtProceedingsByCase(req, res) {
        try {
            const { caseId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get court proceedings
            const result = await court_proceeding_service_1.default.getCourtProceedingsByCaseId(caseId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting court proceedings by case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get upcoming court proceedings
     * @param req Request
     * @param res Response
     */
    async getUpcomingCourtProceedings(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get upcoming court proceedings
            const result = await court_proceeding_service_1.default.getUpcomingCourtProceedings(req.tenant.id, days, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting upcoming court proceedings', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get court proceedings by status
     * @param req Request
     * @param res Response
     */
    async getCourtProceedingsByStatus(req, res) {
        try {
            const { status } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Validate status
            if (!['scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get court proceedings by status
            const result = await court_proceeding_service_1.default.getCourtProceedingsByStatus(req.tenant.id, status, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting court proceedings by status', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add attendee to court proceeding
     * @param req Request
     * @param res Response
     */
    async addAttendee(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(addAttendeeSchema, req.body);
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
            // Add attendee
            const proceeding = await court_proceeding_service_1.default.addAttendee(id, value, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error adding attendee to court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add document to court proceeding
     * @param req Request
     * @param res Response
     */
    async addDocument(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(addDocumentSchema, req.body);
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
            // Add document
            const proceeding = await court_proceeding_service_1.default.addDocument(id, value, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error adding document to court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add task to court proceeding
     * @param req Request
     * @param res Response
     */
    async addTask(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(addTaskSchema, req.body);
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
            // Add task
            const proceeding = await court_proceeding_service_1.default.addTask(id, value, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error adding task to court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update court proceeding status
     * @param req Request
     * @param res Response
     */
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateStatusSchema, req.body);
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
            // Update status
            const proceeding = await court_proceeding_service_1.default.updateStatus(id, value.status, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error updating court proceeding status', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add note to court proceeding
     * @param req Request
     * @param res Response
     */
    async addNote(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(addNoteSchema, req.body);
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
            // Add note
            const proceeding = await court_proceeding_service_1.default.addNote(id, value.note, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error adding note to court proceeding', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Set next hearing date
     * @param req Request
     * @param res Response
     */
    async setNextHearingDate(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(setNextHearingDateSchema, req.body);
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
            // Set next hearing date
            const proceeding = await court_proceeding_service_1.default.setNextHearingDate(id, value.nextDate, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error setting next hearing date', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Record outcome
     * @param req Request
     * @param res Response
     */
    async recordOutcome(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(recordOutcomeSchema, req.body);
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
            // Record outcome
            const proceeding = await court_proceeding_service_1.default.recordOutcome(id, value.outcome, userId, req.tenantConnection);
            if (!proceeding) {
                res.status(404).json({ error: 'Court proceeding not found' });
                return;
            }
            res.status(200).json(proceeding);
        }
        catch (error) {
            logger_1.logger.error('Error recording outcome', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.CourtProceedingController = CourtProceedingController;
exports.default = new CourtProceedingController();
