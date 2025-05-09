import { Router } from 'express';
import courtProceedingController from '../controllers/court-proceeding.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Create court proceeding
router.post(
  '/',
  courtProceedingController.createCourtProceeding
);

// Get all court proceedings by case
router.get(
  '/case/:caseId',
  validateParams(Joi.object({
    caseId: Joi.string().uuid().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  courtProceedingController.getCourtProceedingsByCase
);

// Get upcoming court proceedings
router.get(
  '/upcoming',
  validateQuery(Joi.object({
    days: Joi.number().integer().min(1).max(90).default(7),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  courtProceedingController.getUpcomingCourtProceedings
);

// Get court proceedings by status
router.get(
  '/status/:status',
  validateParams(Joi.object({
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  courtProceedingController.getCourtProceedingsByStatus
);

// Get court proceeding by ID
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  courtProceedingController.getCourtProceedingById
);

// Update court proceeding
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  courtProceedingController.updateCourtProceeding
);

// Delete court proceeding
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  courtProceedingController.deleteCourtProceeding
);

// Add attendee to court proceeding
router.post(
  '/:id/attendees',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    name: Joi.string().required(),
    role: Joi.string().required(),
    type: Joi.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
    present: Joi.boolean().required(),
    notes: Joi.string().optional(),
  })),
  courtProceedingController.addAttendee
);

// Add document to court proceeding
router.post(
  '/:id/documents',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    documentId: Joi.string().uuid().required(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    status: Joi.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
    notes: Joi.string().optional(),
  })),
  courtProceedingController.addDocument
);

// Add task to court proceeding
router.post(
  '/:id/tasks',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    dueDate: Joi.date().required(),
    assignedTo: Joi.string().uuid().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required(),
    notes: Joi.string().optional(),
  })),
  courtProceedingController.addTask
);

// Update court proceeding status
router.patch(
  '/:id/status',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
  })),
  courtProceedingController.updateStatus
);

// Add note to court proceeding
router.post(
  '/:id/notes',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    note: Joi.string().required(),
  })),
  courtProceedingController.addNote
);

// Set next hearing date
router.patch(
  '/:id/next-hearing',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    nextDate: Joi.date().required(),
  })),
  courtProceedingController.setNextHearingDate
);

// Record outcome
router.patch(
  '/:id/outcome',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    outcome: Joi.string().required(),
  })),
  courtProceedingController.recordOutcome
);

export default router;