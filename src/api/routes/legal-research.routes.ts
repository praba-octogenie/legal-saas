import { Router } from 'express';
import legalResearchController from '../controllers/legal-research.controller';
import AIController from '../controllers/ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Create legal research
router.post(
  '/',
  legalResearchController.createLegalResearch
);

// Get all legal researches
router.get(
  '/',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  legalResearchController.getAllLegalResearches
);

// Get legal researches by case
router.get(
  '/case/:caseId',
  validateParams(Joi.object({
    caseId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  legalResearchController.getLegalResearchesByCase
);

// Get legal research by ID
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  legalResearchController.getLegalResearchById
);

// Update legal research
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  legalResearchController.updateLegalResearch
);

// Delete legal research
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  legalResearchController.deleteLegalResearch
);

// Search legal database
router.post(
  '/:id/search',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    query: Joi.string().required(),
    source: Joi.string().required(),
    filters: Joi.object({
      courts: Joi.array().items(Joi.string()).optional(),
      dateRange: Joi.object({
        start: Joi.date().optional(),
        end: Joi.date().optional(),
      }).optional(),
      jurisdiction: Joi.array().items(Joi.string()).optional(),
      judges: Joi.array().items(Joi.string()).optional(),
      resultType: Joi.array().items(Joi.string()).optional(),
      customFilters: Joi.object().optional(),
    }).optional(),
  })),
  legalResearchController.searchLegalDatabase
);

// Generate analysis
router.post(
  '/:id/analyze',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  legalResearchController.generateAnalysis
);

// Add result
router.post(
  '/:id/results',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    title: Joi.string().required(),
    source: Joi.string().required(),
    citation: Joi.string().optional(),
    url: Joi.string().optional(),
    snippet: Joi.string().optional(),
    relevanceScore: Joi.number().optional(),
    notes: Joi.string().optional(),
  })),
  legalResearchController.addResult
);

// Remove result
router.delete(
  '/:id/results/:resultId',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
    resultId: Joi.string().uuid().required(),
  })),
  legalResearchController.removeResult
);

// Update result notes
router.patch(
  '/:id/results/:resultId/notes',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
    resultId: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    notes: Joi.string().required(),
  })),
  legalResearchController.updateResultNotes
);

// Archive legal research
router.post(
  '/:id/archive',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  legalResearchController.archiveLegalResearch
);

// AI-powered legal research routes
// Ask a legal question to the AI assistant
router.post(
  '/ai/ask',
  validateBody(Joi.object({
    question: Joi.string().required(),
    context: Joi.string().optional(),
    options: Joi.object({
      maxTokens: Joi.number().integer().min(100).max(4000).optional(),
      temperature: Joi.number().min(0).max(1).optional(),
      sources: Joi.array().items(Joi.string()).optional(),
      jurisdiction: Joi.string().optional(),
    }).optional(),
  })),
  AIController.askLegalQuestion
);

// Analyze a legal document using AI
router.post(
  '/ai/analyze',
  validateBody(Joi.object({
    documentContent: Joi.string().required(),
    documentType: Joi.string().optional(),
    options: Joi.object({
      maxTokens: Joi.number().integer().min(100).max(4000).optional(),
      temperature: Joi.number().min(0).max(1).optional(),
      focusAreas: Joi.array().items(Joi.string()).optional(),
      jurisdiction: Joi.string().optional(),
    }).optional(),
  })),
  AIController.analyzeLegalDocument
);

// Predict case outcome using AI
router.post(
  '/ai/predict',
  validateBody(Joi.object({
    caseDetails: Joi.object({
      facts: Joi.string().required(),
      legalIssues: Joi.array().items(Joi.string()).required(),
      jurisdiction: Joi.string().required(),
      court: Joi.string().required(),
      precedents: Joi.array().items(Joi.string()).optional(),
    }).required(),
    options: Joi.object({
      maxTokens: Joi.number().integer().min(100).max(4000).optional(),
      temperature: Joi.number().min(0).max(1).optional(),
      confidenceThreshold: Joi.number().min(0).max(1).optional(),
    }).optional(),
  })),
  AIController.predictCaseOutcome
);

export default router;