import { Request, Response } from 'express';
import courtProceedingService from '../../services/court-management/court-proceeding.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';

// Court proceeding validation schemas
const createCourtProceedingSchema = Joi.object({
  title: Joi.string().required(),
  date: Joi.date().required(),
  time: Joi.string().optional(),
  type: Joi.string().required(),
  courtRoom: Joi.string().optional(),
  judge: Joi.string().optional(),
  description: Joi.string().optional(),
  notes: Joi.string().optional(),
  caseId: Joi.string().uuid().required(),
  attendees: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      role: Joi.string().required(),
      type: Joi.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
      present: Joi.boolean().default(false),
      notes: Joi.string().optional(),
    })
  ).optional(),
  documents: Joi.array().items(
    Joi.object({
      documentId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      status: Joi.string().valid('pending', 'submitted', 'accepted', 'rejected').default('pending'),
      notes: Joi.string().optional(),
    })
  ).optional(),
  tasks: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      dueDate: Joi.date().required(),
      assignedTo: Joi.string().uuid().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      notes: Joi.string().optional(),
    })
  ).optional(),
  metadata: Joi.object().optional(),
});

const updateCourtProceedingSchema = Joi.object({
  title: Joi.string().optional(),
  date: Joi.date().optional(),
  time: Joi.string().optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').optional(),
  type: Joi.string().optional(),
  courtRoom: Joi.string().optional(),
  judge: Joi.string().optional(),
  description: Joi.string().optional(),
  notes: Joi.string().optional(),
  nextDate: Joi.date().optional(),
  outcome: Joi.string().optional(),
  attendees: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().optional(),
      name: Joi.string().required(),
      role: Joi.string().required(),
      type: Joi.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
      present: Joi.boolean().required(),
      notes: Joi.string().optional(),
    })
  ).optional(),
  documents: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().optional(),
      documentId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      status: Joi.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
      notes: Joi.string().optional(),
    })
  ).optional(),
  tasks: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().optional(),
      title: Joi.string().required(),
      description: Joi.string().optional(),
      dueDate: Joi.date().required(),
      assignedTo: Joi.string().uuid().required(),
      status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      notes: Joi.string().optional(),
    })
  ).optional(),
  metadata: Joi.object().optional(),
});

const addAttendeeSchema = Joi.object({
  name: Joi.string().required(),
  role: Joi.string().required(),
  type: Joi.string().valid('lawyer', 'client', 'witness', 'judge', 'clerk', 'expert', 'other').required(),
  present: Joi.boolean().required(),
  notes: Joi.string().optional(),
});

const addDocumentSchema = Joi.object({
  documentId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
  status: Joi.string().valid('pending', 'submitted', 'accepted', 'rejected').required(),
  notes: Joi.string().optional(),
});

const addTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  dueDate: Joi.date().required(),
  assignedTo: Joi.string().uuid().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required(),
  notes: Joi.string().optional(),
});

const addNoteSchema = Joi.object({
  note: Joi.string().required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled').required(),
});

const setNextHearingDateSchema = Joi.object({
  nextDate: Joi.date().required(),
});

const recordOutcomeSchema = Joi.object({
  outcome: Joi.string().required(),
});

export class CourtProceedingController {
  /**
   * Create a new court proceeding
   * @param req Request
   * @param res Response
   */
  async createCourtProceeding(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createCourtProceedingSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Create court proceeding
      const proceeding = await courtProceedingService.createCourtProceeding({
        ...(value as any),
        tenantId: req.tenant.id,
        createdBy: userId,
      }, req.tenantConnection);
      
      res.status(201).json(proceeding);
    } catch (error) {
      logger.error('Error creating court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get court proceeding by ID
   * @param req Request
   * @param res Response
   */
  async getCourtProceedingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get court proceeding
      const proceeding = await courtProceedingService.getCourtProceedingById(id, req.tenantConnection);
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error getting court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update court proceeding
   * @param req Request
   * @param res Response
   */
  async updateCourtProceeding(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateCourtProceedingSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Update court proceeding
      const proceeding = await courtProceedingService.updateCourtProceeding(
        id,
        value as any,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error updating court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete court proceeding
   * @param req Request
   * @param res Response
   */
  async deleteCourtProceeding(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Delete court proceeding
      const deleted = await courtProceedingService.deleteCourtProceeding(id, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get court proceedings by case
   * @param req Request
   * @param res Response
   */
  async getCourtProceedingsByCase(req: Request, res: Response): Promise<void> {
    try {
      const { caseId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get court proceedings
      const result = await courtProceedingService.getCourtProceedingsByCaseId(
        caseId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting court proceedings by case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get upcoming court proceedings
   * @param req Request
   * @param res Response
   */
  async getUpcomingCourtProceedings(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get upcoming court proceedings
      const result = await courtProceedingService.getUpcomingCourtProceedings(
        req.tenant.id,
        days,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting upcoming court proceedings', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get court proceedings by status
   * @param req Request
   * @param res Response
   */
  async getCourtProceedingsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Validate status
      if (!['scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get court proceedings by status
      const result = await courtProceedingService.getCourtProceedingsByStatus(
        req.tenant.id,
        status as any,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting court proceedings by status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add attendee to court proceeding
   * @param req Request
   * @param res Response
   */
  async addAttendee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(addAttendeeSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Add attendee
      const proceeding = await courtProceedingService.addAttendee(
        id,
        value as any,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error adding attendee to court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add document to court proceeding
   * @param req Request
   * @param res Response
   */
  async addDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(addDocumentSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Add document
      const proceeding = await courtProceedingService.addDocument(
        id,
        value as any,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error adding document to court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add task to court proceeding
   * @param req Request
   * @param res Response
   */
  async addTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(addTaskSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Add task
      const proceeding = await courtProceedingService.addTask(
        id,
        value as any,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error adding task to court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update court proceeding status
   * @param req Request
   * @param res Response
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateStatusSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Update status
      const proceeding = await courtProceedingService.updateStatus(
        id,
        (value as any).status,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error updating court proceeding status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add note to court proceeding
   * @param req Request
   * @param res Response
   */
  async addNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(addNoteSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Add note
      const proceeding = await courtProceedingService.addNote(
        id,
        (value as any).note,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error adding note to court proceeding', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Set next hearing date
   * @param req Request
   * @param res Response
   */
  async setNextHearingDate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(setNextHearingDateSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Set next hearing date
      const proceeding = await courtProceedingService.setNextHearingDate(
        id,
        (value as any).nextDate,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error setting next hearing date', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Record outcome
   * @param req Request
   * @param res Response
   */
  async recordOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(recordOutcomeSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
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
      
      // Record outcome
      const proceeding = await courtProceedingService.recordOutcome(
        id,
        (value as any).outcome,
        userId,
        req.tenantConnection
      );
      
      if (!proceeding) {
        res.status(404).json({ error: 'Court proceeding not found' });
        return;
      }
      
      res.status(200).json(proceeding);
    } catch (error) {
      logger.error('Error recording outcome', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CourtProceedingController();
