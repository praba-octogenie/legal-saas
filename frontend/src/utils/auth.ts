import axios from 'axios';

/**
 * Set the authentication token in axios headers
 * @param token JWT token or null to remove token
 */
export const setAuthToken = (token: string | null): void => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

/**
 * Check if the user has the required role
 * @param userRole Current user's role
 * @param requiredRoles Array of roles that have access
 * @returns Boolean indicating if user has access
 */
export const hasRole = (
  userRole: string | undefined,
  requiredRoles: string[]
): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

/**
 * Check if the current time is past the token expiration
 * @param exp Token expiration timestamp
 * @returns Boolean indicating if token is expired
 */
export const isTokenExpired = (exp: number): boolean => {
  const currentTime = Date.now() / 1000;
  return exp < currentTime;
};

/**
 * Get tenant subdomain from hostname
 * @returns Subdomain string or null if not found
 */
export const getTenantSubdomain = (): string | null => {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return 'demo'; // Default for server-side rendering
  }

  const hostname = window.location.hostname;
  
  // Check if running locally
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // For local development, check if subdomain is in localStorage
    try {
      return localStorage.getItem('tenantSubdomain') || 'demo';
    } catch (error) {
      return 'demo';
    }
  }
  
  // Extract subdomain from hostname
  const parts = hostname.split('.');
  
  // Check if we have a subdomain (e.g., tenant.legalcrm.com)
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

/**
 * Set tenant subdomain in localStorage (for local development)
 * @param subdomain Tenant subdomain
 */
export const setTenantSubdomain = (subdomain: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tenantSubdomain', subdomain);
    } catch (error) {
      console.error('Failed to set tenant subdomain in localStorage:', error);
    }
  }
};