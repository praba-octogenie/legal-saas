import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';
import { Client } from './client.model';
import { Case } from './case.model';
import { User } from './user.model';

@Table({
  tableName: 'invoices',
  timestamps: true,
})
export class Invoice extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  invoiceNumber!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  issueDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  dueDate!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded']],
    },
  })
  status!: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  subtotal!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  taxAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  totalAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  amountPaid!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'INR',
  })
  currency!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  termsAndConditions?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  clientId!: string;

  @BelongsTo(() => Client)
  client!: Client;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  createdBy!: string;

  @BelongsTo(() => User)
  creator!: User;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  items!: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
    caseId?: string;
    type: 'service' | 'expense' | 'time' | 'flat_fee' | 'other';
    date?: Date;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  payments!: {
    id: string;
    date: Date;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'upi' | 'other';
    reference?: string;
    notes?: string;
    recordedBy: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  taxes!: {
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

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  billingAddress!: {
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

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateIds(instance: Invoice) {
    // Generate IDs for items if they don't have one
    if (instance.items && instance.items.length > 0) {
      instance.items = instance.items.map(item => {
        if (!item.id) {
          return { ...item, id: uuidv4() };
        }
        return item;
      });
    }

    // Generate IDs for payments if they don't have one
    if (instance.payments && instance.payments.length > 0) {
      instance.payments = instance.payments.map(payment => {
        if (!payment.id) {
          return { ...payment, id: uuidv4() };
        }
        return payment;
      });
    }
  }
}

@Table({
  tableName: 'time_entries',
  timestamps: true,
})
export class TimeEntry extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  hours!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  rate?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  billable!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  billed!: boolean;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  invoiceId?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Case)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  caseId?: string;

  @BelongsTo(() => Case)
  case?: Case;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  clientId?: string;

  @BelongsTo(() => Client)
  client?: Client;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;
}

@Table({
  tableName: 'expenses',
  timestamps: true,
})
export class Expense extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  category!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'INR',
  })
  currency!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  billable!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  billed!: boolean;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  invoiceId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiptUrl?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Case)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  caseId?: string;

  @BelongsTo(() => Case)
  case?: Case;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  clientId?: string;

  @BelongsTo(() => Client)
  client?: Client;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;
}

export default { Invoice, TimeEntry, Expense };