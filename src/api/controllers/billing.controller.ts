import { Request, Response } from 'express';
import billingService from '../../services/billing/billing.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';

// Invoice validation schemas
const createInvoiceSchema = Joi.object({
  issueDate: Joi.date().required(),
  dueDate: Joi.date().required(),
  clientId: Joi.string().uuid().required(),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().required().min(0),
      unitPrice: Joi.number().required().min(0),
      taxRate: Joi.number().optional().min(0),
      caseId: Joi.string().uuid().optional(),
      type: Joi.string().valid('service', 'expense', 'time', 'flat_fee', 'other').required(),
      date: Joi.date().optional(),
    })
  ).required().min(1),
  notes: Joi.string().optional(),
  termsAndConditions: Joi.string().optional(),
  taxes: Joi.object({
    gst: Joi.object({
      cgst: Joi.number().optional().min(0),
      sgst: Joi.number().optional().min(0),
      igst: Joi.number().optional().min(0),
      rate: Joi.number().required().min(0),
    }).optional(),
    tds: Joi.object({
      rate: Joi.number().required().min(0),
      amount: Joi.number().required().min(0),
    }).optional(),
    otherTaxes: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        rate: Joi.number().required().min(0),
        amount: Joi.number().required().min(0),
      })
    ).optional(),
  }).optional(),
  billingAddress: Joi.object({
    name: Joi.string().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    country: Joi.string().optional(),
    gstin: Joi.string().optional(),
    pan: Joi.string().optional(),
  }).optional(),
  currency: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

const updateInvoiceSchema = Joi.object({
  issueDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  status: Joi.string().valid('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded').optional(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().optional(),
      description: Joi.string().required(),
      quantity: Joi.number().required().min(0),
      unitPrice: Joi.number().required().min(0),
      taxRate: Joi.number().optional().min(0),
      caseId: Joi.string().uuid().optional(),
      type: Joi.string().valid('service', 'expense', 'time', 'flat_fee', 'other').required(),
      date: Joi.date().optional(),
    })
  ).optional().min(1),
  notes: Joi.string().optional(),
  termsAndConditions: Joi.string().optional(),
  taxes: Joi.object({
    gst: Joi.object({
      cgst: Joi.number().optional().min(0),
      sgst: Joi.number().optional().min(0),
      igst: Joi.number().optional().min(0),
      rate: Joi.number().required().min(0),
    }).optional(),
    tds: Joi.object({
      rate: Joi.number().required().min(0),
      amount: Joi.number().required().min(0),
    }).optional(),
    otherTaxes: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        rate: Joi.number().required().min(0),
        amount: Joi.number().required().min(0),
      })
    ).optional(),
  }).optional(),
  billingAddress: Joi.object({
    name: Joi.string().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    country: Joi.string().optional(),
    gstin: Joi.string().optional(),
    pan: Joi.string().optional(),
  }).optional(),
  currency: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

const recordPaymentSchema = Joi.object({
  date: Joi.date().required(),
  amount: Joi.number().required().min(0),
  method: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card', 'upi', 'other').required(),
  reference: Joi.string().optional(),
  notes: Joi.string().optional(),
});

export class BillingController {
  /**
   * Create a new invoice
   * @param req Request
   * @param res Response
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createInvoiceSchema, req.body);
      
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
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Create invoice
      const invoice = await billingService.createInvoice({
        ...(value as any),
        tenantId: req.tenant.id,
        createdBy: userId,
      }, req.tenantConnection);
      
      res.status(201).json(invoice);
    } catch (error) {
      logger.error('Error creating invoice', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get invoice by ID
   * @param req Request
   * @param res Response
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get invoice
      const invoice = await billingService.getInvoiceById(id, req.tenantConnection);
      
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      
      res.status(200).json(invoice);
    } catch (error) {
      logger.error('Error getting invoice', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update invoice
   * @param req Request
   * @param res Response
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateInvoiceSchema, req.body);
      
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
      const invoice = await billingService.updateInvoice(
        id,
        value as any,
        req.tenantConnection
      );
      
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      
      res.status(200).json(invoice);
    } catch (error) {
      logger.error('Error updating invoice', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete invoice
   * @param req Request
   * @param res Response
   */
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Delete invoice
      const deleted = await billingService.deleteInvoice(id, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting invoice', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all invoices
   * @param req Request
   * @param res Response
   */
  async getAllInvoices(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get invoices
      const result = await billingService.getInvoicesByTenantId(
        req.tenant.id,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting invoices', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new BillingController();