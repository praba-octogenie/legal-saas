import axios from 'axios';

// Configure axios defaults
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not a refresh token request
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('refresh-token')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const response = await axios.post(`${API_URL}/api/v1/users/refresh-token`);
        const { token } = response.data;
        
        // Update token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        
        // Update Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Configure axios for static file URLs
export const getStaticFileUrl = (path: string): string => {
  return `/static/${path}`;
};

export default api;