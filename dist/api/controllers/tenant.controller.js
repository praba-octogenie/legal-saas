"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const tenant_service_1 = __importDefault(require("../../services/tenant-management/tenant.service"));
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
// Validation schemas
const createTenantSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(3).max(100),
    subdomain: joi_1.default.string().required().min(3).max(50).pattern(/^[a-z0-9-]+$/i),
    customDomain: joi_1.default.string().uri().optional(),
    plan: joi_1.default.string().valid('basic', 'professional', 'enterprise').default('basic'),
    contactInfo: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        phone: joi_1.default.string().optional(),
        address: joi_1.default.object({
            street: joi_1.default.string().optional(),
            city: joi_1.default.string().optional(),
            state: joi_1.default.string().optional(),
            postalCode: joi_1.default.string().optional(),
            country: joi_1.default.string().optional(),
        }).optional(),
    }).required(),
    settings: joi_1.default.object({
        theme: joi_1.default.object({
            primaryColor: joi_1.default.string().optional(),
            secondaryColor: joi_1.default.string().optional(),
            logo: joi_1.default.string().uri().optional(),
        }).optional(),
        features: joi_1.default.object({
            multiLanguage: joi_1.default.boolean().optional(),
            documentGeneration: joi_1.default.boolean().optional(),
            legalResearch: joi_1.default.boolean().optional(),
            billing: joi_1.default.boolean().optional(),
            communication: joi_1.default.boolean().optional(),
            mobileApp: joi_1.default.boolean().optional(),
        }).optional(),
        defaultLanguage: joi_1.default.string().optional(),
        supportedLanguages: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).optional(),
});
const updateTenantSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).optional(),
    customDomain: joi_1.default.string().uri().optional().allow(null),
    status: joi_1.default.string().valid('active', 'inactive', 'suspended', 'trial').optional(),
    plan: joi_1.default.string().valid('basic', 'professional', 'enterprise').optional(),
    trialEndsAt: joi_1.default.date().optional(),
    subscriptionEndsAt: joi_1.default.date().optional(),
    settings: joi_1.default.object({
        theme: joi_1.default.object({
            primaryColor: joi_1.default.string().optional(),
            secondaryColor: joi_1.default.string().optional(),
            logo: joi_1.default.string().uri().optional(),
        }).optional(),
        features: joi_1.default.object({
            multiLanguage: joi_1.default.boolean().optional(),
            documentGeneration: joi_1.default.boolean().optional(),
            legalResearch: joi_1.default.boolean().optional(),
            billing: joi_1.default.boolean().optional(),
            communication: joi_1.default.boolean().optional(),
            mobileApp: joi_1.default.boolean().optional(),
        }).optional(),
        limits: joi_1.default.object({
            users: joi_1.default.number().integer().min(1).optional(),
            storage: joi_1.default.number().integer().min(1).optional(),
            cases: joi_1.default.number().integer().min(-1).optional(),
            documents: joi_1.default.number().integer().min(-1).optional(),
        }).optional(),
        defaultLanguage: joi_1.default.string().optional(),
        supportedLanguages: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).optional(),
    contactInfo: joi_1.default.object({
        email: joi_1.default.string().email().optional(),
        phone: joi_1.default.string().optional(),
        address: joi_1.default.object({
            street: joi_1.default.string().optional(),
            city: joi_1.default.string().optional(),
            state: joi_1.default.string().optional(),
            postalCode: joi_1.default.string().optional(),
            country: joi_1.default.string().optional(),
        }).optional(),
    }).optional(),
    integrations: joi_1.default.object({
        eCourtApi: joi_1.default.object({
            enabled: joi_1.default.boolean().required(),
            apiKey: joi_1.default.string().optional(),
        }).optional(),
        legalResearch: joi_1.default.object({
            sccOnline: joi_1.default.object({
                enabled: joi_1.default.boolean().required(),
                apiKey: joi_1.default.string().optional(),
            }).optional(),
            manupatra: joi_1.default.object({
                enabled: joi_1.default.boolean().required(),
                apiKey: joi_1.default.string().optional(),
            }).optional(),
            indianKanoon: joi_1.default.object({
                enabled: joi_1.default.boolean().required(),
                apiKey: joi_1.default.string().optional(),
            }).optional(),
        }).optional(),
        rocketChat: joi_1.default.object({
            enabled: joi_1.default.boolean().required(),
            url: joi_1.default.string().uri().optional(),
            adminUsername: joi_1.default.string().optional(),
            adminPassword: joi_1.default.string().optional(),
        }).optional(),
        googleMeet: joi_1.default.object({
            enabled: joi_1.default.boolean().required(),
            clientId: joi_1.default.string().optional(),
            clientSecret: joi_1.default.string().optional(),
        }).optional(),
    }).optional(),
    metadata: joi_1.default.object().optional(),
}).min(1);
class TenantController {
    /**
     * Create a new tenant
     * @param req Request
     * @param res Response
     */
    async createTenant(req, res) {
        try {
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(createTenantSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Create tenant
            const tenant = await tenant_service_1.default.createTenant(value);
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
        }
        catch (error) {
            logger_1.logger.error('Error in createTenant controller', error);
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
    async getTenantById(req, res) {
        try {
            const tenantId = req.params.id;
            // Get tenant
            const tenant = await tenant_service_1.default.getTenantById(tenantId);
            if (!tenant) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }
            res.status(200).json({ tenant });
        }
        catch (error) {
            logger_1.logger.error('Error in getTenantById controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all tenants
     * @param req Request
     * @param res Response
     */
    async getAllTenants(req, res) {
        try {
            const limit = parseInt(req.query.limit || '10', 10);
            const offset = parseInt(req.query.offset || '0', 10);
            // Get tenants
            const { tenants, total } = await tenant_service_1.default.getAllTenants(limit, offset);
            res.status(200).json({
                tenants,
                pagination: {
                    total,
                    limit,
                    offset,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAllTenants controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update tenant
     * @param req Request
     * @param res Response
     */
    async updateTenant(req, res) {
        try {
            const tenantId = req.params.id;
            // Validate request body
            const { error, value } = (0, validation_1.validateSchema)(updateTenantSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.message });
                return;
            }
            // Update tenant
            const tenant = await tenant_service_1.default.updateTenant(tenantId, value);
            if (!tenant) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }
            res.status(200).json({
                message: 'Tenant updated successfully',
                tenant,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in updateTenant controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete tenant
     * @param req Request
     * @param res Response
     */
    async deleteTenant(req, res) {
        try {
            const tenantId = req.params.id;
            // Delete tenant
            const deleted = await tenant_service_1.default.deleteTenant(tenantId);
            if (!deleted) {
                res.status(404).json({ error: 'Tenant not found' });
                return;
            }
            res.status(200).json({
                message: 'Tenant deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in deleteTenant controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update tenant status
     * @param req Request
     * @param res Response
     */
    async updateTenantStatus(req, res) {
        try {
            const tenantId = req.params.id;
            const { status } = req.body;
            // Validate status
            if (!['active', 'inactive', 'suspended', 'trial'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }
            // Update tenant status
            const tenant = await tenant_service_1.default.updateTenantStatus(tenantId, status);
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
        }
        catch (error) {
            logger_1.logger.error('Error in updateTenantStatus controller', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.TenantController = TenantController;
exports.default = new TenantController();
