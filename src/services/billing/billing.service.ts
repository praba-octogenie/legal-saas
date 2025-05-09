import { Invoice, TimeEntry, Expense } from '../../models/billing.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, Op } from 'sequelize';
import { Client } from '../../models/client.model';
import { Case } from '../../models/case.model';
import { User } from '../../models/user.model';

export interface CreateInvoiceDto {
  issueDate: Date;
  dueDate: Date;
  clientId: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    caseId?: string;
    type: 'service' | 'expense' | 'time' | 'flat_fee' | 'other';
    date?: Date;
  }[];
  notes?: string;
  termsAndConditions?: string;
  tenantId: string;
  createdBy: string;
  taxes?: {
    gst?: {
      cgst?: number;
      sgst?: number;
      igst?: number;
      rate: number;
    };
    tds?: {
      rate: number;
      amount: number;
    };
    otherTaxes?: {
      name: string;
      rate: number;
      amount: number;
    }[];
  };
  billingAddress?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstin?: string;
    pan?: string;
  };
  currency?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceDto {
  issueDate?: Date;
  dueDate?: Date;
  status?: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  items?: {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    caseId?: string;
    type: 'service' | 'expense' | 'time' | 'flat_fee' | 'other';
    date?: Date;
  }[];
  notes?: string;
  termsAndConditions?: string;
  taxes?: {
    gst?: {
      cgst?: number;
      sgst?: number;
      igst?: number;
      rate: number;
    };
    tds?: {
      rate: number;
      amount: number;
    };
    otherTaxes?: {
      name: string;
      rate: number;
      amount: number;
    }[];
  };
  billingAddress?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstin?: string;
    pan?: string;
  };
  currency?: string;
  metadata?: Record<string, any>;
}

export interface RecordPaymentDto {
  date: Date;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'upi' | 'other';
  reference?: string;
  notes?: string;
}

export interface CreateTimeEntryDto {
  date: Date;
  hours: number;
  description: string;
  rate?: number;
  billable?: boolean;
  caseId?: string;
  clientId?: string;
  tenantId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface UpdateTimeEntryDto {
  date?: Date;
  hours?: number;
  description?: string;
  rate?: number;
  billable?: boolean;
  billed?: boolean;
  invoiceId?: string;
  caseId?: string;
  clientId?: string;
  metadata?: Record<string, any>;
}

export interface CreateExpenseDto {
  date: Date;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  billable?: boolean;
  caseId?: string;
  clientId?: string;
  receiptUrl?: string;
  tenantId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface UpdateExpenseDto {
  date?: Date;
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  billable?: boolean;
  billed?: boolean;
  invoiceId?: string;
  caseId?: string;
  clientId?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

export class BillingService {
  /**
   * Generate a unique invoice number
   * @param tenantId Tenant ID
   * @param connection Sequelize connection
   * @returns Unique invoice number
   */
  private async generateInvoiceNumber(tenantId: string, connection: Sequelize): Promise<string> {
    const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
    
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of invoices for this tenant in the current month
    const count = await InvoiceModel.count({
      where: {
        tenantId,
        createdAt: {
          [Op.gte]: new Date(`${year}-${month}-01`),
          [Op.lt]: new Date(month === '12' ? `${year + 1}-01-01` : `${year}-${parseInt(month) + 1}-01`),
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
  private calculateInvoiceTotals(
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
      caseId?: string;
      type: 'service' | 'expense' | 'time' | 'flat_fee' | 'other';
      date?: Date;
    }[],
    taxes?: {
      gst?: {
        cgst?: number;
        sgst?: number;
        igst?: number;
        rate: number;
      };
      tds?: {
        rate: number;
        amount: number;
      };
      otherTaxes?: {
        name: string;
        rate: number;
        amount: number;
      }[];
    }
  ): { subtotal: number; taxAmount: number; totalAmount: number; processedItems: any[] } {
    // Calculate subtotal and process items
    let subtotal = 0;
    const processedItems = items.map(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      
      // Calculate item tax if applicable
      const taxAmount = item.taxRate ? (amount * item.taxRate / 100) : 0;
      
      return {
        ...item,
        id: uuidv4(),
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
  async createInvoice(invoiceData: CreateInvoiceDto, connection: Sequelize): Promise<Invoice> {
    try {
      // Set the model to use the tenant connection
      const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(invoiceData.tenantId, connection);
      
      // Calculate totals
      const { subtotal, taxAmount, totalAmount, processedItems } = this.calculateInvoiceTotals(
        invoiceData.items,
        invoiceData.taxes
      );
      
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
      
      logger.info(`Invoice created: ${invoice.invoiceNumber} (${invoice.id})`);
      
      return invoice;
    } catch (error) {
      logger.error('Error creating invoice', error);
      throw error;
    }
  }
  
  /**
   * Get invoice by ID
   * @param invoiceId Invoice ID
   * @param connection Sequelize connection
   * @returns Invoice
   */
  async getInvoiceById(invoiceId: string, connection: Sequelize): Promise<Invoice | null> {
    try {
      // Set the model to use the tenant connection
      const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      return await InvoiceModel.findByPk(invoiceId, {
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'creator' },
        ],
      }) as Invoice | null;
    } catch (error) {
      logger.error(`Error getting invoice by ID: ${invoiceId}`, error);
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
  async updateInvoice(
    invoiceId: string,
    updateData: UpdateInvoiceDto,
    connection: Sequelize
  ): Promise<Invoice | null> {
    try {
      // Set the model to use the tenant connection
      const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
      
      const invoice = await InvoiceModel.findByPk(invoiceId) as Invoice | null;
      
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
        const { subtotal: newSubtotal, taxAmount: newTaxAmount, totalAmount: newTotalAmount, processedItems } = 
          this.calculateInvoiceTotals(updateData.items, updateData.taxes || invoice.taxes);
        
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
      
      logger.info(`Invoice updated: ${invoice.invoiceNumber} (${invoice.id})`);
      
      return invoice;
    } catch (error) {
      logger.error(`Error updating invoice: ${invoiceId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete invoice
   * @param invoiceId Invoice ID
   * @param connection Sequelize connection
   * @returns True if invoice was deleted
   */
  async deleteInvoice(invoiceId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
      
      const invoice = await InvoiceModel.findByPk(invoiceId) as Invoice | null;
      
      if (!invoice) {
        return false;
      }
      
      // Check if invoice can be deleted
      if (!['draft', 'cancelled'].includes(invoice.status)) {
        throw new Error(`Invoice with status ${invoice.status} cannot be deleted`);
      }
      
      // Delete invoice
      await invoice.destroy();
      
      logger.info(`Invoice deleted: ${invoice.invoiceNumber} (${invoice.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting invoice: ${invoiceId}`, error);
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
  async getInvoicesByTenantId(
    tenantId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ invoices: Invoice[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const InvoiceModel = connection.model(Invoice.name) as typeof Invoice;
      const ClientModel = connection.model(Client.name) as typeof Client;
      
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
        invoices: rows as Invoice[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting invoices by tenant ID: ${tenantId}`, error);
      throw error;
    }
  }
}

export default new BillingService();