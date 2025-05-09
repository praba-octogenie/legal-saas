import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';

// Define types
interface LegalResearch {
  id: string;
  title: string;
  query: string;
  results: {
    source: string;
    citations: {
      id: string;
      title: string;
      court: string;
      date: string;
      citation: string;
      url: string;
      relevance: number;
      snippet: string;
    }[];
    statutes: {
      id: string;
      title: string;
      act: string;
      section: string;
      content: string;
      url: string;
      relevance: number;
    }[];
  };
  notes?: string;
  caseId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  id: string;
  title: string;
  court?: string;
  date?: string;
  citation?: string;
  act?: string;
  section?: string;
  content: string;
  url: string;
  type: 'case' | 'statute' | 'article';
  relevance: number;
  snippet?: string;
}

interface LegalResearchState {
  researches: LegalResearch[];
  selectedResearch: LegalResearch | null;
  searchResults: SearchResult[];
  totalResearches: number;
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
}

// Define initial state
const initialState: LegalResearchState = {
  researches: [],
  selectedResearch: null,
  searchResults: [],
  totalResearches: 0,
  loading: false,
  searchLoading: false,
  error: null,
};

// Async thunks
export const fetchResearches = createAsyncThunk(
  'legalResearch/fetchResearches',
  async ({ 
    limit = 10, 
    offset = 0, 
    search = '',
    caseId = ''
  }: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    caseId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ researches: LegalResearch[]; total: number }>('/api/legal-research', {
        params: {
          limit,
          offset,
          search: search || undefined,
          caseId: caseId || undefined,
        },
      });
      
      return {
        researches: response.data.researches,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch legal researches'
      );
    }
  }
);

export const fetchResearchById = createAsyncThunk(
  'legalResearch/fetchResearchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<LegalResearch>(`/api/legal-research/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch legal research'
      );
    }
  }
);

export const createResearch = createAsyncThunk(
  'legalResearch/createResearch',
  async (researchData: { title: string; query: string; caseId?: string; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post<LegalResearch>('/api/legal-research', researchData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create legal research'
      );
    }
  }
);

export const updateResearch = createAsyncThunk(
  'legalResearch/updateResearch',
  async ({ id, researchData }: { id: string; researchData: { title?: string; notes?: string } }, { rejectWithValue }) => {
    try {
      const response = await axios.put<LegalResearch>(`/api/legal-research/${id}`, researchData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update legal research'
      );
    }
  }
);

export const deleteResearch = createAsyncThunk(
  'legalResearch/deleteResearch',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/legal-research/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete legal research'
      );
    }
  }
);

export const searchLegalDatabase = createAsyncThunk(
  'legalResearch/searchLegalDatabase',
  async ({ 
    query, 
    sources = ['scc', 'manupatra', 'indiankanoon'], 
    filters = {}
  }: { 
    query: string; 
    sources?: string[]; 
    filters?: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ results: SearchResult[] }>('/api/legal-research/search', {
        query,
        sources,
        filters,
      });
      
      return response.data.results;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to search legal database'
      );
    }
  }
);

// Create slice
const legalResearchSlice = createSlice({
  name: 'legalResearch',
  initialState,
  reducers: {
    clearResearchError: (state) => {
      state.error = null;
    },
    clearSelectedResearch: (state) => {
      state.selectedResearch = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch researches
      .addCase(fetchResearches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResearches.fulfilled, (state, action: PayloadAction<{ researches: LegalResearch[]; total: number }>) => {
        state.researches = action.payload.researches;
        state.totalResearches = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchResearches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch research by ID
      .addCase(fetchResearchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResearchById.fulfilled, (state, action: PayloadAction<LegalResearch>) => {
        state.selectedResearch = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchResearchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create research
      .addCase(createResearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createResearch.fulfilled, (state, action: PayloadAction<LegalResearch>) => {
        state.researches.unshift(action.payload);
        state.totalResearches += 1;
        state.selectedResearch = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Legal research created successfully');
      })
      .addCase(createResearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update research
      .addCase(updateResearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResearch.fulfilled, (state, action: PayloadAction<LegalResearch>) => {
        state.researches = state.researches.map((research) =>
          research.id === action.payload.id ? action.payload : research
        );
        state.selectedResearch = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Legal research updated successfully');
      })
      .addCase(updateResearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete research
      .addCase(deleteResearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResearch.fulfilled, (state, action: PayloadAction<string>) => {
        state.researches = state.researches.filter((research) => research.id !== action.payload);
        state.totalResearches -= 1;
        if (state.selectedResearch?.id === action.payload) {
          state.selectedResearch = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Legal research deleted successfully');
      })
      .addCase(deleteResearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Search legal database
      .addCase(searchLegalDatabase.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchLegalDatabase.fulfilled, (state, action: PayloadAction<SearchResult[]>) => {
        state.searchResults = action.payload;
        state.searchLoading = false;
        state.error = null;
      })
      .addCase(searchLegalDatabase.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearResearchError, clearSelectedResearch, clearSearchResults } = legalResearchSlice.actions;

export const selectResearches = (state: RootState) => state.legalResearch.researches;
export const selectSelectedResearch = (state: RootState) => state.legalResearch.selectedResearch;
export const selectSearchResults = (state: RootState) => state.legalResearch.searchResults;
export const selectTotalResearches = (state: RootState) => state.legalResearch.totalResearches;
export const selectResearchLoading = (state: RootState) => state.legalResearch.loading;
export const selectSearchLoading = (state: RootState) => state.legalResearch.searchLoading;
export const selectResearchError = (state: RootState) => state.legalResearch.error;

export default legalResearchSlice.reducer;