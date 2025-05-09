import { Router } from 'express';
import tenantController from '../controllers/tenant.controller';
import { validateBody } from '../../utils/validation';
import Joi from 'joi';
import { authenticateAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Validation schema for updating tenant status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'suspended', 'trial').required(),
});

// Admin routes for tenant management
// These routes should only be accessible by system administrators

// Create a new tenant
router.post('/', authenticateAdmin, tenantController.createTenant);

// Get all tenants
router.get('/', authenticateAdmin, tenantController.getAllTenants);

// Get tenant by ID
router.get('/:id', authenticateAdmin, tenantController.getTenantById);

// Update tenant
router.put('/:id', authenticateAdmin, tenantController.updateTenant);

// Delete tenant
router.delete('/:id', authenticateAdmin, tenantController.deleteTenant);

// Update tenant status
router.patch('/:id/status', authenticateAdmin, validateBody(updateStatusSchema), tenantController.updateTenantStatus);

export default router;