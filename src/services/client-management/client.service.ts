import { Client } from '../../models/client.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize-typescript';

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'corporate' | 'government' | 'ngo';
  category?: string;
  tenantId: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  kycDetails?: {
    aadharNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    companyRegistrationNumber?: string;
    documents?: {
      type: string;
      documentId: string;
      documentUrl: string;
      status?: 'pending' | 'verified' | 'rejected';
    }[];
  };
  contactPersons?: {
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }[];
  preferences?: {
    language?: string;
    communicationChannel?: 'email' | 'phone' | 'portal';
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      portal?: boolean;
    };
  };
  portalAccess?: {
    enabled?: boolean;
    username?: string;
    accessLevel?: 'full' | 'limited' | 'readonly';
  };
  metadata?: Record<string, any>;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'corporate' | 'government' | 'ngo';
  status?: 'active' | 'inactive' | 'blocked';
  category?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  kycDetails?: {
    verified?: boolean;
    verificationDate?: Date;
    verifiedBy?: string;
    aadharNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    companyRegistrationNumber?: string;
    documents?: {
      type: string;
      documentId: string;
      documentUrl: string;
      status?: 'pending' | 'verified' | 'rejected';
    }[];
  };
  contactPersons?: {
    id?: string;
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }[];
  preferences?: {
    language?: string;
    communicationChannel?: 'email' | 'phone' | 'portal';
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      portal?: boolean;
    };
  };
  portalAccess?: {
    enabled?: boolean;
    username?: string;
    accessLevel?: 'full' | 'limited' | 'readonly';
  };
  metadata?: Record<string, any>;
}

export class ClientService {
  /**
   * Create a new client
   * @param clientData Client data
   * @param connection Sequelize connection
   * @returns Created client
   */
  async createClient(clientData: CreateClientDto, connection: Sequelize): Promise<Client> {
    try {
      // Process contact persons
      const contactPersons = clientData.contactPersons?.map(person => ({
        ...person,
        id: uuidv4(),
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
      const ClientModel = connection.model(Client.name) as typeof Client;
      
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

      logger.info(`Client created: ${client.name} (${client.id})`);

      return client;
    } catch (error) {
      logger.error('Error creating client', error);
      throw error;
    }
  }

  /**
   * Get client by ID
   * @param clientId Client ID
   * @param connection Sequelize connection
   * @returns Client
   */
  async getClientById(clientId: string, connection: Sequelize): Promise<Client | null> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      return await ClientModel.findByPk(clientId) as Client | null;
    } catch (error) {
      logger.error(`Error getting client by ID: ${clientId}`, error);
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
  async updateClient(clientId: string, updateData: UpdateClientDto, connection: Sequelize): Promise<Client | null> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      const client = await ClientModel.findByPk(clientId) as Client | null;

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
          return { ...person, id: uuidv4(), isPrimary: person.isPrimary || false };
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

      logger.info(`Client updated: ${client.name} (${client.id})`);

      return client;
    } catch (error) {
      logger.error(`Error updating client: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Delete client
   * @param clientId Client ID
   * @param connection Sequelize connection
   * @returns True if client was deleted
   */
  async deleteClient(clientId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      const client = await ClientModel.findByPk(clientId) as Client | null;

      if (!client) {
        return false;
      }

      // Delete client
      await client.destroy();

      logger.info(`Client deleted: ${client.name} (${client.id})`);

      return true;
    } catch (error) {
      logger.error(`Error deleting client: ${clientId}`, error);
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
  async getClientsByTenantId(
    tenantId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ clients: Client[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      
      const { count, rows } = await ClientModel.findAndCountAll({
        where: { tenantId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        clients: rows as Client[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting clients by tenant ID: ${tenantId}`, error);
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
  async searchClients(
    tenantId: string,
    searchTerm: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ clients: Client[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      
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
        clients: rows as Client[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error searching clients: ${searchTerm}`, error);
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
  async verifyClientKYC(clientId: string, verifiedBy: string, connection: Sequelize): Promise<Client | null> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      const client = await ClientModel.findByPk(clientId) as Client | null;

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

      logger.info(`Client KYC verified: ${client.name} (${client.id})`);

      return client;
    } catch (error) {
      logger.error(`Error verifying client KYC: ${clientId}`, error);
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
  async updateClientStatus(
    clientId: string,
    status: 'active' | 'inactive' | 'blocked',
    connection: Sequelize
  ): Promise<Client | null> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      const client = await ClientModel.findByPk(clientId) as Client | null;

      if (!client) {
        return null;
      }

      // Update client status
      await client.update({ status });

      logger.info(`Client status updated: ${client.name} (${client.id}) - ${status}`);

      return client;
    } catch (error) {
      logger.error(`Error updating client status: ${clientId}`, error);
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
  async getClientsByCategory(
    tenantId: string,
    category: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ clients: Client[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      
      const { count, rows } = await ClientModel.findAndCountAll({
        where: { tenantId, category },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        clients: rows as Client[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting clients by category: ${category}`, error);
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
  async updateClientPortalAccess(
    clientId: string,
    portalAccess: {
      enabled: boolean;
      username?: string;
      accessLevel?: 'full' | 'limited' | 'readonly';
    },
    connection: Sequelize
  ): Promise<Client | null> {
    try {
      // Set the model to use the tenant connection
      const ClientModel = connection.model(Client.name) as typeof Client;
      const client = await ClientModel.findByPk(clientId) as Client | null;

      if (!client) {
        return null;
      }

      // Update portal access
      await client.update({ portalAccess });

      logger.info(`Client portal access updated: ${client.name} (${client.id})`);

      return client;
    } catch (error) {
      logger.error(`Error updating client portal access: ${clientId}`, error);
      throw error;
    }
  }
}

export default new ClientService();