import { Tenant } from '../../models/tenant.model';
import { getDefaultConnection, getTenantConnection } from '../../database/config';
import { logger } from '../../utils/logger';
import { encrypt, decrypt } from '../../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  customDomain?: string;
  plan?: 'basic' | 'professional' | 'enterprise';
  contactInfo: {
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  settings?: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    };
    features?: {
      multiLanguage?: boolean;
      documentGeneration?: boolean;
      legalResearch?: boolean;
      billing?: boolean;
      communication?: boolean;
      mobileApp?: boolean;
    };
    defaultLanguage?: string;
    supportedLanguages?: string[];
  };
}

export interface UpdateTenantDto {
  name?: string;
  customDomain?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'trial';
  plan?: 'basic' | 'professional' | 'enterprise';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  settings?: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    };
    features?: {
      multiLanguage?: boolean;
      documentGeneration?: boolean;
      legalResearch?: boolean;
      billing?: boolean;
      communication?: boolean;
      mobileApp?: boolean;
    };
    limits?: {
      users?: number;
      storage?: number;
      cases?: number;
      documents?: number;
    };
    defaultLanguage?: string;
    supportedLanguages?: string[];
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  integrations?: {
    eCourtApi?: {
      enabled: boolean;
      apiKey?: string;
    };
    legalResearch?: {
      sccOnline?: {
        enabled: boolean;
        apiKey?: string;
      };
      manupatra?: {
        enabled: boolean;
        apiKey?: string;
      };
      indianKanoon?: {
        enabled: boolean;
        apiKey?: string;
      };
    };
    rocketChat?: {
      enabled: boolean;
      url?: string;
      adminUsername?: string;
      adminPassword?: string;
    };
    googleMeet?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
  };
  metadata?: Record<string, any>;
}

export class TenantService {
  /**
   * Create a new tenant
   * @param tenantData Tenant data
   * @returns Created tenant
   */
  async createTenant(tenantData: CreateTenantDto): Promise<Tenant> {
    try {
      const connection = await getDefaultConnection();
      
      // Validate subdomain format
      if (!/^[a-z0-9-]+$/i.test(tenantData.subdomain)) {
        throw new Error('Subdomain can only contain alphanumeric characters and hyphens');
      }
      
      // Check if subdomain is already taken
      const existingTenant = await Tenant.findOne({
        where: { subdomain: tenantData.subdomain },
      });
      
      if (existingTenant) {
        throw new Error('Subdomain is already taken');
      }
      
      // Set default values
      const defaultSettings = {
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
        },
        features: {
          multiLanguage: true,
          documentGeneration: true,
          legalResearch: true,
          billing: true,
          communication: true,
          mobileApp: true,
        },
        limits: {
          users: tenantData.plan === 'basic' ? 5 : tenantData.plan === 'professional' ? 20 : 100,
          storage: tenantData.plan === 'basic' ? 5 : tenantData.plan === 'professional' ? 50 : 500, // GB
          cases: tenantData.plan === 'basic' ? 100 : tenantData.plan === 'professional' ? 1000 : -1, // -1 means unlimited
          documents: tenantData.plan === 'basic' ? 1000 : tenantData.plan === 'professional' ? 10000 : -1,
        },
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'hi'],
      };
      
      // Create tenant
      const tenant = await Tenant.create({
        id: uuidv4(),
        name: tenantData.name,
        subdomain: tenantData.subdomain.toLowerCase(),
        customDomain: tenantData.customDomain,
        status: 'trial',
        plan: tenantData.plan || 'basic',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        contactInfo: tenantData.contactInfo,
        settings: {
          ...defaultSettings,
          ...tenantData.settings,
        },
        integrations: {
          eCourtApi: { enabled: false },
          legalResearch: {
            sccOnline: { enabled: false },
            manupatra: { enabled: false },
            indianKanoon: { enabled: false },
          },
          rocketChat: { enabled: false },
          googleMeet: { enabled: false },
        },
        metadata: {},
      });
      
      // Initialize tenant schema and tables
      await this.initializeTenantSchema(tenant.id);
      
