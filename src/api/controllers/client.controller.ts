import { Request, Response } from 'express';
import clientService from '../../services/client-management/client.service';
import { getTenantConnection } from '../../database/config';
import { logger } from '../../utils/logger';
import { validateCreateClient, validateUpdateClient } from '../../utils/validation';

export class ClientController {
  /**
   * Create a new client
   * @param req Request
   * @param res Response
   */
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateCreateClient(req.body);
      
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
      const client = await clientService.createClient({
        ...(value as any),
        tenantId: req.tenant.id,
      }, req.tenantConnection);
      
      res.status(201).json(client);
    } catch (error) {
      logger.error('Error creating client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get client by ID
   * @param req Request
   * @param res Response
   */
  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get client
      const client = await clientService.getClientById(id, req.tenantConnection);
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(200).json(client);
    } catch (error) {
      logger.error('Error getting client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update client
   * @param req Request
   * @param res Response
   */
  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateUpdateClient(req.body);
      
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
      const client = await clientService.updateClient(id, value as any, req.tenantConnection);
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(200).json(client);
    } catch (error) {
      logger.error('Error updating client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete client
   * @param req Request
   * @param res Response
   */
  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Delete client
      const deleted = await clientService.deleteClient(id, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all clients
   * @param req Request
   * @param res Response
   */
  async getAllClients(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get clients
      const result = await clientService.getClientsByTenantId(
        req.tenant.id,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting clients', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Search clients
   * @param req Request
   * @param res Response
   */
  async searchClients(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
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
      const result = await clientService.searchClients(
        req.tenant.id,
        searchTerm as string,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error searching clients', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Verify client KYC
   * @param req Request
   * @param res Response
   */
  async verifyClientKYC(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get user ID from JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Verify client KYC
      const client = await clientService.verifyClientKYC(id, userId, req.tenantConnection);
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(200).json(client);
    } catch (error) {
      logger.error('Error verifying client KYC', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update client status
   * @param req Request
   * @param res Response
   */
  async updateClientStatus(req: Request, res: Response): Promise<void> {
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
      const client = await clientService.updateClientStatus(
        id,
        status as 'active' | 'inactive' | 'blocked',
        req.tenantConnection
      );
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(200).json(client);
    } catch (error) {
      logger.error('Error updating client status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get clients by category
   * @param req Request
   * @param res Response
   */
  async getClientsByCategory(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get clients by category
      const result = await clientService.getClientsByCategory(
        req.tenant.id,
        category,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting clients by category', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update client portal access
   * @param req Request
   * @param res Response
   */
  async updateClientPortalAccess(req: Request, res: Response): Promise<void> {
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
      const client = await clientService.updateClientPortalAccess(
        id,
        {
          enabled,
          username,
          accessLevel: accessLevel as 'full' | 'limited' | 'readonly',
        },
        req.tenantConnection
      );
      
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      
      res.status(200).json(client);
    } catch (error) {
      logger.error('Error updating client portal access', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ClientController();