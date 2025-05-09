"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAllConnections = exports.getDefaultConnection = exports.getTenantConnection = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
// Default database configuration
const defaultConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'legal_crm',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development'
        ? (sql) => logger_1.logger.debug(sql)
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
const tenantConnections = new Map();
/**
 * Get a database connection for a specific tenant
 * @param tenantId The ID of the tenant
 * @returns A Sequelize instance for the tenant
 */
const getTenantConnection = async (tenantId) => {
    // Check if connection already exists
    if (tenantConnections.has(tenantId)) {
        return tenantConnections.get(tenantId);
    }
    // Create a new connection for the tenant
    const config = {
        ...defaultConfig,
        schema: `tenant_${tenantId}`,
        models: [path_1.default.join(__dirname, '../models/**/*.model.{ts,js}')],
    };
    const sequelize = new sequelize_typescript_1.Sequelize(config.database, config.username, config.password, config);
    try {
        await sequelize.authenticate();
        logger_1.logger.info(`Database connection established for tenant: ${tenantId}`);
        // Create schema if it doesn't exist
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS tenant_${tenantId}`);
        // Store the connection
        tenantConnections.set(tenantId, sequelize);
        return sequelize;
    }
    catch (error) {
        logger_1.logger.error(`Unable to connect to the database for tenant: ${tenantId}`, error);
        throw error;
    }
};
exports.getTenantConnection = getTenantConnection;
/**
 * Get the default database connection (for public schema)
 * @returns A Sequelize instance for the public schema
 */
const getDefaultConnection = async () => {
    const config = {
        ...defaultConfig,
        schema: 'public',
        models: [path_1.default.join(__dirname, '../models/**/*.model.{ts,js}')],
    };
    const sequelize = new sequelize_typescript_1.Sequelize(config.database, config.username, config.password, config);
    try {
        await sequelize.authenticate();
        logger_1.logger.info('Default database connection established');
        return sequelize;
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the default database', error);
        throw error;
    }
};
exports.getDefaultConnection = getDefaultConnection;
/**
 * Close all tenant database connections
 */
const closeAllConnections = async () => {
    for (const [tenantId, connection] of tenantConnections.entries()) {
        try {
            await connection.close();
            logger_1.logger.info(`Database connection closed for tenant: ${tenantId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error closing database connection for tenant: ${tenantId}`, error);
        }
    }
    tenantConnections.clear();
};
exports.closeAllConnections = closeAllConnections;
exports.default = {
    getTenantConnection: exports.getTenantConnection,
    getDefaultConnection: exports.getDefaultConnection,
    closeAllConnections: exports.closeAllConnections,
};
