import { Router } from 'express';
import billingController from '../controllers/billing.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validateBody, validateParams, validateQuery } from '../../utils/validation';
import Joi from 'joi';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(requireTenant);

// Create invoice
router.post(
  '/invoices',
  billingController.createInvoice
);

// Get all invoices
router.get(
  '/invoices',
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })),
  billingController.getAllInvoices
);

// Get invoice by ID
router.get(
  '/invoices/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  billingController.getInvoiceById
);

// Update invoice
router.put(
  '/invoices/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  billingController.updateInvoice
);

// Delete invoice
router.delete(
  '/invoices/:id',
  validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
  billingController.deleteInvoice
);

export default router;