"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenantFeature = exports.requireTenantPlan = exports.requireTenant = exports.resolveTenant = void 0;
const tenant_service_1 = __importDefault(require("../services/tenant-management/tenant.service"));
const logger_1 = require("../utils/logger");
const config_1 = require("../database/config");
/**
 * Middleware to resolve tenant from hostname
 * @param req Request
 * @param res Response
 * @param next Next function
 */
const resolveTenant = async (req, res, next) => {
    try {
        // Skip tenant resolution for admin API routes
        if (req.path.startsWith('/api/admin')) {
            return next();
        }
        // Get hostname from request
        const hostname = req.hostname;
        // Skip for localhost or IP addresses (used for admin access)
        if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
            return next();
        }
        let tenant;
        // Check if hostname is a custom domain
        tenant = await tenant_service_1.default.getTenantByCustomDomain(hostname);
        // If not a custom domain, check if it's a subdomain
        if (!tenant) {
            // Extract subdomain from hostname
            const parts = hostname.split('.');
            // If hostname has at least 3 parts (subdomain.domain.tld)
            if (parts.length >= 3) {
                const subdomain = parts[0];
                tenant = await tenant_service_1.default.getTenantBySubdomain(subdomain);
            }
        }
        // If tenant not found, return 404
        if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }
        // Check if tenant is active
        if (tenant.status === 'inactive' || tenant.status === 'suspended') {
            res.status(403).json({ error: 'Tenant is not active' });
            return;
        }
        // Set tenant in request
        req.tenant = tenant;
        // Get tenant database connection
        req.tenantConnection = await (0, config_1.getTenantConnection)(tenant.id);
        next();
    }
    catch (error) {
        logger_1.logger.error('Error resolving tenant', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.resolveTenant = resolveTenant;
/**
 * Middleware to require tenant
 * @param req Request
 * @param res Response
 * @param next Next function
 */
const requireTenant = (req, res, next) => {
    if (!req.tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
    }
    next();
};
exports.requireTenant = requireTenant;
/**
 * Middleware to check tenant plan
 * @param requiredPlan Required plan
 * @returns Middleware
 */
const requireTenantPlan = (requiredPlan) => {
    return (req, res, next) => {
        if (!req.tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }
        const planHierarchy = {
            basic: 1,
            professional: 2,
            enterprise: 3,
        };
        const tenantPlan = req.tenant.plan;
        if (planHierarchy[tenantPlan] < planHierarchy[requiredPlan]) {
            res.status(403).json({
                error: 'Plan upgrade required',
                requiredPlan,
                currentPlan: req.tenant.plan,
            });
            return;
        }
        next();
    };
};
exports.requireTenantPlan = requireTenantPlan;
/**
 * Middleware to check tenant feature
 * @param feature Feature to check
 * @returns Middleware
 */
const requireTenantFeature = (feature) => {
    return (req, res, next) => {
        if (!req.tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
        }
        // Check if feature is enabled
        const featureEnabled = req.tenant.settings?.features?.[feature];
        if (!featureEnabled) {
            res.status(403).json({
                error: 'Feature not enabled',
                feature,
            });
            return;
        }
        next();
    };
};
exports.requireTenantFeature = requireTenantFeature;
exports.default = {
    resolveTenant: exports.resolveTenant,
    requireTenant: exports.requireTenant,
    requireTenantPlan: exports.requireTenantPlan,
    requireTenantFeature: exports.requireTenantFeature,
};
