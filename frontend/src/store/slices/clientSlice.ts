import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { Client, ClientFormData, PaginatedResponse } from '@/types';

// Define types
interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  totalClients: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: ClientState = {
  clients: [],
  selectedClient: null,
  totalClients: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchClients = createAsyncThunk(
  'client/fetchClients',
  async ({ limit = 10, offset = 0, search = '' }: { limit?: number; offset?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Client>>('/api/clients', {
        params: {
          limit,
          offset,
          search: search || undefined,
        },
      });
      
      return {
        clients: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch clients'
      );
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'client/fetchClientById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Client>(`/api/clients/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch client'
      );
    }
  }
);

export const createClient = createAsyncThunk(
  'client/createClient',
  async (clientData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<Client>('/api/clients', clientData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create client'
      );
    }
  }
);

export const updateClient = createAsyncThunk(
  'client/updateClient',
  async ({ id, clientData }: { id: string; clientData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<Client>(`/api/clients/${id}`, clientData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update client'
      );
    }
  }
);

export const deleteClient = createAsyncThunk(
  'client/deleteClient',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/clients/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete client'
      );
    }
  }
);

export const verifyClientKyc = createAsyncThunk(
  'client/verifyClientKyc',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post<Client>(`/api/clients/${id}/verify-kyc`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to verify client KYC'
      );
    }
  }
);

// Create slice
const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    clearClientError: (state) => {
      state.error = null;
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<{ clients: Client[]; total: number }>) => {
        state.clients = action.payload.clients;
        state.totalClients = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch client by ID
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action: PayloadAction<Client>) => {
        state.selectedClient = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create client
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action: PayloadAction<Client>) => {
        state.clients.unshift(action.payload);
        state.totalClients += 1;
        state.loading = false;
        state.error = null;
        toast.success('Client created successfully');
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update client
      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action: PayloadAction<Client>) => {
        state.clients = state.clients.map((client) =>
          client.id === action.payload.id ? action.payload : client
        );
        state.selectedClient = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Client updated successfully');
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action: PayloadAction<string>) => {
        state.clients = state.clients.filter((client) => client.id !== action.payload);
        state.totalClients -= 1;
        if (state.selectedClient?.id === action.payload) {
          state.selectedClient = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Client deleted successfully');
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Verify client KYC
      .addCase(verifyClientKyc.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyClientKyc.fulfilled, (state, action: PayloadAction<Client>) => {
        state.clients = state.clients.map((client) =>
          client.id === action.payload.id ? action.payload : client
        );
        state.selectedClient = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Client KYC verified successfully');
      })
      .addCase(verifyClientKyc.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearClientError, clearSelectedClient } = clientSlice.actions;

export const selectClients = (state: RootState) => state.client.clients;
export const selectSelectedClient = (state: RootState) => state.client.selectedClient;
export const selectTotalClients = (state: RootState) => state.client.totalClients;
export const selectClientLoading = (state: RootState) => state.client.loading;
export const selectClientError = (state: RootState) => state.client.error;

export default clientSlice.reducer;