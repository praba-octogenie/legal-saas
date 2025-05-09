import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { CourtProceeding, PaginatedResponse } from '@/types';

// Define types
interface CourtProceedingState {
  proceedings: CourtProceeding[];
  selectedProceeding: CourtProceeding | null;
  totalProceedings: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: CourtProceedingState = {
  proceedings: [],
  selectedProceeding: null,
  totalProceedings: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchProceedings = createAsyncThunk(
  'courtProceeding/fetchProceedings',
  async ({ 
    limit = 10, 
    offset = 0, 
    search = '',
    caseId = '',
    status = '',
    fromDate = '',
    toDate = ''
  }: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    caseId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<CourtProceeding>>('/api/court-proceedings', {
        params: {
          limit,
          offset,
          search: search || undefined,
          caseId: caseId || undefined,
          status: status || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      
      return {
        proceedings: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch court proceedings'
      );
    }
  }
);

export const fetchProceedingById = createAsyncThunk(
  'courtProceeding/fetchProceedingById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<CourtProceeding>(`/api/court-proceedings/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch court proceeding'
      );
    }
  }
);

export const createProceeding = createAsyncThunk(
  'courtProceeding/createProceeding',
  async (proceedingData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<CourtProceeding>('/api/court-proceedings', proceedingData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create court proceeding'
      );
    }
  }
);

export const updateProceeding = createAsyncThunk(
  'courtProceeding/updateProceeding',
  async ({ id, proceedingData }: { id: string; proceedingData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<CourtProceeding>(`/api/court-proceedings/${id}`, proceedingData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update court proceeding'
      );
    }
  }
);

export const deleteProceeding = createAsyncThunk(
  'courtProceeding/deleteProceeding',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/court-proceedings/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete court proceeding'
      );
    }
  }
);

export const updateProceedingStatus = createAsyncThunk(
  'courtProceeding/updateProceedingStatus',
  async ({ 
    id, 
    status, 
    notes, 
    outcome, 
    nextDate 
  }: { 
    id: string; 
    status: string; 
    notes?: string; 
    outcome?: string; 
    nextDate?: string; 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.patch<CourtProceeding>(`/api/court-proceedings/${id}/status`, {
        status,
        notes,
        outcome,
        nextDate,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update court proceeding status'
      );
    }
  }
);

// Create slice
const courtProceedingSlice = createSlice({
  name: 'courtProceeding',
  initialState,
  reducers: {
    clearProceedingError: (state) => {
      state.error = null;
    },
    clearSelectedProceeding: (state) => {
      state.selectedProceeding = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch proceedings
      .addCase(fetchProceedings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProceedings.fulfilled, (state, action: PayloadAction<{ proceedings: CourtProceeding[]; total: number }>) => {
        state.proceedings = action.payload.proceedings;
        state.totalProceedings = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProceedings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch proceeding by ID
      .addCase(fetchProceedingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProceedingById.fulfilled, (state, action: PayloadAction<CourtProceeding>) => {
        state.selectedProceeding = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProceedingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create proceeding
      .addCase(createProceeding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProceeding.fulfilled, (state, action: PayloadAction<CourtProceeding>) => {
        state.proceedings.unshift(action.payload);
        state.totalProceedings += 1;
        state.loading = false;
        state.error = null;
        toast.success('Court proceeding created successfully');
      })
      .addCase(createProceeding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update proceeding
      .addCase(updateProceeding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProceeding.fulfilled, (state, action: PayloadAction<CourtProceeding>) => {
        state.proceedings = state.proceedings.map((proceeding) =>
          proceeding.id === action.payload.id ? action.payload : proceeding
        );
        state.selectedProceeding = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Court proceeding updated successfully');
      })
      .addCase(updateProceeding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete proceeding
      .addCase(deleteProceeding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProceeding.fulfilled, (state, action: PayloadAction<string>) => {
        state.proceedings = state.proceedings.filter((proceeding) => proceeding.id !== action.payload);
        state.totalProceedings -= 1;
        if (state.selectedProceeding?.id === action.payload) {
          state.selectedProceeding = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Court proceeding deleted successfully');
      })
      .addCase(deleteProceeding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update proceeding status
      .addCase(updateProceedingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProceedingStatus.fulfilled, (state, action: PayloadAction<CourtProceeding>) => {
        state.proceedings = state.proceedings.map((proceeding) =>
          proceeding.id === action.payload.id ? action.payload : proceeding
        );
        state.selectedProceeding = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Court proceeding status updated successfully');
      })
      .addCase(updateProceedingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearProceedingError, clearSelectedProceeding } = courtProceedingSlice.actions;

export const selectProceedings = (state: RootState) => state.courtProceeding.proceedings;
export const selectSelectedProceeding = (state: RootState) => state.courtProceeding.selectedProceeding;
export const selectTotalProceedings = (state: RootState) => state.courtProceeding.totalProceedings;
export const selectProceedingLoading = (state: RootState) => state.courtProceeding.loading;
export const selectProceedingError = (state: RootState) => state.courtProceeding.error;

export default courtProceedingSlice.reducer;