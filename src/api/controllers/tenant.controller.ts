import { Request, Response } from 'express';
import tenantService, { CreateTenantDto, UpdateTenantDto } from '../../services/tenant-management/tenant.service';
import { logger } from '../../utils/logger';
import { validateSchema } from '../../utils/validation';
import Joi from 'joi';

// Validation schemas
const createTenantSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  subdomain: Joi.string().required().min(3).max(50).pattern(/^[a-z0-9-]+$/i),
  customDomain: Joi.string().uri().optional(),
  plan: Joi.string().valid('basic', 'professional', 'enterprise').default('basic'),
  contactInfo: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().optional(),
    }).optional(),
  }).required(),
  settings: Joi.object({
    theme: Joi.object({
      primaryColor: Joi.string().optional(),
      secondaryColor: Joi.string().optional(),
      logo: Joi.string().uri().optional(),
    }).optional(),
    features: Joi.object({
      multiLanguage: Joi.boolean().optional(),
      documentGeneration: Joi.boolean().optional(),
      legalResearch: Joi.boolean().optional(),
      billing: Joi.boolean().optional(),
      communication: Joi.boolean().optional(),
      mobileApp: Joi.boolean().optional(),
    }).optional(),
    defaultLanguage: Joi.string().optional(),
    supportedLanguages: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  customDomain: Joi.string().uri().optional().allow(null),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'trial').optional(),
  plan: Joi.string().valid('basic', 'professional', 'enterprise').optional(),
  trialEndsAt: Joi.date().optional(),
  subscriptionEndsAt: Joi.date().optional(),
  settings: Joi.object({
    theme: Joi.object({
      primaryColor: Joi.string().optional(),
      secondaryColor: Joi.string().optional(),
      logo: Joi.string().uri().optional(),
    }).optional(),
    features: Joi.object({
      multiLanguage: Joi.boolean().optional(),
      documentGeneration: Joi.boolean().optional(),
      legalResearch: Joi.boolean().optional(),
      billing: Joi.boolean().optional(),
      communication: Joi.boolean().optional(),
      mobileApp: Joi.boolean().optional(),
    }).optional(),
    limits: Joi.object({
      users: Joi.number().integer().min(1).optional(),
      storage: Joi.number().integer().min(1).optional(),
      cases: Joi.number().integer().min(-1).optional(),
      documents: Joi.number().integer().min(-1).optional(),
    }).optional(),
    defaultLanguage: Joi.string().optional(),
    supportedLanguages: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().optional(),
    }).optional(),
  }).optional(),
  integrations: Joi.object({
    eCourtApi: Joi.object({
      enabled: Joi.boolean().required(),
      apiKey: Joi.string().optional(),
    }).optional(),
    legalResearch: Joi.object({
      sccOnline: Joi.object({
        enabled: Joi.boolean().required(),
        apiKey: Joi.string().optional(),
      }).optional(),
      manupatra: Joi.object({
        enabled: Joi.boolean().required(),
        apiKey: Joi.string().optional(),
      }).optional(),
      indianKanoon: Joi.object({
        enabled: Joi.boolean().required(),
        apiKey: Joi.string().optional(),
      }).optional(),
    }).optional(),
    rocketChat: Joi.object({
      enabled: Joi.boolean().required(),
      url: Joi.string().uri().optional(),
      adminUsername: Joi.string().optional(),
      adminPassword: Joi.string().optional(),
    }).optional(),
    googleMeet: Joi.object({
      enabled: Joi.boolean().required(),
      clientId: Joi.string().optional(),
      clientSecret: Joi.string().optional(),
    }).optional(),
  }).optional(),
  metadata: Joi.object().optional(),
}).min(1);

export class TenantController {
  /**
   * Create a new tenant
   * @param req Request
   * @param res Response
   */
  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = validateSchema<CreateTenantDto>(createTenantSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Create tenant
      const tenant = await tenantService.createTenant(value);
      
      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          customDomain: tenant.customDomain,
          status: tenant.status,
          plan: tenant.plan,
          trialEndsAt: tenant.trialEndsAt,
          createdAt: tenant.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('Error in createTenant controller', error);
      
      if (error.message === 'Subdomain is already taken') {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get tenant by ID
   * @param req Request
   * @param res Response
   */
  async getTenantById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.params.id;
      
      // Get tenant
      const tenant = await tenantService.getTenantById(tenantId);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      
      res.status(200).json({ tenant });
    } catch (error) {
      logger.error('Error in getTenantById controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all tenants
   * @param req Request
   * @param res Response
   */
  async getAllTenants(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '10', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      
      // Get tenants
      const { tenants, total } = await tenantService.getAllTenants(limit, offset);
      
      res.status(200).json({
        tenants,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error in getAllTenants controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update tenant
   * @param req Request
   * @param res Response
   */
  async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.params.id;
      
      // Validate request body
      const { error, value } = validateSchema<UpdateTenantDto>(updateTenantSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      // Update tenant
      const tenant = await tenantService.updateTenant(tenantId, value);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      
      res.status(200).json({
        message: 'Tenant updated successfully',
        tenant,
      });
    } catch (error) {
      logger.error('Error in updateTenant controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete tenant
   * @param req Request
   * @param res Response
   */
  async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.params.id;
      
      // Delete tenant
      const deleted = await tenantService.deleteTenant(tenantId);
      
      if (!deleted) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      
      res.status(200).json({
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteTenant controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update tenant status
   * @param req Request
   * @param res Response
   */
  async updateTenantStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.params.id;
      const { status } = req.body;
      
      // Validate status
      if (!['active', 'inactive', 'suspended', 'trial'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      // Update tenant status
      const tenant = await tenantService.updateTenantStatus(tenantId, status);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      
      res.status(200).json({
        message: 'Tenant status updated successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          status: tenant.status,
        },
      });
    } catch (error) {
      logger.error('Error in updateTenantStatus controller', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new TenantController();