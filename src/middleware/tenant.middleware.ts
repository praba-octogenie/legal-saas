import { Request, Response, NextFunction } from 'express';
import tenantService from '../services/tenant-management/tenant.service';
import { logger } from '../utils/logger';
import { getTenantConnection } from '../database/config';

// Extend Express Request interface to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: any;
      tenantConnection?: any;
    }
  }
}

/**
 * Middleware to resolve tenant from hostname
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip tenant resolution for admin API routes
    if (req.path.startsWith('/api/admin')) {
      return next();
    }
    
    // Get hostname from request
    const hostname = req.hostname;
    
    // Skip for localhost or IP addresses (used for admin access)
    if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return next();
    }
    
    let tenant;
    
    // Check if hostname is a custom domain
    tenant = await tenantService.getTenantByCustomDomain(hostname);
    
    // If not a custom domain, check if it's a subdomain
    if (!tenant) {
      // Extract subdomain from hostname
      const parts = hostname.split('.');
      
      // If hostname has at least 3 parts (subdomain.domain.tld)
      if (parts.length >= 3) {
        const subdomain = parts[0];
        tenant = await tenantService.getTenantBySubdomain(subdomain);
      }
    }
    
    // If tenant not found, return 404
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    // Check if tenant is active
    if (tenant.status === 'inactive' || tenant.status === 'suspended') {
      res.status(403).json({ error: 'Tenant is not active' });
      return;
    }
    
    // Set tenant in request
    req.tenant = tenant;
    
    // Get tenant database connection
    req.tenantConnection = await getTenantConnection(tenant.id);
    
    next();
  } catch (error) {
    logger.error('Error resolving tenant', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to require tenant
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  
  next();
};

/**
 * Middleware to check tenant plan
 * @param requiredPlan Required plan
 * @returns Middleware
 */
export const requireTenantPlan = (requiredPlan: 'basic' | 'professional' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const planHierarchy: Record<string, number> = {
      basic: 1,
      professional: 2,
      enterprise: 3,
    };
    
    const tenantPlan = req.tenant.plan as 'basic' | 'professional' | 'enterprise';
    if (planHierarchy[tenantPlan] < planHierarchy[requiredPlan]) {
      res.status(403).json({
        error: 'Plan upgrade required',
        requiredPlan,
        currentPlan: req.tenant.plan,
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware to check tenant feature
 * @param feature Feature to check
 * @returns Middleware
 */
export const requireTenantFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    // Check if feature is enabled
    const featureEnabled = req.tenant.settings?.features?.[feature];
    
    if (!featureEnabled) {
      res.status(403).json({
        error: 'Feature not enabled',
        feature,
      });
      return;
    }
    
    next();
  };
};

export default {
  resolveTenant,
  requireTenant,
  requireTenantPlan,
  requireTenantFeature,
};