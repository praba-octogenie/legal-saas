import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { Case, PaginatedResponse } from '@/types';

// Define types
interface CaseState {
  cases: Case[];
  selectedCase: Case | null;
  totalCases: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: CaseState = {
  cases: [],
  selectedCase: null,
  totalCases: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCases = createAsyncThunk(
  'case/fetchCases',
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
      const response = await axios.get<PaginatedResponse<Case>>('/api/cases', {
        params: {
          limit,
          offset,
          search: search || undefined,
          clientId: clientId || undefined,
          status: status || undefined,
        },
      });
      
      return {
        cases: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch cases'
      );
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  'case/fetchCaseById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Case>(`/api/cases/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch case'
      );
    }
  }
);

export const createCase = createAsyncThunk(
  'case/createCase',
  async (caseData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<Case>('/api/cases', caseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create case'
      );
    }
  }
);

export const updateCase = createAsyncThunk(
  'case/updateCase',
  async ({ id, caseData }: { id: string; caseData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<Case>(`/api/cases/${id}`, caseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update case'
      );
    }
  }
);

export const deleteCase = createAsyncThunk(
  'case/deleteCase',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/cases/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete case'
      );
    }
  }
);

// Create slice
const caseSlice = createSlice({
  name: 'case',
  initialState,
  reducers: {
    clearCaseError: (state) => {
      state.error = null;
    },
    clearSelectedCase: (state) => {
      state.selectedCase = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
      .addCase(fetchCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action: PayloadAction<{ cases: Case[]; total: number }>) => {
        state.cases = action.payload.cases;
        state.totalCases = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch case by ID
      .addCase(fetchCaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (state, action: PayloadAction<Case>) => {
        state.selectedCase = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create case
      .addCase(createCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCase.fulfilled, (state, action: PayloadAction<Case>) => {
        state.cases.unshift(action.payload);
        state.totalCases += 1;
        state.loading = false;
        state.error = null;
        toast.success('Case created successfully');
      })
      .addCase(createCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update case
      .addCase(updateCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCase.fulfilled, (state, action: PayloadAction<Case>) => {
        state.cases = state.cases.map((caseItem) =>
          caseItem.id === action.payload.id ? action.payload : caseItem
        );
        state.selectedCase = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Case updated successfully');
      })
      .addCase(updateCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete case
      .addCase(deleteCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCase.fulfilled, (state, action: PayloadAction<string>) => {
        state.cases = state.cases.filter((caseItem) => caseItem.id !== action.payload);
        state.totalCases -= 1;
        if (state.selectedCase?.id === action.payload) {
          state.selectedCase = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Case deleted successfully');
      })
      .addCase(deleteCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearCaseError, clearSelectedCase } = caseSlice.actions;

export const selectCases = (state: RootState) => state.case.cases;
export const selectSelectedCase = (state: RootState) => state.case.selectedCase;
export const selectTotalCases = (state: RootState) => state.case.totalCases;
export const selectCaseLoading = (state: RootState) => state.case.loading;
export const selectCaseError = (state: RootState) => state.case.error;

export default caseSlice.reducer;