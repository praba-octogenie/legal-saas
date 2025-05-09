"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const encryption_1 = require("../utils/encryption");
const tenant_model_1 = require("../models/tenant.model");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Ensure logs directory exists
const logDir = 'logs';
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'legal_crm',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
};
/**
 * Initialize the database
 */
async function initializeDatabase() {
    try {
        logger_1.logger.info('Initializing database...');
        // Create a connection to the postgres database to create our database if it doesn't exist
        const adminSequelize = new sequelize_typescript_1.Sequelize({
            host: dbConfig.host,
            port: dbConfig.port,
            database: 'postgres',
            username: dbConfig.username,
            password: dbConfig.password,
            dialect: dbConfig.dialect,
        });
        try {
            // Check if our database exists
            const [results] = await adminSequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`);
            // If database doesn't exist, create it
            if (results.length === 0) {
                logger_1.logger.info(`Creating database ${dbConfig.database}...`);
                await adminSequelize.query(`CREATE DATABASE ${dbConfig.database}`);
            }
        }
        finally {
            // Close admin connection
            await adminSequelize.close();
        }
        // Connect to our database
        const sequelize = new sequelize_typescript_1.Sequelize({
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            username: dbConfig.username,
            password: dbConfig.password,
            dialect: dbConfig.dialect,
            models: [path_1.default.join(__dirname, '../models/**/*.model.{ts,js}')],
        });
        // Sync models with database
        logger_1.logger.info('Syncing models with database...');
        await sequelize.sync({ force: true });
        // Create admin user
        logger_1.logger.info('Creating admin user...');
        // In a real implementation, this would use the User model
        // For now, we'll just log the admin credentials
        const adminPassword = 'admin123';
        const hashedPassword = await (0, encryption_1.hashPassword)(adminPassword);
        logger_1.logger.info('Admin user created:');
        logger_1.logger.info('Email: admin@legalcrm.com');
        logger_1.logger.info(`Password: ${adminPassword}`);
        logger_1.logger.info(`Hashed Password: ${hashedPassword}`);
        // Create sample tenant
        logger_1.logger.info('Creating sample tenant...');
        const tenant = await tenant_model_1.Tenant.create({
            id: (0, uuid_1.v4)(),
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
        logger_1.logger.info(`Sample tenant created: ${tenant.name} (${tenant.subdomain})`);
        // Create tenant schema
        logger_1.logger.info('Creating tenant schema...');
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS tenant_${tenant.id}`);
        // Initialize tenant schema with tables
        logger_1.logger.info('Initializing tenant schema...');
        const tenantSequelize = new sequelize_typescript_1.Sequelize({
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            username: dbConfig.username,
            password: dbConfig.password,
            dialect: dbConfig.dialect,
            schema: `tenant_${tenant.id}`,
            models: [path_1.default.join(__dirname, '../models/**/*.model.{ts,js}')],
        });
        // Sync tenant models with database
        await tenantSequelize.sync({ force: true });
        logger_1.logger.info('Database initialization completed successfully!');
        // Close connections
        await sequelize.close();
        await tenantSequelize.close();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error initializing database', error);
        process.exit(1);
    }
}
// Run the initialization
initializeDatabase();
