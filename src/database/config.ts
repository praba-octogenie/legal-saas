
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Import models directly to ensure proper initialization order
import { Tenant } from '../models/tenant.model';
import { User } from '../models/user.model';
import { Client } from '../models/client.model';
import { Case } from '../models/case.model';
import { Message, Conversation, Notification } from '../models/communication.model';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'postgres';
  logging: boolean | ((sql: string, timing?: number) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  define: {
    timestamps: boolean;
    underscored: boolean;
  };
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'legal_crm',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' 
    ? (sql: string) => logger.debug(sql) 
    : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
};

// Map to store tenant-specific database connections
const tenantConnections = new Map<string, Sequelize>();

/**
 * Get a database connection for a specific tenant
 * @param tenantId The ID of the tenant
 * @returns A Sequelize instance for the tenant
 */
export const getTenantConnection = async (tenantId: string): Promise<Sequelize> => {
  // Check if connection already exists
  if (tenantConnections.has(tenantId)) {
    return tenantConnections.get(tenantId)!;
  }

  // Create a new connection for the tenant
  // Replace hyphens with underscores for PostgreSQL schema name
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  
  const config: SequelizeOptions = {
    ...defaultConfig,
    schema: schemaName,
  };

  const sequelize = new Sequelize(
    config.database!,
    config.username!,
    config.password!,
    config as any
  );

  try {
    await sequelize.authenticate();
    logger.info(`Database connection established for tenant: ${tenantId}`);
    
    // Create schema if it doesn't exist
    // Replace hyphens with underscores for PostgreSQL schema name
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Add models explicitly
    sequelize.addModels([
      Tenant,
      User,
      Client,
      Case,
      Message,
      Conversation,
      Notification
    ]);
    
    // Store the connection
    tenantConnections.set(tenantId, sequelize);
    
    return sequelize;
  } catch (error) {
    logger.error(`Unable to connect to the database for tenant: ${tenantId}`, error);
    throw error;
  }
};

/**
 * Get the default database connection (for public schema)
 * @returns A Sequelize instance for the public schema
 */
export const getDefaultConnection = async (): Promise<Sequelize> => {
  const config: SequelizeOptions = {
    ...defaultConfig,
    schema: 'public',
  };

  const sequelize = new Sequelize(
    config.database!,
    config.username!,
    config.password!,
    config as any
  );

  try {
    await sequelize.authenticate();
    logger.info('Default database connection established');
    
    // Add models explicitly
    sequelize.addModels([
      Tenant,
      User,
      Client,
      Case,
      Message,
      Conversation,
      Notification
    ]);
    
    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the default database', error);
    throw error;
  }
};

/**
 * Close all tenant database connections
 */
export const closeAllConnections = async (): Promise<void> => {
  for (const [tenantId, connection] of tenantConnections.entries()) {
    try {
      await connection.close();
      logger.info(`Database connection closed for tenant: ${tenantId}`);
    } catch (error) {
      logger.error(`Error closing database connection for tenant: ${tenantId}`, error);
    }
  }
  
  tenantConnections.clear();
};

export default {
  getTenantConnection,
  getDefaultConnection,
  closeAllConnections,
};