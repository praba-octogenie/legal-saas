import { Router } from 'express';
import caseController from '../controllers/case.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Create case
router.post(
  '/',
  caseController.createCase
);

// Get all cases
router.get(
  '/',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getAllCases
);

// Search cases
router.get(
  '/search',
  validateQuery(Joi.object({
    searchTerm: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.searchCases
);

// Get upcoming hearings
router.get(
  '/upcoming-hearings',
  validateQuery(Joi.object({
    days: Joi.number().integer().min(1).max(90).default(7),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getUpcomingHearings
);

// Get cases by status
router.get(
  '/status/:status',
  validateParams(Joi.object({
    status: Joi.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getCasesByStatus
);

// Get cases by court
router.get(
  '/court/:court',
  validateParams(Joi.object({
    court: Joi.string().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getCasesByCourt
);

// Get cases by client
router.get(
  '/client/:clientId',
  validateParams(Joi.object({
    clientId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getCasesByClient
);

// Get cases by assigned user
router.get(
  '/assigned/:userId',
  validateParams(Joi.object({
    userId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  caseController.getCasesByAssignedUser
);

// Get case by ID
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  caseController.getCaseById
);

// Update case
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  caseController.updateCase
);

// Delete case
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  caseController.deleteCase
);

// Add timeline event
router.post(
  '/:id/timeline',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  caseController.addTimelineEvent
);

// Update case status
router.patch(
  '/:id/status',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    status: Joi.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').required(),
  })),
  caseController.updateCaseStatus
);

export default router;