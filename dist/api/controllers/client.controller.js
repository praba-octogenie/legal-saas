"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const client_service_1 = __importDefault(require("../../services/client-management/client.service"));
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../utils/validation");
class ClientController {
    /**
     * Create a new client
     * @param req Request
     * @param res Response
     */
    async createClient(req, res) {
        try {
            // Validate request
            const { error, value } = (0, validation_1.validateCreateClient)(req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Create client
            const client = await client_service_1.default.createClient({
                ...value,
                tenantId: req.tenant.id,
            }, req.tenantConnection);
            res.status(201).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error creating client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get client by ID
     * @param req Request
     * @param res Response
     */
    async getClientById(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get client
            const client = await client_service_1.default.getClientById(id, req.tenantConnection);
            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(200).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error getting client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update client
     * @param req Request
     * @param res Response
     */
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            // Validate request
            const { error, value } = (0, validation_1.validateUpdateClient)(req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update client
            const client = await client_service_1.default.updateClient(id, value, req.tenantConnection);
            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(200).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error updating client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Delete client
     * @param req Request
     * @param res Response
     */
    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Delete client
            const deleted = await client_service_1.default.deleteClient(id, req.tenantConnection);
            if (!deleted) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Error deleting client', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all clients
     * @param req Request
     * @param res Response
     */
    async getAllClients(req, res) {
        try {
            // Get query parameters
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get clients
            const result = await client_service_1.default.getClientsByTenantId(req.tenant.id, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting clients', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Search clients
     * @param req Request
     * @param res Response
     */
    async searchClients(req, res) {
        try {
            // Get query parameters
            const { searchTerm } = req.query;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            if (!searchTerm) {
                res.status(400).json({ error: 'Search term is required' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Search clients
            const result = await client_service_1.default.searchClients(req.tenant.id, searchTerm, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error searching clients', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Verify client KYC
     * @param req Request
     * @param res Response
     */
    async verifyClientKYC(req, res) {
        try {
            const { id } = req.params;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get user ID from JWT
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // Verify client KYC
            const client = await client_service_1.default.verifyClientKYC(id, userId, req.tenantConnection);
            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(200).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error verifying client KYC', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update client status
     * @param req Request
     * @param res Response
     */
    async updateClientStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !['active', 'inactive', 'blocked'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update client status
            const client = await client_service_1.default.updateClientStatus(id, status, req.tenantConnection);
            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(200).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error updating client status', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get clients by category
     * @param req Request
     * @param res Response
     */
    async getClientsByCategory(req, res) {
        try {
            // Get query parameters
            const { category } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Get clients by category
            const result = await client_service_1.default.getClientsByCategory(req.tenant.id, category, limit, offset, req.tenantConnection);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting clients by category', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update client portal access
     * @param req Request
     * @param res Response
     */
    async updateClientPortalAccess(req, res) {
        try {
            const { id } = req.params;
            const { enabled, username, accessLevel } = req.body;
            if (enabled === undefined) {
                res.status(400).json({ error: 'Enabled flag is required' });
                return;
            }
            if (enabled && !username) {
                res.status(400).json({ error: 'Username is required when enabling portal access' });
                return;
            }
            if (accessLevel && !['full', 'limited', 'readonly'].includes(accessLevel)) {
                res.status(400).json({ error: 'Invalid access level' });
                return;
            }
            // Get tenant connection
            if (!req.tenant || !req.tenantConnection) {
                res.status(400).json({ error: 'Tenant not found' });
                return;
            }
            // Update client portal access
            const client = await client_service_1.default.updateClientPortalAccess(id, {
                enabled,
                username,
                accessLevel: accessLevel,
            }, req.tenantConnection);
            if (!client) {
                res.status(404).json({ error: 'Client not found' });
                return;
            }
            res.status(200).json(client);
        }
        catch (error) {
            logger_1.logger.error('Error updating client portal access', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ClientController = ClientController;
exports.default = new ClientController();
