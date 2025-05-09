// Common types used throughout the application

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  category: string;
  kycVerified: boolean;
  contactInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    alternatePhone?: string;
    alternateEmail?: string;
  };
  kycDetails: {
    idType?: string;
    idNumber?: string;
    verificationDate?: string;
    verifiedBy?: string;
    documents?: Document[];
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  category: string;
  kycVerified?: boolean;
  contactInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    alternatePhone?: string;
    alternateEmail?: string;
  };
  kycDetails: {
    idType?: string;
    idNumber?: string;
    documents?: File[];
  };
  notes?: string;
}

// Case types
export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: string;
  stage?: string;
  type?: string;
  description?: string;
  clientId: string;
  client?: Client;
  nextHearingDate?: string;
  filingDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Document types
export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  version: number;
  caseId?: string;
  clientId?: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

// Court Proceeding types
export interface CourtProceeding {
  id: string;
  caseId: string;
  case?: Case;
  date: string;
  time: string;
  court: string;
  judge?: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'adjourned' | 'cancelled';
  notes?: string;
  outcome?: string;
  nextDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Billing types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
  client?: Client;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  items: InvoiceItem[];
  payments: Payment[];
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  caseId?: string;
  type: 'service' | 'expense' | 'time' | 'flat_fee' | 'other';
  date?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'upi' | 'other';
  reference?: string;
  notes?: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  rate?: number;
  amount?: number;
  billable: boolean;
  billed: boolean;
  invoiceId?: string;
  caseId?: string;
  clientId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  billable: boolean;
  billed: boolean;
  invoiceId?: string;
  caseId?: string;
  clientId?: string;
  receiptUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Communication types
export interface Message {
  id: string;
  content: string;
  contentType: 'text' | 'html' | 'markdown';
  messageType: 'chat' | 'email' | 'sms' | 'notification';
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  isSystemMessage: boolean;
  attachments?: string[];
  senderId: string;
  sender?: User;
  recipientId?: string;
  recipient?: User;
  clientId?: string;
  client?: Client;
  caseId?: string;
  case?: Case;
  conversationId?: string;
  conversation?: Conversation;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
  type: 'direct' | 'group' | 'case' | 'client';
  participants: string[];
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'unread' | 'read' | 'archived';
  link?: string;
  action?: string;
  userId: string;
  user?: User;
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalClients: number;
  totalCases: number;
  totalDocuments: number;
  totalHearings: number;
  totalInvoices: number;
  recentCases: {
    id: string;
    title: string;
    caseNumber: string;
    court: string;
    nextHearingDate: string | null;
    status: string;
  }[];
  upcomingHearings: {
    id: string;
    caseId: string;
    caseTitle: string;
    court: string;
    date: string;
    time: string;
    purpose: string;
  }[];
  casesByType: {
    type: string;
    count: number;
  }[];
  casesByStatus: {
    status: string;
    count: number;
  }[];
  revenueByMonth: {
    month: string;
    amount: number;
  }[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}