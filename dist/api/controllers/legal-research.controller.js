"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalResearchController = void 0;
const legal_research_service_1 = __importDefault(require("../../services/legal-research/legal-research.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
// Legal research validation schemas
const createLegalResearchSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    query: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other').required(),
    keywords: joi_1.default.array().items(joi_1.default.string()).optional(),
    sources: joi_1.default.array().items(joi_1.default.string()).optional(),
    caseId: joi_1.default.string().uuid().optional(),
    filters: joi_1.default.object({
        courts: joi_1.default.array().items(joi_1.default.string()).optional(),
        dateRange: joi_1.default.object({
            start: joi_1.default.date().optional(),
            end: joi_1.default.date().optional(),
        }).optional(),
        jurisdiction: joi_1.default.array().items(joi_1.default.string()).optional(),
        judges: joi_1.default.array().items(joi_1.default.string()).optional(),
        resultType: joi_1.default.array().items(joi_1.default.string()).optional(),
        customFilters: joi_1.default.object().optional(),
    }).optional(),
    metadata: joi_1.default.object().optional(),
});
const updateLegalResearchSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    query: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('in_progress', 'completed', 'archived').optional(),
    type: joi_1.default.string().valid('case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other').optional(),
    keywords: joi_1.default.array().items(joi_1.default.string()).optional(),
    sources: joi_1.default.array().items(joi_1.default.string()).optional(),
    caseId: joi_1.default.string().uuid().optional().allow(null),
    filters: joi_1.default.object({
        courts: joi_1.default.array().items(joi_1.default.string()).optional(),
        dateRange: joi_1.default.object({
            start: joi_1.default.date().optional(),
            end: joi_1.default.date().optional(),
        }).optional(),
        jurisdiction: joi_1.default.array().items(joi_1.default.string()).optional(),
        judges: joi_1.default.array().items(joi_1.default.string()).optional(),
        resultType: joi_1.default.array().items(joi_1.default.string()).optional(),
        customFilters: joi_1.default.object().optional(),
    }).optional(),
    analysis: joi_1.default.object({
        summary: joi_1.default.string().optional(),
        keyPoints: joi_1.default.array().items(joi_1.default.string()).optional(),
        recommendations: joi_1.default.array().items(joi_1.default.string()).optional(),
        generatedAt: joi_1.default.date().optional(),
    }).optional(),
    metadata: joi_1.default.object().optional(),
});
const searchQuerySchema = joi_1.default.object({
    query: joi_1.default.string().required(),
    source: joi_1.default.string().required(),
    filters: joi_1.default.object({
        courts: joi_1.default.array().items(joi_1.default.string()).optional(),
        dateRange: joi_1.default.object({
            start: joi_1.default.date().optional(),
            end: joi_1.default.date().optional(),
        }).optional(),
        jurisdiction: joi_1.default.array().items(joi_1.default.string()).optional(),
        judges: joi_1.default.array().items(joi_1.default.string()).optional(),
        resultType: joi_1.default.array().items(joi_1.default.string()).optional(),
        customFilters: joi_1.default.object().optional(),
    }).optional(),
});
const resultSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    source: joi_1.default.string().required(),
    citation: joi_1.default.string().optional(),
    url: joi_1.default.string().optional(),
    snippet: joi_1.default.string().optional(),
    relevanceScore: joi_1.default.number().optional(),
    notes: joi_1.default.string().optional(),
});
const updateResultNotesSchema = joi_1.default.object({
    notes: joi_1.default.string().required(),
});
class LegalResearchController {
    /**
     * Create a new legal research
     * @param req Request
     * @param res Response
     */
    async createLegalResearch(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createLegalResearchSchema, req.body);
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
            // Create legal research
            const research = await legal_research_service_1.default.createLegalResearch({
                ...value,
                tenantId: req.tenant.id,
                createdBy: userId,
            }, req.tenantConnection);
            res.status(201).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error creating legal research', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get legal research by ID
     * @param req Request
     * @param res Response
     */
    async getLegalResearchById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get legal research
            const research = await legal_research_service_1.default.getLegalResearchById(id, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error getting legal research', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update legal research
     * @param req Request
     * @param res Response
     */
    async updateLegalResearch(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateLegalResearchSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update legal research
            const research = await legal_research_service_1.default.updateLegalResearch(id, value, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error updating legal research', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete legal research
     * @param req Request
     * @param res Response
     */
    async deleteLegalResearch(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Delete legal research
            const deleted = await legal_research_service_1.default.deleteLegalResearch(id, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting legal research', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all legal researches
     * @param req Request
     * @param res Response
     */
    async getAllLegalResearches(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get legal researches
            const result = await legal_research_service_1.default.getLegalResearchesByTenantId(req.tenant.id, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting legal researches', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get legal researches by case
     * @param req Request
     * @param res Response
     */
    async getLegalResearchesByCase(req, res) {
        try {
            const { caseId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get legal researches
            const result = await legal_research_service_1.default.getLegalResearchesByCaseId(caseId, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting legal researches by case', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Search legal database
     * @param req Request
     * @param res Response
     */
    async searchLegalDatabase(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(searchQuerySchema, req.body);
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
            // Search legal database
            const research = await legal_research_service_1.default.searchLegalDatabase(id, value, userId, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error searching legal database', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Generate analysis
     * @param req Request
     * @param res Response
     */
    async generateAnalysis(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Generate analysis
            const research = await legal_research_service_1.default.generateAnalysis(id, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error generating analysis', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Add result
     * @param req Request
     * @param res Response
     */
    async addResult(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(resultSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Add result
            const research = await legal_research_service_1.default.addResult(id, value, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error adding result', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Remove result
     * @param req Request
     * @param res Response
     */
    async removeResult(req, res) {
        try {
            const { id, resultId } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Remove result
            const research = await legal_research_service_1.default.removeResult(id, resultId, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error removing result', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update result notes
     * @param req Request
     * @param res Response
     */
    async updateResultNotes(req, res) {
        try {
            const { id, resultId } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateResultNotesSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update result notes
            const research = await legal_research_service_1.default.updateResultNotes(id, resultId, value.notes, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error updating result notes', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Archive legal research
     * @param req Request
     * @param res Response
     */
    async archiveLegalResearch(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Archive legal research
            const research = await legal_research_service_1.default.archiveLegalResearch(id, req.tenantConnection);
            if (!research) {
                res.status(404).json({ error: 'Legal research not found' });
                return;
            }
            res.status(200).json(research);
        }
        catch (error) {
            logger_1.logger.error('Error archiving legal research', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.LegalResearchController = LegalResearchController;
exports.default = new LegalResearchController();
