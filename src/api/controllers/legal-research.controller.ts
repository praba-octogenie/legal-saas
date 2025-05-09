import { Request, Response } from 'express';
import legalResearchService from '../../services/legal-research/legal-research.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';
import { validateSchema } from '../../utils/validation';

// Legal research validation schemas
const createLegalResearchSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  query: Joi.string().optional(),
  type: Joi.string().valid('case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other').required(),
  keywords: Joi.array().items(Joi.string()).optional(),
  sources: Joi.array().items(Joi.string()).optional(),
  caseId: Joi.string().uuid().optional(),
  filters: Joi.object({
    courts: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      start: Joi.date().optional(),
      end: Joi.date().optional(),
    }).optional(),
    jurisdiction: Joi.array().items(Joi.string()).optional(),
    judges: Joi.array().items(Joi.string()).optional(),
    resultType: Joi.array().items(Joi.string()).optional(),
    customFilters: Joi.object().optional(),
  }).optional(),
  metadata: Joi.object().optional(),
});

const updateLegalResearchSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  query: Joi.string().optional(),
  status: Joi.string().valid('in_progress', 'completed', 'archived').optional(),
  type: Joi.string().valid('case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other').optional(),
  keywords: Joi.array().items(Joi.string()).optional(),
  sources: Joi.array().items(Joi.string()).optional(),
  caseId: Joi.string().uuid().optional().allow(null),
  filters: Joi.object({
    courts: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      start: Joi.date().optional(),
      end: Joi.date().optional(),
    }).optional(),
    jurisdiction: Joi.array().items(Joi.string()).optional(),
    judges: Joi.array().items(Joi.string()).optional(),
    resultType: Joi.array().items(Joi.string()).optional(),
    customFilters: Joi.object().optional(),
  }).optional(),
  analysis: Joi.object({
    summary: Joi.string().optional(),
    keyPoints: Joi.array().items(Joi.string()).optional(),
    recommendations: Joi.array().items(Joi.string()).optional(),
    generatedAt: Joi.date().optional(),
  }).optional(),
  metadata: Joi.object().optional(),
});

const searchQuerySchema = Joi.object({
  query: Joi.string().required(),
  source: Joi.string().required(),
  filters: Joi.object({
    courts: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      start: Joi.date().optional(),
      end: Joi.date().optional(),
    }).optional(),
    jurisdiction: Joi.array().items(Joi.string()).optional(),
    judges: Joi.array().items(Joi.string()).optional(),
    resultType: Joi.array().items(Joi.string()).optional(),
    customFilters: Joi.object().optional(),
  }).optional(),
});

const resultSchema = Joi.object({
  title: Joi.string().required(),
  source: Joi.string().required(),
  citation: Joi.string().optional(),
  url: Joi.string().optional(),
  snippet: Joi.string().optional(),
  relevanceScore: Joi.number().optional(),
  notes: Joi.string().optional(),
});

const updateResultNotesSchema = Joi.object({
  notes: Joi.string().required(),
});

export class LegalResearchController {
  /**
   * Create a new legal research
   * @param req Request
   * @param res Response
   */
  async createLegalResearch(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = validateSchema(createLegalResearchSchema, req.body);
      
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
      
      // Create legal research
      const research = await legalResearchService.createLegalResearch({
        ...(value as any),
        tenantId: req.tenant.id,
        createdBy: userId,
      }, req.tenantConnection);
      
      res.status(201).json(research);
    } catch (error) {
      logger.error('Error creating legal research', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get legal research by ID
   * @param req Request
   * @param res Response
   */
  async getLegalResearchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get legal research
      const research = await legalResearchService.getLegalResearchById(id, req.tenantConnection);
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error getting legal research', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update legal research
   * @param req Request
   * @param res Response
   */
  async updateLegalResearch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateLegalResearchSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Update legal research
      const research = await legalResearchService.updateLegalResearch(
        id,
        value as any,
        req.tenantConnection
      );
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error updating legal research', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Delete legal research
   * @param req Request
   * @param res Response
   */
  async deleteLegalResearch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Delete legal research
      const deleted = await legalResearchService.deleteLegalResearch(id, req.tenantConnection);
      
      if (!deleted) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting legal research', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get all legal researches
   * @param req Request
   * @param res Response
   */
  async getAllLegalResearches(req: Request, res: Response): Promise<void> {
    try {
      // Get query parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get legal researches
      const result = await legalResearchService.getLegalResearchesByTenantId(
        req.tenant.id,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting legal researches', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get legal researches by case
   * @param req Request
   * @param res Response
   */
  async getLegalResearchesByCase(req: Request, res: Response): Promise<void> {
    try {
      const { caseId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Get legal researches
      const result = await legalResearchService.getLegalResearchesByCaseId(
        caseId,
        limit,
        offset,
        req.tenantConnection
      );
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting legal researches by case', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Search legal database
   * @param req Request
   * @param res Response
   */
  async searchLegalDatabase(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(searchQuerySchema, req.body);
      
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
      
      // Search legal database
      const research = await legalResearchService.searchLegalDatabase(
        id,
        value as any,
        userId,
        req.tenantConnection
      );
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error searching legal database', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Generate analysis
   * @param req Request
   * @param res Response
   */
  async generateAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Generate analysis
      const research = await legalResearchService.generateAnalysis(id, req.tenantConnection);
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error generating analysis', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Add result
   * @param req Request
   * @param res Response
   */
  async addResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(resultSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Add result
      const research = await legalResearchService.addResult(
        id,
        value as any,
        req.tenantConnection
      );
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error adding result', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Remove result
   * @param req Request
   * @param res Response
   */
  async removeResult(req: Request, res: Response): Promise<void> {
    try {
      const { id, resultId } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Remove result
      const research = await legalResearchService.removeResult(
        id,
        resultId,
        req.tenantConnection
      );
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error removing result', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Update result notes
   * @param req Request
   * @param res Response
   */
  async updateResultNotes(req: Request, res: Response): Promise<void> {
    try {
      const { id, resultId } = req.params;
      
      // Validate request
      const { error, value } = validateSchema(updateResultNotesSchema, req.body);
      
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Update result notes
      const research = await legalResearchService.updateResultNotes(
        id,
        resultId,
        (value as any).notes,
        req.tenantConnection
      );
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error updating result notes', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Archive legal research
   * @param req Request
   * @param res Response
   */
  async archiveLegalResearch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get tenant connection
      if (!req.tenant || !req.tenantConnection) {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      // Archive legal research
      const research = await legalResearchService.archiveLegalResearch(id, req.tenantConnection);
      
      if (!research) {
        res.status(404).json({ error: 'Legal research not found' });
        return;
      }
      
      res.status(200).json(research);
    } catch (error) {
      logger.error('Error archiving legal research', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new LegalResearchController();