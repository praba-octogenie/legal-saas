import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { Invoice, TimeEntry, Expense, PaginatedResponse } from '@/types';

// Define types
interface BillingState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  timeEntries: TimeEntry[];
  expenses: Expense[];
  totalInvoices: number;
  totalTimeEntries: number;
  totalExpenses: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: BillingState = {
  invoices: [],
  selectedInvoice: null,
  timeEntries: [],
  expenses: [],
  totalInvoices: 0,
  totalTimeEntries: 0,
  totalExpenses: 0,
  loading: false,
  error: null,
};

// Async thunks for invoices
export const fetchInvoices = createAsyncThunk(
  'billing/fetchInvoices',
  async ({ 
    limit = 10, 
    offset = 0, 
    search = '',
    clientId = '',
    status = ''
  }: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    clientId?: string;
    status?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Invoice>>('/api/billing/invoices', {
        params: {
          limit,
          offset,
          search: search || undefined,
          clientId: clientId || undefined,
          status: status || undefined,
        },
      });
      
      return {
        invoices: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch invoices'
      );
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'billing/fetchInvoiceById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Invoice>(`/api/billing/invoices/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch invoice'
      );
    }
  }
);

export const createInvoice = createAsyncThunk(
  'billing/createInvoice',
  async (invoiceData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post<Invoice>('/api/billing/invoices', invoiceData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create invoice'
      );
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'billing/updateInvoice',
  async ({ id, invoiceData }: { id: string; invoiceData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put<Invoice>(`/api/billing/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update invoice'
      );
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'billing/deleteInvoice',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/billing/invoices/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete invoice'
      );
    }
  }
);

export const recordPayment = createAsyncThunk(
  'billing/recordPayment',
  async ({ 
    invoiceId, 
    paymentData 
  }: { 
    invoiceId: string; 
    paymentData: {
      date: Date;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post<Invoice>(`/api/billing/invoices/${invoiceId}/payments`, paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to record payment'
      );
    }
  }
);

// Async thunks for time entries
export const fetchTimeEntries = createAsyncThunk(
  'billing/fetchTimeEntries',
  async ({ 
    limit = 10, 
    offset = 0, 
    clientId = '',
    caseId = '',
    userId = '',
    billable = undefined,
    billed = undefined,
    fromDate = '',
    toDate = ''
  }: { 
    limit?: number; 
    offset?: number; 
    clientId?: string;
    caseId?: string;
    userId?: string;
    billable?: boolean;
    billed?: boolean;
    fromDate?: string;
    toDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<TimeEntry>>('/api/billing/time-entries', {
        params: {
          limit,
          offset,
          clientId: clientId || undefined,
          caseId: caseId || undefined,
          userId: userId || undefined,
          billable: billable !== undefined ? billable : undefined,
          billed: billed !== undefined ? billed : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      
      return {
        timeEntries: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch time entries'
      );
    }
  }
);

export const createTimeEntry = createAsyncThunk(
  'billing/createTimeEntry',
  async (timeEntryData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post<TimeEntry>('/api/billing/time-entries', timeEntryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create time entry'
      );
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'billing/updateTimeEntry',
  async ({ id, timeEntryData }: { id: string; timeEntryData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put<TimeEntry>(`/api/billing/time-entries/${id}`, timeEntryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update time entry'
      );
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'billing/deleteTimeEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/billing/time-entries/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete time entry'
      );
    }
  }
);

// Async thunks for expenses
export const fetchExpenses = createAsyncThunk(
  'billing/fetchExpenses',
  async ({ 
    limit = 10, 
    offset = 0, 
    clientId = '',
    caseId = '',
    userId = '',
    billable = undefined,
    billed = undefined,
    fromDate = '',
    toDate = ''
  }: { 
    limit?: number; 
    offset?: number; 
    clientId?: string;
    caseId?: string;
    userId?: string;
    billable?: boolean;
    billed?: boolean;
    fromDate?: string;
    toDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Expense>>('/api/billing/expenses', {
        params: {
          limit,
          offset,
          clientId: clientId || undefined,
          caseId: caseId || undefined,
          userId: userId || undefined,
          billable: billable !== undefined ? billable : undefined,
          billed: billed !== undefined ? billed : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      
      return {
        expenses: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch expenses'
      );
    }
  }
);

export const createExpense = createAsyncThunk(
  'billing/createExpense',
  async (expenseData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<Expense>('/api/billing/expenses', expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create expense'
      );
    }
  }
);

export const updateExpense = createAsyncThunk(
  'billing/updateExpense',
  async ({ id, expenseData }: { id: string; expenseData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<Expense>(`/api/billing/expenses/${id}`, expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update expense'
      );
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'billing/deleteExpense',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/billing/expenses/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete expense'
      );
    }
  }
);

// Create slice
const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearBillingError: (state) => {
      state.error = null;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<{ invoices: Invoice[]; total: number }>) => {
        state.invoices = action.payload.invoices;
        state.totalInvoices = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch invoice by ID
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.selectedInvoice = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.invoices.unshift(action.payload);
        state.totalInvoices += 1;
        state.selectedInvoice = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Invoice created successfully');
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update invoice
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.invoices = state.invoices.map((invoice) =>
          invoice.id === action.payload.id ? action.payload : invoice
        );
        state.selectedInvoice = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Invoice updated successfully');
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action: PayloadAction<string>) => {
        state.invoices = state.invoices.filter((invoice) => invoice.id !== action.payload);
        state.totalInvoices -= 1;
        if (state.selectedInvoice?.id === action.payload) {
          state.selectedInvoice = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Invoice deleted successfully');
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Record payment
      .addCase(recordPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.invoices = state.invoices.map((invoice) =>
          invoice.id === action.payload.id ? action.payload : invoice
        );
        state.selectedInvoice = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Payment recorded successfully');
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Fetch time entries
      .addCase(fetchTimeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action: PayloadAction<{ timeEntries: TimeEntry[]; total: number }>) => {
        state.timeEntries = action.payload.timeEntries;
        state.totalTimeEntries = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create time entry
      .addCase(createTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimeEntry.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.timeEntries.unshift(action.payload);
        state.totalTimeEntries += 1;
        state.loading = false;
        state.error = null;
        toast.success('Time entry created successfully');
      })
      .addCase(createTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update time entry
      .addCase(updateTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimeEntry.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.timeEntries = state.timeEntries.map((timeEntry) =>
          timeEntry.id === action.payload.id ? action.payload : timeEntry
        );
        state.loading = false;
        state.error = null;
        toast.success('Time entry updated successfully');
      })
      .addCase(updateTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete time entry
      .addCase(deleteTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.timeEntries = state.timeEntries.filter((timeEntry) => timeEntry.id !== action.payload);
        state.totalTimeEntries -= 1;
        state.loading = false;
        state.error = null;
        toast.success('Time entry deleted successfully');
      })
      .addCase(deleteTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<{ expenses: Expense[]; total: number }>) => {
        state.expenses = action.payload.expenses;
        state.totalExpenses = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.expenses.unshift(action.payload);
        state.totalExpenses += 1;
        state.loading = false;
        state.error = null;
        toast.success('Expense created successfully');
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.expenses = state.expenses.map((expense) =>
          expense.id === action.payload.id ? action.payload : expense
        );
        state.loading = false;
        state.error = null;
        toast.success('Expense updated successfully');
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete expense
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
        state.totalExpenses -= 1;
        state.loading = false;
        state.error = null;
        toast.success('Expense deleted successfully');
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearBillingError, clearSelectedInvoice } = billingSlice.actions;

export const selectInvoices = (state: RootState) => state.billing.invoices;
export const selectSelectedInvoice = (state: RootState) => state.billing.selectedInvoice;
export const selectTimeEntries = (state: RootState) => state.billing.timeEntries;
export const selectExpenses = (state: RootState) => state.billing.expenses;
export const selectTotalInvoices = (state: RootState) => state.billing.totalInvoices;
export const selectTotalTimeEntries = (state: RootState) => state.billing.totalTimeEntries;
export const selectTotalExpenses = (state: RootState) => state.billing.totalExpenses;
export const selectBillingLoading = (state: RootState) => state.billing.loading;
export const selectBillingError = (state: RootState) => state.billing.error;

export default billingSlice.reducer;