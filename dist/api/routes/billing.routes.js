"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = __importDefault(require("../controllers/billing.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Create invoice
router.post('/invoices', billing_controller_1.default.createInvoice);
// Get all invoices
router.get('/invoices', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), billing_controller_1.default.getAllInvoices);
// Get invoice by ID
router.get('/invoices/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), billing_controller_1.default.getInvoiceById);
// Update invoice
router.put('/invoices/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), billing_controller_1.default.updateInvoice);
// Delete invoice
router.delete('/invoices/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), billing_controller_1.default.deleteInvoice);
exports.default = router;
