import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { Document, PaginatedResponse } from '@/types';

// Define types
interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  totalDocuments: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  totalDocuments: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async ({ 
    limit = 10, 
    offset = 0, 
    search = '',
    clientId = '',
    caseId = '',
    type = ''
  }: { 
    limit?: number; 
    offset?: number; 
    search?: string;
    clientId?: string;
    caseId?: string;
    type?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Document>>('/api/documents', {
        params: {
          limit,
          offset,
          search: search || undefined,
          clientId: clientId || undefined,
          caseId: caseId || undefined,
          type: type || undefined,
        },
      });
      
      return {
        documents: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch documents'
      );
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'document/fetchDocumentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Document>(`/api/documents/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch document'
      );
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async (documentData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<Document>('/api/documents', documentData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to upload document'
      );
    }
  }
);

export const updateDocument = createAsyncThunk(
  'document/updateDocument',
  async ({ id, documentData }: { id: string; documentData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<Document>(`/api/documents/${id}`, documentData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update document'
      );
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/documents/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete document'
      );
    }
  }
);

export const generateDocument = createAsyncThunk(
  'document/generateDocument',
  async ({ 
    templateId, 
    data 
  }: { 
    templateId: string; 
    data: Record<string, any> 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post<Document>(`/api/documents/generate`, {
        templateId,
        data,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to generate document'
      );
    }
  }
);

// Create slice
const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    clearDocumentError: (state) => {
      state.error = null;
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<{ documents: Document[]; total: number }>) => {
        state.documents = action.payload.documents;
        state.totalDocuments = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch document by ID
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action: PayloadAction<Document>) => {
        state.selectedDocument = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.documents.unshift(action.payload);
        state.totalDocuments += 1;
        state.loading = false;
        state.error = null;
        toast.success('Document uploaded successfully');
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Update document
      .addCase(updateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.documents = state.documents.map((document) =>
          document.id === action.payload.id ? action.payload : document
        );
        state.selectedDocument = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Document updated successfully');
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<string>) => {
        state.documents = state.documents.filter((document) => document.id !== action.payload);
        state.totalDocuments -= 1;
        if (state.selectedDocument?.id === action.payload) {
          state.selectedDocument = null;
        }
        state.loading = false;
        state.error = null;
        toast.success('Document deleted successfully');
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Generate document
      .addCase(generateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.documents.unshift(action.payload);
        state.totalDocuments += 1;
        state.selectedDocument = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Document generated successfully');
      })
      .addCase(generateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearDocumentError, clearSelectedDocument } = documentSlice.actions;

export const selectDocuments = (state: RootState) => state.document.documents;
export const selectSelectedDocument = (state: RootState) => state.document.selectedDocument;
export const selectTotalDocuments = (state: RootState) => state.document.totalDocuments;
export const selectDocumentLoading = (state: RootState) => state.document.loading;
export const selectDocumentError = (state: RootState) => state.document.error;

export default documentSlice.reducer;