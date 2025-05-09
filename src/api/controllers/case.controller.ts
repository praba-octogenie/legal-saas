import { Request, Response } from 'express';
import caseService from '../../services/case-management/case.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';

// Case validation schemas
const casePartySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('plaintiff', 'defendant', 'respondent', 'petitioner', 'appellant', 'witness', 'third_party', 'other').required(),
  role: Joi.string().required(),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
  }).optional(),
  counsel: Joi.string().optional(),
});

const caseTimelineEventSchema = Joi.object({
  date: Joi.date().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('filing', 'hearing', 'order', 'judgment', 'submission', 'other').required(),
  status: Joi.string().valid('pending', 'completed', 'cancelled', 'rescheduled').required(),
  notes: Joi.string().optional(),
  documents: Joi.array().items(Joi.string()).optional(),
});

const caseTeamMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  role: Joi.string().valid('lead', 'associate', 'paralegal', 'consultant', 'admin').required(),
  permissions: Joi.array().items(Joi.string()).required(),
});

const createCaseSchema = Joi.object({
  title: Joi.string().required(),
  caseNumber: Joi.string().optional(),
  description: Joi.string().optional(),
  type: Joi.string().required(),
  subType: Joi.string().optional(),
  court: Joi.string().required(),
  courtBranch: Joi.string().optional(),
  judge: Joi.string().optional(),
  opposingCounsel: Joi.string().optional(),
  filingDate: Joi.date().optional(),
  nextHearingDate: Joi.date().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  clientId: Joi.string().uuid().required(),
  assignedTo: Joi.string().uuid().required(),
  parties: Joi.array().items(casePartySchema).optional(),
  timeline: Joi.array().items(caseTimelineEventSchema).optional(),
  team: Joi.array().items(caseTeamMemberSchema).optional(),
  courtDetails: Joi.object({
    courtId: Joi.string().optional(),
    courtType: Joi.string().optional(),
    jurisdiction: Joi.string().optional(),
    bench: Joi.string().optional(),
    courtRoom: Joi.string().optional(),
    filingNumber: Joi.string().optional(),
    cnrNumber: Joi.string().optional(),
  }).optional(),
  fees: Joi.object({
    billingType: Joi.string().valid('hourly', 'fixed', 'contingency', 'retainer').optional(),
    estimatedAmount: Joi.number().optional(),
    currency: Joi.string().optional(),
    ratePerHour: Joi.number().optional(),
    retainerAmount: Joi.number().optional(),
    contingencyPercentage: Joi.number().optional(),
  }).optional(),
  metadata: Joi.object().optional(),
});

const updateCaseSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid('pending', 'active', 'on_hold', 'closed', 'archived').optional(),
  type: Joi.string().optional(),
  subType: Joi.string().optional(),
  court: Joi.string().optional(),
  courtBranch: Joi.string().optional(),
  judge: Joi.string().optional(),
  opposingCounsel: Joi.string().optional(),
  filingDate: Joi.date().optional(),
  nextHearingDate: Joi.date().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  clientId: Joi.string().uuid().optional(),
  assignedTo: Joi.string().uuid().optional(),
  parties: Joi.array().items(casePartySchema.keys({
    id: Joi.string().uuid().optional(),
  })).optional(),
  timeline: Joi.array().items(caseTimelineEventSchema.keys({
    id: Joi.string().uuid().optional(),
  })).optional(),
  team: Joi.array().items(caseTeamMemberSchema).optional(),
  courtDetails: Joi.object({
    courtId: Joi.string().optional(),
    courtType: Joi.string().optional(),
    jurisdiction: Joi.string().optional(),
    bench: Joi.string().optional(),
    courtRoom: Joi.string().optional(),
    filingNumber: Joi.string().optional(),
    cnrNumber: Joi.string().optional(),
  }).optional(),
  fees: Joi.object({
    billingType: Joi.string().valid('hourly', 'fixed', 'contingency', 'retainer').optional(),
    estimatedAmount: Joi.number().optional(),
    currency: Joi.string().optional(),
    ratePerHour: Joi.number().optional(),
    retainerAmount: Joi.number().optional(),
    contingencyPercentage: Joi.number().optional(),
  }).optional(),
  metadata: Joi.object().optional(),
});

