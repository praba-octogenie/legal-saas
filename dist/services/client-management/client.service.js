"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const client_model_1 = require("../../models/client.model");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
class ClientService {
    /**
     * Create a new client
     * @param clientData Client data
     * @param connection Sequelize connection
     * @returns Created client
     */
    async createClient(clientData, connection) {
        try {
            // Process contact persons
            const contactPersons = clientData.contactPersons?.map(person => ({
                ...person,
                id: (0, uuid_1.v4)(),
                isPrimary: person.isPrimary || false,
            })) || [];
            // Process KYC documents
            const kycDocuments = clientData.kycDetails?.documents?.map(doc => ({
                ...doc,
                uploadedAt: new Date(),
                status: doc.status || 'pending',
            })) || [];
            // Create client
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.create({
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                type: clientData.type || 'individual',
                status: 'active',
                category: clientData.category,
                tenantId: clientData.tenantId,
                address: clientData.address || {},
                kycDetails: {
                    verified: false,
                    documents: kycDocuments,
                    aadharNumber: clientData.kycDetails?.aadharNumber,
                    panNumber: clientData.kycDetails?.panNumber,
                    gstNumber: clientData.kycDetails?.gstNumber,
                    companyRegistrationNumber: clientData.kycDetails?.companyRegistrationNumber,
                },
                contactPersons,
                preferences: clientData.preferences || {
                    language: 'en',
                    communicationChannel: 'email',
                    notificationPreferences: {
                        email: true,
                        sms: false,
                        portal: true,
                    },
                },
                portalAccess: {
                    enabled: clientData.portalAccess?.enabled || false,
                    username: clientData.portalAccess?.username,
                    accessLevel: clientData.portalAccess?.accessLevel || 'readonly',
                },
                metadata: clientData.metadata || {},
            });
            logger_1.logger.info(`Client created: ${client.name} (${client.id})`);
            return client;
        }
        catch (error) {
            logger_1.logger.error('Error creating client', error);
            throw error;
        }
    }
    /**
     * Get client by ID
     * @param clientId Client ID
     * @param connection Sequelize connection
     * @returns Client
     */
    async getClientById(clientId, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            return await ClientModel.findByPk(clientId);
        }
        catch (error) {
            logger_1.logger.error(`Error getting client by ID: ${clientId}`, error);
            throw error;
        }
    }
    /**
     * Update client
     * @param clientId Client ID
     * @param updateData Update data
     * @param connection Sequelize connection
     * @returns Updated client
     */
    async updateClient(clientId, updateData, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.findByPk(clientId);
            if (!client) {
                return null;
            }
            // Process contact persons if provided
            if (updateData.contactPersons) {
                const existingPersons = client.contactPersons || [];
                const updatedPersons = updateData.contactPersons.map(person => {
                    if (person.id) {
                        // Update existing person
                        const existingIndex = existingPersons.findIndex(p => p.id === person.id);
                        if (existingIndex >= 0) {
                            return { ...existingPersons[existingIndex], ...person };
                        }
                    }
                    // Add new person
                    return { ...person, id: (0, uuid_1.v4)(), isPrimary: person.isPrimary || false };
                });
                updateData.contactPersons = updatedPersons;
            }
            // Process KYC documents if provided
            if (updateData.kycDetails?.documents) {
                const existingDocs = client.kycDetails.documents || [];
                const updatedDocs = updateData.kycDetails.documents.map(doc => {
                    if (doc.documentId) {
                        // Update existing document
                        const existingIndex = existingDocs.findIndex(d => d.documentId === doc.documentId);
                        if (existingIndex >= 0) {
                            return { ...existingDocs[existingIndex], ...doc };
                        }
                    }
                    // Add new document
                    return { ...doc, uploadedAt: new Date(), status: doc.status || 'pending' };
                });
                if (!updateData.kycDetails) {
                    updateData.kycDetails = {};
                }
                updateData.kycDetails.documents = updatedDocs;
            }
            // Update client
            await client.update(updateData);
            logger_1.logger.info(`Client updated: ${client.name} (${client.id})`);
            return client;
        }
        catch (error) {
            logger_1.logger.error(`Error updating client: ${clientId}`, error);
            throw error;
        }
    }
    /**
     * Delete client
     * @param clientId Client ID
     * @param connection Sequelize connection
     * @returns True if client was deleted
     */
    async deleteClient(clientId, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.findByPk(clientId);
            if (!client) {
                return false;
            }
            // Delete client
            await client.destroy();
            logger_1.logger.info(`Client deleted: ${client.name} (${client.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting client: ${clientId}`, error);
            throw error;
        }
    }
    /**
     * Get all clients for a tenant
     * @param tenantId Tenant ID
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Clients
     */
    async getClientsByTenantId(tenantId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const { count, rows } = await ClientModel.findAndCountAll({
                where: { tenantId },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });
            return {
                clients: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting clients by tenant ID: ${tenantId}`, error);
            throw error;
        }
    }
    /**
     * Search clients
     * @param tenantId Tenant ID
     * @param searchTerm Search term
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Clients
     */
    async searchClients(tenantId, searchTerm, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const { count, rows } = await ClientModel.findAndCountAll({
                where: {
                    tenantId,
                    name: {
                        [connection.getDialect() === 'postgres' ? 'iLike' : 'like']: `%${searchTerm}%`,
                    },
                },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });
            return {
                clients: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error searching clients: ${searchTerm}`, error);
            throw error;
        }
    }
    /**
     * Verify client KYC
     * @param clientId Client ID
     * @param verifiedBy User ID of the verifier
     * @param connection Sequelize connection
     * @returns Updated client
     */
    async verifyClientKYC(clientId, verifiedBy, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.findByPk(clientId);
            if (!client) {
                return null;
            }
            // Update KYC details
            const kycDetails = {
                ...client.kycDetails,
                verified: true,
                verificationDate: new Date(),
                verifiedBy,
            };
            // Update client
            await client.update({ kycDetails });
            logger_1.logger.info(`Client KYC verified: ${client.name} (${client.id})`);
            return client;
        }
        catch (error) {
            logger_1.logger.error(`Error verifying client KYC: ${clientId}`, error);
            throw error;
        }
    }
    /**
     * Update client status
     * @param clientId Client ID
     * @param status New status
     * @param connection Sequelize connection
     * @returns Updated client
     */
    async updateClientStatus(clientId, status, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.findByPk(clientId);
            if (!client) {
                return null;
            }
            // Update client status
            await client.update({ status });
            logger_1.logger.info(`Client status updated: ${client.name} (${client.id}) - ${status}`);
            return client;
        }
        catch (error) {
            logger_1.logger.error(`Error updating client status: ${clientId}`, error);
            throw error;
        }
    }
    /**
     * Get clients by category
     * @param tenantId Tenant ID
     * @param category Category
     * @param limit Limit
     * @param offset Offset
     * @param connection Sequelize connection
     * @returns Clients
     */
    async getClientsByCategory(tenantId, category, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const { count, rows } = await ClientModel.findAndCountAll({
                where: { tenantId, category },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });
            return {
                clients: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting clients by category: ${category}`, error);
            throw error;
        }
    }
    /**
     * Update client portal access
     * @param clientId Client ID
     * @param portalAccess Portal access settings
     * @param connection Sequelize connection
     * @returns Updated client
     */
    async updateClientPortalAccess(clientId, portalAccess, connection) {
        try {
            // Set the model to use the tenant connection
            const ClientModel = connection.model(client_model_1.Client.name);
            const client = await ClientModel.findByPk(clientId);
            if (!client) {
                return null;
            }
            // Update portal access
            await client.update({ portalAccess });
            logger_1.logger.info(`Client portal access updated: ${client.name} (${client.id})`);
            return client;
        }
        catch (error) {
            logger_1.logger.error(`Error updating client portal access: ${clientId}`, error);
            throw error;
        }
    }
}
exports.ClientService = ClientService;
exports.default = new ClientService();
