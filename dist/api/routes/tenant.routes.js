"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = __importDefault(require("../controllers/tenant.controller"));
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schema for updating tenant status
const updateStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid('active', 'inactive', 'suspended', 'trial').required(),
});
// Admin routes for tenant management
// These routes should only be accessible by system administrators
// Create a new tenant
router.post('/', auth_middleware_1.authenticateAdmin, tenant_controller_1.default.createTenant);
// Get all tenants
router.get('/', auth_middleware_1.authenticateAdmin, tenant_controller_1.default.getAllTenants);
// Get tenant by ID
router.get('/:id', auth_middleware_1.authenticateAdmin, tenant_controller_1.default.getTenantById);
// Update tenant
router.put('/:id', auth_middleware_1.authenticateAdmin, tenant_controller_1.default.updateTenant);
// Delete tenant
router.delete('/:id', auth_middleware_1.authenticateAdmin, tenant_controller_1.default.deleteTenant);
// Update tenant status
router.patch('/:id/status', auth_middleware_1.authenticateAdmin, (0, validation_1.validateBody)(updateStatusSchema), tenant_controller_1.default.updateTenantStatus);
exports.default = router;
