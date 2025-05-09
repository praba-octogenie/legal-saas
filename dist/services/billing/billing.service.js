"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const billing_model_1 = require("../../models/billing.model");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const client_model_1 = require("../../models/client.model");
const user_model_1 = require("../../models/user.model");
class BillingService {
    /**
     * Generate a unique invoice number
     * @param tenantId Tenant ID
     * @param connection Sequelize connection
     * @returns Unique invoice number
     */
    async generateInvoiceNumber(tenantId, connection) {
        const InvoiceModel = connection.model(billing_model_1.Invoice.name);
        // Get current year and month
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        // Get count of invoices for this tenant in the current month
        const count = await InvoiceModel.count({
            where: {
                tenantId,
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(`${year}-${month}-01`),
                    [sequelize_1.Op.lt]: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${parseInt(month) + 1}-01`),
                },
            },
        });
        // Generate invoice number in format: INV-YYYYMM-SEQUENCE
        const sequence = (count + 1).toString().padStart(4, '0');
        return `INV-${year}${month}-${sequence}`;
    }
    /**
     * Calculate invoice totals
     * @param items Invoice items
     * @param taxes Taxes
     * @returns Calculated totals
     */
    calculateInvoiceTotals(items, taxes) {
        // Calculate subtotal and process items
        let subtotal = 0;
        const processedItems = items.map(item => {
            const amount = item.quantity * item.unitPrice;
            subtotal += amount;
            // Calculate item tax if applicable
            const taxAmount = item.taxRate ? (amount * item.taxRate / 100) : 0;
            return {
                ...item,
                id: (0, uuid_1.v4)(),
                amount,
                taxAmount,
            };
        });
        // Calculate tax amount
        let taxAmount = 0;
        if (taxes) {
            // GST calculation
            if (taxes.gst) {
                const gstAmount = subtotal * taxes.gst.rate / 100;
                taxAmount += gstAmount;
            }
            // TDS calculation
            if (taxes.tds) {
                taxAmount += taxes.tds.amount;
            }
            // Other taxes
            if (taxes.otherTaxes && taxes.otherTaxes.length > 0) {
                taxes.otherTaxes.forEach(tax => {
                    taxAmount += tax.amount;
                });
            }
        }
        // Calculate total amount
        const totalAmount = subtotal + taxAmount;
        return {
            subtotal,
            taxAmount,
            totalAmount,
            processedItems,
        };
    }
    /**
     * Create a new invoice
     * @param invoiceData Invoice data
     * @param connection Sequelize connection
     * @returns Created invoice
     */
    async createInvoice(invoiceData, connection) {
        try {
            // Set the model to use the tenant connection
            const InvoiceModel = connection.model(billing_model_1.Invoice.name);
            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber(invoiceData.tenantId, connection);
            // Calculate totals
            const { subtotal, taxAmount, totalAmount, processedItems } = this.calculateInvoiceTotals(invoiceData.items, invoiceData.taxes);
            // Create invoice
            const invoice = await InvoiceModel.create({
                invoiceNumber,
                issueDate: invoiceData.issueDate,
                dueDate: invoiceData.dueDate,
                status: 'draft',
                subtotal,
                taxAmount,
                totalAmount,
                amountPaid: 0,
                currency: invoiceData.currency || 'INR',
                notes: invoiceData.notes,
                termsAndConditions: invoiceData.termsAndConditions,
                tenantId: invoiceData.tenantId,
                clientId: invoiceData.clientId,
                createdBy: invoiceData.createdBy,
                items: processedItems,
                payments: [],
                taxes: invoiceData.taxes || {},
                billingAddress: invoiceData.billingAddress || {},
                metadata: invoiceData.metadata || {},
            });
            logger_1.logger.info(`Invoice created: ${invoice.invoiceNumber} (${invoice.id})`);
            return invoice;
        }
        catch (error) {
            logger_1.logger.error('Error creating invoice', error);
            throw error;
        }
    }
    /**
     * Get invoice by ID
     * @param invoiceId Invoice ID
     * @param connection Sequelize connection
     * @returns Invoice
     */
    async getInvoiceById(invoiceId, connection) {
        try {
            // Set the model to use the tenant connection
            const InvoiceModel = connection.model(billing_model_1.Invoice.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
            return await InvoiceModel.findByPk(invoiceId, {
                include: [
                    { model: ClientModel, as: 'client' },
                    { model: UserModel, as: 'creator' },
                ],
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting invoice by ID: ${invoiceId}`, error);
            throw error;
        }
    }
    /**
     * Update invoice
     * @param invoiceId Invoice ID
     * @param updateData Update data
     * @param connection Sequelize connection
     * @returns Updated invoice
     */
    async updateInvoice(invoiceId, updateData, connection) {
        try {
            // Set the model to use the tenant connection
            const InvoiceModel = connection.model(billing_model_1.Invoice.name);
            const invoice = await InvoiceModel.findByPk(invoiceId);
            if (!invoice) {
                return null;
            }
            // Check if invoice can be updated
            if (['paid', 'refunded'].includes(invoice.status)) {
                throw new Error(`Invoice with status ${invoice.status} cannot be updated`);
            }
            // Process items if provided
            let subtotal = invoice.subtotal;
            let taxAmount = invoice.taxAmount;
            let totalAmount = invoice.totalAmount;
            let items = invoice.items;
            if (updateData.items) {
                const { subtotal: newSubtotal, taxAmount: newTaxAmount, totalAmount: newTotalAmount, processedItems } = this.calculateInvoiceTotals(updateData.items, updateData.taxes || invoice.taxes);
                subtotal = newSubtotal;
                taxAmount = newTaxAmount;
                totalAmount = newTotalAmount;
                items = processedItems;
            }
            // Update invoice
            await invoice.update({
                ...updateData,
                subtotal,
                taxAmount,
                totalAmount,
                items,
            });
            logger_1.logger.info(`Invoice updated: ${invoice.invoiceNumber} (${invoice.id})`);
            return invoice;
        }
        catch (error) {
            logger_1.logger.error(`Error updating invoice: ${invoiceId}`, error);
            throw error;
        }
    }
    /**
     * Delete invoice
     * @param invoiceId Invoice ID
     * @param connection Sequelize connection
     * @returns True if invoice was deleted
     */
    async deleteInvoice(invoiceId, connection) {
        try {
            // Set the model to use the tenant connection
            const InvoiceModel = connection.model(billing_model_1.Invoice.name);
            const invoice = await InvoiceModel.findByPk(invoiceId);
            if (!invoice) {
                return false;
            }
            // Check if invoice can be deleted
            if (!['draft', 'cancelled'].includes(invoice.status)) {
                throw new Error(`Invoice with status ${invoice.status} cannot be deleted`);
            }
            // Delete invoice
            await invoice.destroy();
            logger_1.logger.info(`Invoice deleted: ${invoice.invoiceNumber} (${invoice.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting invoice: ${invoiceId}`, error);
            throw error;
        }
    }
    /**
     * Get invoices by tenant ID
     * @param tenantId Tenant ID
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Invoices
     */
    async getInvoicesByTenantId(tenantId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const InvoiceModel = connection.model(billing_model_1.Invoice.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const { count, rows } = await InvoiceModel.findAndCountAll({
                where: { tenantId },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: ClientModel, as: 'client' },
                ],
            });
            return {
                invoices: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting invoices by tenant ID: ${tenantId}`, error);
            throw error;
        }
    }
}
exports.BillingService = BillingService;
exports.default = new BillingService();
