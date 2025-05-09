import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/encryption';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

// Import models directly to ensure proper initialization order
import { Tenant } from '../models/tenant.model';
import { User } from '../models/user.model';
import { Client } from '../models/client.model';
import { Case } from '../models/case.model';
import { Message, Conversation, Notification } from '../models/communication.model';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'legal_crm',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres' as const,
};

/**
 * Initialize the database
 */
async function initializeDatabase() {
  try {
    logger.info('Initializing database...');
    
    // Create a connection to the postgres database to create our database if it doesn't exist
    const adminSequelize = new Sequelize({
      host: dbConfig.host,
      port: dbConfig.port,
      database: 'postgres',
      username: dbConfig.username,
      password: dbConfig.password,
      dialect: dbConfig.dialect,
    });
    
    try {
      // Check if our database exists
      const [results] = await adminSequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`
      ) as any[];
      
      // If database doesn't exist, create it
      if (results.length === 0) {
        logger.info(`Creating database ${dbConfig.database}...`);
        await adminSequelize.query(`CREATE DATABASE ${dbConfig.database}`);
      }
    } finally {
      // Close admin connection
      await adminSequelize.close();
    }
    
    // Connect to our database
    const sequelize = new Sequelize({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      password: dbConfig.password,
      dialect: dbConfig.dialect,
    });
    
    // Add models explicitly instead of using the glob pattern
    sequelize.addModels([
      Tenant,
      User,
      Client,
      Case,
      Message,
      Conversation,
      Notification
    ]);
    
    // Sync models with database
    logger.info('Syncing models with database...');
    
    // First drop all tables to avoid constraint issues
    try {
      await sequelize.getQueryInterface().dropAllTables();
      logger.info('All tables dropped successfully');
    } catch (error) {
      logger.warn('Error dropping tables, continuing with initialization', error);
    }
    
    // Then create all tables
    try {
      await sequelize.sync({ force: false });
      logger.info('All tables created successfully');
      
      // Create admin user only after tables are created
      logger.info('Creating admin user...');
      const adminPassword = 'admin123';
      const hashedPassword = await hashPassword(adminPassword);
      
      // Actually create the admin user in the database
      const adminUser = await User.create({
        id: uuidv4(),
        email: 'admin@legalcrm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        tenantId: null, // Super admin doesn't belong to any tenant
        permissions: ['all'],
        lastLogin: null,
      });
      
      // Use type assertion to access the id property
      const adminUserId = (adminUser as any).id || 'unknown';
      logger.info(`Admin user created with ID: ${adminUserId}`);
      logger.info('Email: admin@legalcrm.com');
      logger.info(`Password: ${adminPassword}`);
    } catch (error) {
      logger.error('Error creating tables or admin user', error);
      throw error; // Rethrow to stop initialization if we can't create tables
    }
    
    // Create sample tenant
    logger.info('Creating sample tenant...');
    const tenant = await Tenant.create({
      id: uuidv4(),
      name: 'Demo Law Firm',
      subdomain: 'demo',
      status: 'active',
      plan: 'enterprise',
      contactInfo: {
        email: 'contact@demolawfirm.com',
        phone: '+91 9876543210',
        address: {
          street: '123 Legal Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
      },
      settings: {
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
          users: 100,
          storage: 500,
          cases: -1,
          documents: -1,
        },
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu'],
      },
      integrations: {
        eCourtApi: { enabled: true, apiKey: 'sample-ecourt-api-key' },
        legalResearch: {
          sccOnline: { enabled: true, apiKey: 'sample-scc-api-key' },
          manupatra: { enabled: true, apiKey: 'sample-manupatra-api-key' },
          indianKanoon: { enabled: true, apiKey: 'sample-indiankanoon-api-key' },
        },
        rocketChat: { 
          enabled: true, 
          url: 'https://chat.demolawfirm.com',
          adminUsername: 'admin',
          adminPassword: 'password',
        },
        googleMeet: { 
          enabled: true, 
          clientId: 'sample-google-client-id',
          clientSecret: 'sample-google-client-secret',
        },
      },
    });
    
    logger.info(`Sample tenant created: ${tenant.name} (${tenant.subdomain})`);
    
    // Create tenant schema - replace hyphens with underscores for PostgreSQL schema name
    const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
    logger.info(`Creating tenant schema: ${schemaName}`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Initialize tenant schema with tables
    logger.info('Initializing tenant schema...');
    const tenantSequelize = new Sequelize({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      password: dbConfig.password,
      dialect: dbConfig.dialect,
      schema: schemaName,
    });
    
    // Add models explicitly instead of using the glob pattern
    tenantSequelize.addModels([
      Tenant,
      User,
      Client,
      Case,
      Message,
      Conversation,
      Notification
    ]);
    
    // Sync tenant models with database
    try {
      // First drop all tables in the tenant schema to avoid constraint issues
      try {
        await tenantSequelize.getQueryInterface().dropAllTables();
        logger.info(`All tables in schema ${schemaName} dropped successfully`);
      } catch (error) {
        logger.warn(`Error dropping tables in schema ${schemaName}, continuing with initialization`, error);
      }
      
      // Then create all tables in the tenant schema
      await tenantSequelize.sync({ force: false });
      logger.info(`All tables in schema ${schemaName} created successfully`);
      
      // First create the tenant in the tenant schema
      logger.info('Creating tenant in tenant schema...');
      const TenantModel = tenantSequelize.model('Tenant');
      
      // Create the same tenant in the tenant schema
      const tenantInSchema = await TenantModel.create({
        id: tenant.id, // Use the same ID as the tenant in the public schema
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        plan: tenant.plan,
        contactInfo: tenant.contactInfo,
        settings: tenant.settings,
        integrations: tenant.integrations,
        metadata: tenant.metadata,
      });
      
      logger.info(`Tenant created in schema with ID: ${(tenantInSchema as any).id || tenant.id}`);
      
      // Now create tenant admin user
      logger.info('Creating tenant admin user...');
      const tenantAdminPassword = 'tenant123';
      const tenantHashedPassword = await hashPassword(tenantAdminPassword);
      
      // Create a new User model instance bound to the tenant sequelize instance
      const TenantUser = tenantSequelize.model('User');
      
      const tenantAdmin = await TenantUser.create({
        id: uuidv4(),
        email: 'admin@demolawfirm.com',
        password: tenantHashedPassword,
        firstName: 'Tenant',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        tenantId: tenant.id,
        permissions: ['all'],
        lastLogin: null,
      });
      
      // Use type assertion to access the id property
      const tenantAdminId = (tenantAdmin as any).id || 'unknown';
      logger.info(`Tenant admin user created with ID: ${tenantAdminId}`);
      logger.info('Email: admin@demolawfirm.com');
      logger.info(`Password: ${tenantAdminPassword}`);
      
      // Create some sample users for the tenant
      logger.info('Creating sample users for tenant...');
      
      const roles = ['lawyer', 'paralegal', 'staff'];
      for (let i = 1; i <= 3; i++) {
        const role = roles[i-1];
        const user = await TenantUser.create({
          id: uuidv4(),
          email: `${role}@demolawfirm.com`,
          password: await hashPassword(`${role}123`),
          firstName: `Sample`,
          lastName: role.charAt(0).toUpperCase() + role.slice(1),
          role: role,
          status: 'active',
          tenantId: tenant.id,
          permissions: [],
          lastLogin: null,
        });
        
        // Use type assertion to access the email property
        const userEmail = (user as any).email || `${role}@demolawfirm.com`;
        logger.info(`Sample ${role} created with email: ${userEmail} and password: ${role}123`);
      }
    } catch (error) {
      logger.error(`Error creating tables or users in schema ${schemaName}`, error);
      throw error; // Rethrow to stop initialization if we can't create tables
    }
    
    logger.info('Database initialization completed successfully!');
    
    // Close connections
    await sequelize.close();
    await tenantSequelize.close();
    
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();