const timelineEventSchema = Joi.object({
  date: Joi.date().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('filing', 'hearing', 'order', 'judgment', 'submission', 'other').required(),
  status: Joi.string().valid('pending', 'completed', 'cancelled', 'rescheduled').required(),
  notes: Joi.string().optional(),
  documents: Joi.array().items(Joi.string()).optional(),
});

export class CaseController {
  /**
   * Create a new case
   * @param req Request
   * @param res Response
   */
  async createCase(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createCaseSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Create case
      const caseInstance = await caseService.createCase({
        ...(value as any),
        tenantId: req.tenant.id,
      }, req.tenantConnection);
      
      res.status(201).json(caseInstance);
    } catch (error) {
      logger.error('Error creating case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get case by ID
   * @param req Request
   * @param res Response
   */
  async getCaseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get case
      const caseInstance = await caseService.getCaseById(id, req.tenantConnection);
      
      if (!caseInstance) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      
      res.status(200).json(caseInstance);
    } catch (error) {
      logger.error('Error getting case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update case
   * @param req Request
   * @param res Response
   */
  async updateCase(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateCaseSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Update case
      const caseInstance = await caseService.updateCase(id, value as any, req.tenantConnection);
      
      if (!caseInstance) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      
      res.status(200).json(caseInstance);
    } catch (error) {
      logger.error('Error updating case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete case
   * @param req Request
   * @param res Response
   */
  async deleteCase(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Delete case
      const deleted = await caseService.deleteCase(id, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all cases
   * @param req Request
   * @param res Response
   */
  async getAllCases(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get cases
      const result = await caseService.getCasesByTenantId(
        req.tenant.id,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting cases', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get cases by client
   * @param req Request
   * @param res Response
   */
  async getCasesByClient(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get cases
      const result = await caseService.getCasesByClientId(
        clientId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting cases by client', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get cases by assigned user
   * @param req Request
   * @param res Response
   */
  async getCasesByAssignedUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get cases
      const result = await caseService.getCasesByAssignedUserId(
        userId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting cases by assigned user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get cases by status
   * @param req Request
   * @param res Response
   */
  async getCasesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Validate status
      if (!['pending', 'active', 'on_hold', 'closed', 'archived'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get cases
      const result = await caseService.getCasesByStatus(
        req.tenant.id,
        status as any,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting cases by status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get cases by court
   * @param req Request
   * @param res Response
   */
  async getCasesByCourt(req: Request, res: Response): Promise<void> {
    try {
      const { court } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get cases
      const result = await caseService.getCasesByCourt(
        req.tenant.id,
        court,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting cases by court', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Search cases
   * @param req Request
   * @param res Response
   */
  async searchCases(req: Request, res: Response): Promise<void> {
    try {
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
      
      // Search cases
      const result = await caseService.searchCases(
        req.tenant.id,
        searchTerm as string,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error searching cases', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get upcoming hearings
   * @param req Request
   * @param res Response
   */
  async getUpcomingHearings(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get upcoming hearings
      const result = await caseService.getUpcomingHearings(
        req.tenant.id,
        days,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting upcoming hearings', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add timeline event
   * @param req Request
   * @param res Response
   */
  async addTimelineEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(timelineEventSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Add timeline event
      const caseInstance = await caseService.addTimelineEvent(
        id,
        value as any,
        req.tenantConnection
      );
      
      if (!caseInstance) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      
      res.status(200).json(caseInstance);
    } catch (error) {
      logger.error('Error adding timeline event', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update case status
   * @param req Request
   * @param res Response
   */
  async updateCaseStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!status || !['pending', 'active', 'on_hold', 'closed', 'archived'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Update case status
      const caseInstance = await caseService.updateCaseStatus(
        id,
        status as any,
        req.tenantConnection
      );
      
      if (!caseInstance) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      
      res.status(200).json(caseInstance);
    } catch (error) {
      logger.error('Error updating case status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CaseController();