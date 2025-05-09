"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const tenant_model_1 = require("../../models/tenant.model");
const config_1 = require("../../database/config");
const logger_1 = require("../../utils/logger");
const encryption_1 = require("../../utils/encryption");
const uuid_1 = require("uuid");
class TenantService {
    /**
     * Create a new tenant
     * @param tenantData Tenant data
     * @returns Created tenant
     */
    async createTenant(tenantData) {
        try {
            const connection = await (0, config_1.getDefaultConnection)();
            // Validate subdomain format
            if (!/^[a-z0-9-]+$/i.test(tenantData.subdomain)) {
                throw new Error('Subdomain can only contain alphanumeric characters and hyphens');
            }
            // Check if subdomain is already taken
            const existingTenant = await tenant_model_1.Tenant.findOne({
                where: { subdomain: tenantData.subdomain },
            });
            if (existingTenant) {
                throw new Error('Subdomain is already taken');
            }
            // Set default values
            const defaultSettings = {
                theme: {
                    primaryColor: '#007bff',
                    secondaryColor: '#6c757d',
                },
                features: {
                    multiLanguage: true,
                    documentGeneration: true,
                    legalResearch: true,
                    billing: true,
                    communication: true,
                    mobileApp: true,
                },
                limits: {
                    users: tenantData.plan === 'basic' ? 5 : tenantData.plan === 'professional' ? 20 : 100,
                    storage: tenantData.plan === 'basic' ? 5 : tenantData.plan === 'professional' ? 50 : 500, // GB
                    cases: tenantData.plan === 'basic' ? 100 : tenantData.plan === 'professional' ? 1000 : -1, // -1 means unlimited
                    documents: tenantData.plan === 'basic' ? 1000 : tenantData.plan === 'professional' ? 10000 : -1,
                },
                defaultLanguage: 'en',
                supportedLanguages: ['en', 'hi'],
            };
            // Create tenant
            const tenant = await tenant_model_1.Tenant.create({
                id: (0, uuid_1.v4)(),
                name: tenantData.name,
                subdomain: tenantData.subdomain.toLowerCase(),
                customDomain: tenantData.customDomain,
                status: 'trial',
                plan: tenantData.plan || 'basic',
                trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                contactInfo: tenantData.contactInfo,
                settings: {
                    ...defaultSettings,
                    ...tenantData.settings,
                },
                integrations: {
                    eCourtApi: { enabled: false },
                    legalResearch: {
                        sccOnline: { enabled: false },
                        manupatra: { enabled: false },
                        indianKanoon: { enabled: false },
                    },
                    rocketChat: { enabled: false },
                    googleMeet: { enabled: false },
                },
                metadata: {},
            });
            // Initialize tenant schema and tables
            await this.initializeTenantSchema(tenant.id);
            logger_1.logger.info(`Tenant created: ${tenant.name} (${tenant.subdomain})`);
            return tenant;
        }
        catch (error) {
            logger_1.logger.error('Error creating tenant', error);
            throw error;
        }
    }
    /**
     * Initialize tenant schema and tables
     * @param tenantId Tenant ID
     */
    async initializeTenantSchema(tenantId) {
        try {
            // Get tenant connection
            const connection = await (0, config_1.getTenantConnection)(tenantId);
            // Sync models to create tables
            await connection.sync();
            logger_1.logger.info(`Tenant schema initialized: ${tenantId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error initializing tenant schema: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Get tenant by ID
     * @param tenantId Tenant ID
     * @returns Tenant
     */
    async getTenantById(tenantId) {
        try {
            return await tenant_model_1.Tenant.findByPk(tenantId);
        }
        catch (error) {
            logger_1.logger.error(`Error getting tenant by ID: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Get tenant by subdomain
     * @param subdomain Tenant subdomain
     * @returns Tenant
     */
    async getTenantBySubdomain(subdomain) {
        try {
            return await tenant_model_1.Tenant.findOne({
                where: { subdomain: subdomain.toLowerCase() },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting tenant by subdomain: ${subdomain}`, error);
            throw error;
        }
    }
    /**
     * Get tenant by custom domain
     * @param customDomain Tenant custom domain
     * @returns Tenant
     */
    async getTenantByCustomDomain(customDomain) {
        try {
            return await tenant_model_1.Tenant.findOne({
                where: { customDomain },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting tenant by custom domain: ${customDomain}`, error);
            throw error;
        }
    }
    /**
     * Update tenant
     * @param tenantId Tenant ID
     * @param updateData Update data
     * @returns Updated tenant
     */
    async updateTenant(tenantId, updateData) {
        try {
            const tenant = await tenant_model_1.Tenant.findByPk(tenantId);
            if (!tenant) {
                return null;
            }
            // Update tenant
            await tenant.update(updateData);
            logger_1.logger.info(`Tenant updated: ${tenant.name} (${tenant.id})`);
            return tenant;
        }
        catch (error) {
            logger_1.logger.error(`Error updating tenant: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Delete tenant
     * @param tenantId Tenant ID
     * @returns True if tenant was deleted
     */
    async deleteTenant(tenantId) {
        try {
            const tenant = await tenant_model_1.Tenant.findByPk(tenantId);
            if (!tenant) {
                return false;
            }
            // Delete tenant schema
            const connection = await (0, config_1.getDefaultConnection)();
            await connection.query(`DROP SCHEMA IF EXISTS tenant_${tenantId} CASCADE`);
            // Delete tenant record
            await tenant.destroy();
            logger_1.logger.info(`Tenant deleted: ${tenant.name} (${tenant.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting tenant: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Get all tenants
     * @param limit Limit
     * @param offset Offset
     * @returns Tenants
     */
    async getAllTenants(limit = 10, offset = 0) {
        try {
            const { count, rows } = await tenant_model_1.Tenant.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });
            return {
                tenants: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting all tenants', error);
            throw error;
        }
    }
    /**
     * Get tenant encryption key
     * @param tenantId Tenant ID
     * @returns Decrypted encryption key
     */
    async getTenantEncryptionKey(tenantId) {
        try {
            const tenant = await tenant_model_1.Tenant.findByPk(tenantId);
            if (!tenant || !tenant.encryptionKey) {
                return null;
            }
            return (0, encryption_1.decrypt)(tenant.encryptionKey, process.env.ENCRYPTION_KEY || 'default-key');
        }
        catch (error) {
            logger_1.logger.error(`Error getting tenant encryption key: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Update tenant status
     * @param tenantId Tenant ID
     * @param status New status
     * @returns Updated tenant
     */
    async updateTenantStatus(tenantId, status) {
        try {
            const tenant = await tenant_model_1.Tenant.findByPk(tenantId);
            if (!tenant) {
                return null;
            }
            // Update tenant status
            await tenant.update({ status });
            logger_1.logger.info(`Tenant status updated: ${tenant.name} (${tenant.id}) - ${status}`);
            return tenant;
        }
        catch (error) {
            logger_1.logger.error(`Error updating tenant status: ${tenantId}`, error);
            throw error;
        }
    }
}
exports.TenantService = TenantService;
exports.default = new TenantService();