      logger.info(`Tenant created: ${tenant.name} (${tenant.subdomain})`);
      
      return tenant;
    } catch (error) {
      logger.error('Error creating tenant', error);
      throw error;
    }
  }
  
  /**
   * Initialize tenant schema and tables
   * @param tenantId Tenant ID
   */
  async initializeTenantSchema(tenantId: string): Promise<void> {
    try {
      // Get tenant connection
      const connection = await getTenantConnection(tenantId);
      
      // Sync models to create tables
      await connection.sync();
      
      logger.info(`Tenant schema initialized: ${tenantId}`);
    } catch (error) {
      logger.error(`Error initializing tenant schema: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get tenant by ID
   * @param tenantId Tenant ID
   * @returns Tenant
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      return await Tenant.findByPk(tenantId);
    } catch (error) {
      logger.error(`Error getting tenant by ID: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get tenant by subdomain
   * @param subdomain Tenant subdomain
   * @returns Tenant
   */
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    try {
      return await Tenant.findOne({
        where: { subdomain: subdomain.toLowerCase() },
      });
    } catch (error) {
      logger.error(`Error getting tenant by subdomain: ${subdomain}`, error);
      throw error;
    }
  }
  
  /**
   * Get tenant by custom domain
   * @param customDomain Tenant custom domain
   * @returns Tenant
   */
  async getTenantByCustomDomain(customDomain: string): Promise<Tenant | null> {
    try {
      return await Tenant.findOne({
        where: { customDomain },
      });
    } catch (error) {
      logger.error(`Error getting tenant by custom domain: ${customDomain}`, error);
      throw error;
    }
  }
  
  /**
   * Update tenant
   * @param tenantId Tenant ID
   * @param updateData Update data
   * @returns Updated tenant
   */
  async updateTenant(tenantId: string, updateData: UpdateTenantDto): Promise<Tenant | null> {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        return null;
      }
      
      // Update tenant
      await tenant.update(updateData);
      
      logger.info(`Tenant updated: ${tenant.name} (${tenant.id})`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error updating tenant: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete tenant
   * @param tenantId Tenant ID
   * @returns True if tenant was deleted
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        return false;
      }
      
      // Delete tenant schema
      const connection = await getDefaultConnection();
      await connection.query(`DROP SCHEMA IF EXISTS tenant_${tenantId} CASCADE`);
      
      // Delete tenant record
      await tenant.destroy();
      
      logger.info(`Tenant deleted: ${tenant.name} (${tenant.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting tenant: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all tenants
   * @param limit Limit
   * @param offset Offset
   * @returns Tenants
   */
  async getAllTenants(limit: number = 10, offset: number = 0): Promise<{ tenants: Tenant[]; total: number }> {
    try {
      const { count, rows } = await Tenant.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });
      
      return {
        tenants: rows,
        total: count,
      };
    } catch (error) {
      logger.error('Error getting all tenants', error);
      throw error;
    }
  }
  
  /**
   * Get tenant encryption key
   * @param tenantId Tenant ID
   * @returns Decrypted encryption key
   */
  async getTenantEncryptionKey(tenantId: string): Promise<string | null> {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant || !tenant.encryptionKey) {
        return null;
      }
      
      return decrypt(tenant.encryptionKey, process.env.ENCRYPTION_KEY || 'default-key');
    } catch (error) {
      logger.error(`Error getting tenant encryption key: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Update tenant status
   * @param tenantId Tenant ID
   * @param status New status
   * @returns Updated tenant
   */
  async updateTenantStatus(tenantId: string, status: 'active' | 'inactive' | 'suspended' | 'trial'): Promise<Tenant | null> {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        return null;
      }
      
      // Update tenant status
      await tenant.update({ status });
      
      logger.info(`Tenant status updated: ${tenant.name} (${tenant.id}) - ${status}`);
      
      return tenant;
    } catch (error) {
      logger.error(`Error updating tenant status: ${tenantId}`, error);
      throw error;
    }
  }
}

export default new TenantService();