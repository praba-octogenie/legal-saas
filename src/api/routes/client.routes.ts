import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Create client
router.post(
  '/',
  clientController.createClient
);

// Get all clients
router.get(
  '/',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  clientController.getAllClients
);

// Search clients
router.get(
  '/search',
  validateQuery(Joi.object({
    searchTerm: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  clientController.searchClients
);

// Get clients by category
router.get(
  '/category/:category',
  validateParams(Joi.object({
    category: Joi.string().required(),
  })),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  clientController.getClientsByCategory
);

// Get client by ID
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  clientController.getClientById
);

// Update client
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  clientController.updateClient
);

// Delete client
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  clientController.deleteClient
);

// Verify client KYC
router.post(
  '/:id/verify-kyc',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  clientController.verifyClientKYC
);

// Update client status
router.patch(
  '/:id/status',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    status: Joi.string().valid('active', 'inactive', 'blocked').required(),
  })),
  clientController.updateClientStatus
);

// Update client portal access
router.patch(
  '/:id/portal-access',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  validateBody(Joi.object({
    enabled: Joi.boolean().required(),
    username: Joi.string().when('enabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    accessLevel: Joi.string().valid('full', 'limited', 'readonly').default('readonly'),
  })),
  clientController.updateClientPortalAccess
);

export default router;