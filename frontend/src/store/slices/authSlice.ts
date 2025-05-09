import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import jwtDecode from 'jwt-decode';

import { RootState } from '../store';
import { setAuthToken } from '@/utils/auth';
import api from '@/utils/api';

// Define types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

// Define initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Check if code is running in browser environment
const isBrowser = typeof window !== 'undefined';

// Load user from token if available
const loadUserFromToken = (): User | null => {
  if (!isBrowser) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      localStorage.removeItem('token');
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };
  } catch (error) {
    if (isBrowser) {
      localStorage.removeItem('token');
    }
    return null;
  }
};

// Initialize state with user from token only in browser environment
let user = null;
let token = null;

if (isBrowser) {
  user = loadUserFromToken();
  token = localStorage.getItem('token');
  
  if (user && token) {
    initialState.isAuthenticated = true;
    initialState.user = user;
    initialState.token = token;
    setAuthToken(token);
  }
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>(
        '/users/login',
        credentials
      );
      
      const { token } = response.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setAuthToken(token);
      
      return token;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Login failed. Please try again.'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  setAuthToken(null);
});

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post<RegisterResponse>(
        '/users/register',
        credentials
      );
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Registration failed. Please try again.'
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/users/refresh-token');
      
      const { token } = response.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setAuthToken(token);
      
      return token;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to refresh token.'
      );
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<string>) => {
        const token = action.payload;
        const decoded = jwtDecode<JwtPayload>(token);
        
        state.isAuthenticated = true;
        state.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          tenantId: decoded.tenantId,
        };
        state.token = token;
        state.loading = false;
        state.error = null;
        
        toast.success('Login successful!');
      })
      .addCase(login.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = action.payload as string;
        
        toast.error(action.payload as string);
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        
        toast.info('You have been logged out.');
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action: PayloadAction<string>) => {
        const token = action.payload;
        const decoded = jwtDecode<JwtPayload>(token);
        
        state.isAuthenticated = true;
        state.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          tenantId: decoded.tenantId,
        };
        state.token = token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        
        toast.error('Your session has expired. Please log in again.');
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        
        toast.success('Registration successful! Please log in.');
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { clearError } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;