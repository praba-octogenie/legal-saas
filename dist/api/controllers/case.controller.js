"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseController = void 0;
const case_service_1 = __importDefault(require("../../services/case-management/case.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
// Case validation schemas
const casePartySchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    type: joi_1.default.string().valid('plaintiff', 'defendant', 'respondent', 'petitioner', 'appellant', 'witness', 'third_party', 'other').required(),
    role: joi_1.default.string().required(),
    contactInfo: joi_1.default.object({
        email: joi_1.default.string().email().optional(),
        phone: joi_1.default.string().optional(),
        address: joi_1.default.string().optional(),
    }).optional(),
    counsel: joi_1.default.string().optional(),
});
const caseTimelineEventSchema = joi_1.default.object({
    date: joi_1.default.date().required(),
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('filing', 'hearing', 'order', 'judgment', 'submission', 'other').required(),
    status: joi_1.default.string().valid('pending', 'completed', 'cancelled', 'rescheduled').required(),
    notes: joi_1.default.string().optional(),
    documents: joi_1.default.array().items(joi_1.default.string()).optional(),
});
const caseTeamMemberSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
    role: joi_1.default.string().valid('lead', 'associate', 'paralegal', 'consultant', 'admin').required(),
    permissions: joi_1.default.array().items(joi_1.default.string()).required(),
});
const createCaseSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    caseNumber: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    type: joi_1.default.string().required(),
    subType: joi_1.default.string().optional(),
    court: joi_1.default.string().required(),
    courtBranch: joi_1.default.string().optional(),
    judge: joi_1.default.string().optional(),
    opposingCounsel: joi_1.default.string().optional(),
    filingDate: joi_1.default.date().optional(),
    nextHearingDate: joi_1.default.date().optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
    clientId: joi_1.default.string().uuid().required(),
    assignedTo: joi_1.default.string().uuid().required(),
    parties: joi_1.default.array().items(casePartySchema).optional(),
    timeline: joi_1.default.array().items(caseTimelineEventSchema).optional(),
    team: joi_1.default.array().items(caseTeamMemberSchema).optional(),
    courtDetails: joi_1.default.object({
        courtId: joi_1.default.string().optional(),
        courtType: joi_1.default.string().optional(),
        jurisdiction: joi_1.default.string().optional(),
        bench: joi_1.default.string().optional(),
        courtRoom: joi_1.default.string().optional(),
        filingNumber: joi_1.default.string().optional(),
        cnrNumber: joi_1.default.string().optional(),
    }).optional(),
    fees: joi_1.default.object({
        billingType: joi_1.default.string().valid('hourly', 'fixed', 'contingency', 'retainer').optional(),
        estimatedAmount: joi_1.default.number().optional(),
        currency: joi_1.default.string().optional(),
        ratePerHour: joi_1.default.number().optional(),
        retainerAmount: joi_1.default.number().optional(),
        contingencyPercentage: joi_1.default.number().optional(),
    }).optional(),
    metadata: joi_1.default.object().optional(),
});
const updateCaseSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').optional(),
    type: joi_1.default.string().optional(),
    subType: joi_1.default.string().optional(),
    court: joi_1.default.string().optional(),
    courtBranch: joi_1.default.string().optional(),
    judge: joi_1.default.string().optional(),
    opposingCounsel: joi_1.default.string().optional(),
    filingDate: joi_1.default.date().optional(),
    nextHearingDate: joi_1.default.date().optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').optional(),
    clientId: joi_1.default.string().uuid().optional(),
    assignedTo: joi_1.default.string().uuid().optional(),
    parties: joi_1.default.array().items(casePartySchema.keys({
        id: joi_1.default.string().uuid().optional(),
    })).optional(),
    timeline: joi_1.default.array().items(caseTimelineEventSchema.keys({
        id: joi_1.default.string().uuid().optional(),
    })).optional(),
    team: joi_1.default.array().items(caseTeamMemberSchema).optional(),
    courtDetails: joi_1.default.object({
        courtId: joi_1.default.string().optional(),
        courtType: joi_1.default.string().optional(),
        jurisdiction: joi_1.default.string().optional(),
        bench: joi_1.default.string().optional(),
        courtRoom: joi_1.default.string().optional(),
        filingNumber: joi_1.default.string().optional(),
        cnrNumber: joi_1.default.string().optional(),
    }).optional(),
    fees: joi_1.default.object({
        billingType: joi_1.default.string().valid('hourly', 'fixed', 'contingency', 'retainer').optional(),
        estimatedAmount: joi_1.default.number().optional(),
        currency: joi_1.default.string().optional(),
        ratePerHour: joi_1.default.number().optional(),
        retainerAmount: joi_1.default.number().optional(),
        contingencyPercentage: joi_1.default.number().optional(),
    }).optional(),
    metadata: joi_1.default.object().optional(),
});
const timelineEventSchema = joi_1.default.object({
    date: joi_1.default.date().required(),
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('filing', 'hearing', 'order', 'judgment', 'submission', 'other').required(),
    status: joi_1.default.string().valid('pending', 'completed', 'cancelled', 'rescheduled').required(),
    notes: joi_1.default.string().optional(),
    documents: joi_1.default.array().items(joi_1.default.string()).optional(),
});
class CaseController {
    /**
     * Create a new case
     * @param req Request
     * @param res Response
     */
    async createCase(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createCaseSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Create case
            const caseInstance = await case_service_1.default.createCase({
                ...value,
                tenantId: req.tenant.id,
            }, req.tenantConnection);
            res.status(201).json(caseInstance);
        }
        catch (error) {
            logger_1.logger.error('Error creating case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get case by ID
     * @param req Request
     * @param res Response
     */
    async getCaseById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get case
            const caseInstance = await case_service_1.default.getCaseById(id, req.tenantConnection);
            if (!caseInstance) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            res.status(200).json(caseInstance);
        }
        catch (error) {
            logger_1.logger.error('Error getting case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update case
     * @param req Request
     * @param res Response
     */
    async updateCase(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateCaseSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update case
            const caseInstance = await case_service_1.default.updateCase(id, value, req.tenantConnection);
            if (!caseInstance) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            res.status(200).json(caseInstance);
        }
        catch (error) {
            logger_1.logger.error('Error updating case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete case
     * @param req Request
     * @param res Response
     */
    async deleteCase(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Delete case
            const deleted = await case_service_1.default.deleteCase(id, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all cases
     * @param req Request
     * @param res Response
     */
    async getAllCases(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get cases
            const result = await case_service_1.default.getCasesByTenantId(req.tenant.id, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting cases', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get cases by client
     * @param req Request
     * @param res Response
     */
    async getCasesByClient(req, res) {
        try {
            const { clientId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get cases
            const result = await case_service_1.default.getCasesByClientId(clientId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting cases by client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get cases by assigned user
     * @param req Request
     * @param res Response
     */
    async getCasesByAssignedUser(req, res) {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get cases
            const result = await case_service_1.default.getCasesByAssignedUserId(userId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting cases by assigned user', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get cases by status
     * @param req Request
     * @param res Response
     */
    async getCasesByStatus(req, res) {
        try {
            const { status } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Validate status
            if (!['pending', 'active', 'on_hold', 'closed', 'archived'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get cases
            const result = await case_service_1.default.getCasesByStatus(req.tenant.id, status, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting cases by status', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get cases by court
     * @param req Request
     * @param res Response
     */
    async getCasesByCourt(req, res) {
        try {
            const { court } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get cases
            const result = await case_service_1.default.getCasesByCourt(req.tenant.id, court, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting cases by court', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Search cases
     * @param req Request
     * @param res Response
     */
    async searchCases(req, res) {
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
            // Search cases
            const result = await case_service_1.default.searchCases(req.tenant.id, searchTerm, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error searching cases', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get upcoming hearings
     * @param req Request
     * @param res Response
     */
    async getUpcomingHearings(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get upcoming hearings
            const result = await case_service_1.default.getUpcomingHearings(req.tenant.id, days, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting upcoming hearings', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add timeline event
     * @param req Request
     * @param res Response
     */
    async addTimelineEvent(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(timelineEventSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Add timeline event
            const caseInstance = await case_service_1.default.addTimelineEvent(id, value, req.tenantConnection);
            if (!caseInstance) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            res.status(200).json(caseInstance);
        }
        catch (error) {
            logger_1.logger.error('Error adding timeline event', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update case status
     * @param req Request
     * @param res Response
     */
    async updateCaseStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            // Validate status
            if (!status || !['pending', 'active', 'on_hold', 'closed', 'archived'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update case status
            const caseInstance = await case_service_1.default.updateCaseStatus(id, status, req.tenantConnection);
            if (!caseInstance) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            res.status(200).json(caseInstance);
        }
        catch (error) {
            logger_1.logger.error('Error updating case status', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.CaseController = CaseController;
exports.default = new CaseController();
