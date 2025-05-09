"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_service_1 = __importDefault(require("../../services/billing/billing.service"));
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("../../utils/validation");
// Invoice validation schemas
const createInvoiceSchema = joi_1.default.object({
    issueDate: joi_1.default.date().required(),
    dueDate: joi_1.default.date().required(),
    clientId: joi_1.default.string().uuid().required(),
    items: joi_1.default.array().items(joi_1.default.object({
        description: joi_1.default.string().required(),
        quantity: joi_1.default.number().required().min(0),
        unitPrice: joi_1.default.number().required().min(0),
        taxRate: joi_1.default.number().optional().min(0),
        caseId: joi_1.default.string().uuid().optional(),
        type: joi_1.default.string().valid('service', 'expense', 'time', 'flat_fee', 'other').required(),
        date: joi_1.default.date().optional(),
    })).required().min(1),
    notes: joi_1.default.string().optional(),
    termsAndConditions: joi_1.default.string().optional(),
    taxes: joi_1.default.object({
        gst: joi_1.default.object({
            cgst: joi_1.default.number().optional().min(0),
            sgst: joi_1.default.number().optional().min(0),
            igst: joi_1.default.number().optional().min(0),
            rate: joi_1.default.number().required().min(0),
        }).optional(),
        tds: joi_1.default.object({
            rate: joi_1.default.number().required().min(0),
            amount: joi_1.default.number().required().min(0),
        }).optional(),
        otherTaxes: joi_1.default.array().items(joi_1.default.object({
            name: joi_1.default.string().required(),
            rate: joi_1.default.number().required().min(0),
            amount: joi_1.default.number().required().min(0),
        })).optional(),
    }).optional(),
    billingAddress: joi_1.default.object({
        name: joi_1.default.string().optional(),
        addressLine1: joi_1.default.string().optional(),
        addressLine2: joi_1.default.string().optional(),
        city: joi_1.default.string().optional(),
        state: joi_1.default.string().optional(),
        postalCode: joi_1.default.string().optional(),
        country: joi_1.default.string().optional(),
        gstin: joi_1.default.string().optional(),
        pan: joi_1.default.string().optional(),
    }).optional(),
    currency: joi_1.default.string().optional(),
    metadata: joi_1.default.object().optional(),
});
const updateInvoiceSchema = joi_1.default.object({
    issueDate: joi_1.default.date().optional(),
    dueDate: joi_1.default.date().optional(),
    status: joi_1.default.string().valid('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded').optional(),
    items: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid().optional(),
        description: joi_1.default.string().required(),
        quantity: joi_1.default.number().required().min(0),
        unitPrice: joi_1.default.number().required().min(0),
        taxRate: joi_1.default.number().optional().min(0),
        caseId: joi_1.default.string().uuid().optional(),
        type: joi_1.default.string().valid('service', 'expense', 'time', 'flat_fee', 'other').required(),
        date: joi_1.default.date().optional(),
    })).optional().min(1),
    notes: joi_1.default.string().optional(),
    termsAndConditions: joi_1.default.string().optional(),
    taxes: joi_1.default.object({
        gst: joi_1.default.object({
            cgst: joi_1.default.number().optional().min(0),
            sgst: joi_1.default.number().optional().min(0),
            igst: joi_1.default.number().optional().min(0),
            rate: joi_1.default.number().required().min(0),
        }).optional(),
        tds: joi_1.default.object({
            rate: joi_1.default.number().required().min(0),
            amount: joi_1.default.number().required().min(0),
        }).optional(),
        otherTaxes: joi_1.default.array().items(joi_1.default.object({
            name: joi_1.default.string().required(),
            rate: joi_1.default.number().required().min(0),
            amount: joi_1.default.number().required().min(0),
        })).optional(),
    }).optional(),
    billingAddress: joi_1.default.object({
        name: joi_1.default.string().optional(),
        addressLine1: joi_1.default.string().optional(),
        addressLine2: joi_1.default.string().optional(),
        city: joi_1.default.string().optional(),
        state: joi_1.default.string().optional(),
        postalCode: joi_1.default.string().optional(),
        country: joi_1.default.string().optional(),
        gstin: joi_1.default.string().optional(),
        pan: joi_1.default.string().optional(),
    }).optional(),
    currency: joi_1.default.string().optional(),
    metadata: joi_1.default.object().optional(),
});
const recordPaymentSchema = joi_1.default.object({
    date: joi_1.default.date().required(),
    amount: joi_1.default.number().required().min(0),
    method: joi_1.default.string().valid('cash', 'bank_transfer', 'check', 'credit_card', 'upi', 'other').required(),
    reference: joi_1.default.string().optional(),
    notes: joi_1.default.string().optional(),
});
class BillingController {
    /**
     * Create a new invoice
     * @param req Request
     * @param res Response
     */
    async createInvoice(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(createInvoiceSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Create invoice
            const invoice = await billing_service_1.default.createInvoice({
                ...value,
                tenantId: req.tenant.id,
                createdBy: userId,
            }, req.tenantConnection);
            res.status(201).json(invoice);
        }
        catch (error) {
            logger_1.logger.error('Error creating invoice', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get invoice by ID
     * @param req Request
     * @param res Response
     */
    async getInvoiceById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get invoice
            const invoice = await billing_service_1.default.getInvoiceById(id, req.tenantConnection);
            if (!invoice) {
                res.status(404).json({ error: 'Invoice not found' });
                return;
            }
            res.status(200).json(invoice);
        }
        catch (error) {
            logger_1.logger.error('Error getting invoice', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update invoice
     * @param req Request
     * @param res Response
     */
    async updateInvoice(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateSchema)(updateInvoiceSchema, req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update invoice
            const invoice = await billing_service_1.default.updateInvoice(id, value, req.tenantConnection);
            if (!invoice) {
                res.status(404).json({ error: 'Invoice not found' });
                return;
            }
            res.status(200).json(invoice);
        }
        catch (error) {
            logger_1.logger.error('Error updating invoice', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete invoice
     * @param req Request
     * @param res Response
     */
    async deleteInvoice(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Delete invoice
            const deleted = await billing_service_1.default.deleteInvoice(id, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Invoice not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting invoice', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all invoices
     * @param req Request
     * @param res Response
     */
    async getAllInvoices(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get invoices
            const result = await billing_service_1.default.getInvoicesByTenantId(req.tenant.id, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting invoices', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.BillingController = BillingController;
exports.default = new BillingController();
