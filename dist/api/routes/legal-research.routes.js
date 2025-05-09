"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const legal_research_controller_1 = __importDefault(require("../controllers/legal-research.controller"));
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Create legal research
router.post('/', legal_research_controller_1.default.createLegalResearch);
// Get all legal researches
router.get('/', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), legal_research_controller_1.default.getAllLegalResearches);
// Get legal researches by case
router.get('/case/:caseId', (0, validation_1.validateParams)(joi_1.default.object({
    caseId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), legal_research_controller_1.default.getLegalResearchesByCase);
// Get legal research by ID
router.get('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.getLegalResearchById);
// Update legal research
router.put('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.updateLegalResearch);
// Delete legal research
router.delete('/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.deleteLegalResearch);
// Search legal database
router.post('/:id/search', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
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
})), legal_research_controller_1.default.searchLegalDatabase);
// Generate analysis
router.post('/:id/analyze', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.generateAnalysis);
// Add result
router.post('/:id/results', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    title: joi_1.default.string().required(),
    source: joi_1.default.string().required(),
    citation: joi_1.default.string().optional(),
    url: joi_1.default.string().optional(),
    snippet: joi_1.default.string().optional(),
    relevanceScore: joi_1.default.number().optional(),
    notes: joi_1.default.string().optional(),
})), legal_research_controller_1.default.addResult);
// Remove result
router.delete('/:id/results/:resultId', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    resultId: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.removeResult);
// Update result notes
router.patch('/:id/results/:resultId/notes', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    resultId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateBody)(joi_1.default.object({
    notes: joi_1.default.string().required(),
})), legal_research_controller_1.default.updateResultNotes);
// Archive legal research
router.post('/:id/archive', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), legal_research_controller_1.default.archiveLegalResearch);
// AI-powered legal research routes
// Ask a legal question to the AI assistant
router.post('/ai/ask', (0, validation_1.validateBody)(joi_1.default.object({
    question: joi_1.default.string().required(),
    context: joi_1.default.string().optional(),
    options: joi_1.default.object({
        maxTokens: joi_1.default.number().integer().min(100).max(4000).optional(),
        temperature: joi_1.default.number().min(0).max(1).optional(),
        sources: joi_1.default.array().items(joi_1.default.string()).optional(),
        jurisdiction: joi_1.default.string().optional(),
    }).optional(),
})), ai_controller_1.default.askLegalQuestion);
// Analyze a legal document using AI
router.post('/ai/analyze', (0, validation_1.validateBody)(joi_1.default.object({
    documentContent: joi_1.default.string().required(),
    documentType: joi_1.default.string().optional(),
    options: joi_1.default.object({
        maxTokens: joi_1.default.number().integer().min(100).max(4000).optional(),
        temperature: joi_1.default.number().min(0).max(1).optional(),
        focusAreas: joi_1.default.array().items(joi_1.default.string()).optional(),
        jurisdiction: joi_1.default.string().optional(),
    }).optional(),
})), ai_controller_1.default.analyzeLegalDocument);
// Predict case outcome using AI
router.post('/ai/predict', (0, validation_1.validateBody)(joi_1.default.object({
    caseDetails: joi_1.default.object({
        facts: joi_1.default.string().required(),
        legalIssues: joi_1.default.array().items(joi_1.default.string()).required(),
        jurisdiction: joi_1.default.string().required(),
        court: joi_1.default.string().required(),
        precedents: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).required(),
    options: joi_1.default.object({
        maxTokens: joi_1.default.number().integer().min(100).max(4000).optional(),
        temperature: joi_1.default.number().min(0).max(1).optional(),
        confidenceThreshold: joi_1.default.number().min(0).max(1).optional(),
    }).optional(),
})), ai_controller_1.default.predictCaseOutcome);
exports.default = router;
