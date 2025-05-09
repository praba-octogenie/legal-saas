import { LegalResearch } from '../../models/legal-research.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, Op } from 'sequelize';
import { Case } from '../../models/case.model';
import { User } from '../../models/user.model';

export interface CreateLegalResearchDto {
  title: string;
  description?: string;
  query?: string;
  type: string;
  keywords?: string[];
  sources?: string[];
  tenantId: string;
  createdBy: string;
  caseId?: string;
  filters?: {
    courts?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    jurisdiction?: string[];
    judges?: string[];
    resultType?: string[];
    customFilters?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface UpdateLegalResearchDto {
  title?: string;
  description?: string;
  query?: string;
  status?: 'in_progress' | 'completed' | 'archived';
  type?: string;
  keywords?: string[];
  sources?: string[];
  caseId?: string;
  filters?: {
    courts?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    jurisdiction?: string[];
    judges?: string[];
    resultType?: string[];
    customFilters?: Record<string, any>;
  };
  analysis?: {
    summary?: string;
    keyPoints?: string[];
    recommendations?: string[];
    generatedAt?: Date;
  };
  metadata?: Record<string, any>;
}

export interface SearchResultDto {
  title: string;
  source: string;
  citation?: string;
  url?: string;
  snippet?: string;
  relevanceScore?: number;
  notes?: string;
}

export interface SearchQueryDto {
  query: string;
  source: string;
  filters?: {
    courts?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    jurisdiction?: string[];
    judges?: string[];
    resultType?: string[];
    customFilters?: Record<string, any>;
  };
}

export class LegalResearchService {
  /**
   * Create a new legal research
   * @param researchData Legal research data
   * @param connection Sequelize connection
   * @returns Created legal research
   */
  async createLegalResearch(researchData: CreateLegalResearchDto, connection: Sequelize): Promise<LegalResearch> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      // Create legal research
      const research = await LegalResearchModel.create({
        title: researchData.title,
        description: researchData.description,
        query: researchData.query,
        status: 'in_progress',
        type: researchData.type,
        keywords: researchData.keywords || [],
        sources: researchData.sources || [],
        tenantId: researchData.tenantId,
        createdBy: researchData.createdBy,
        caseId: researchData.caseId,
        results: [],
        history: [],
        filters: researchData.filters || {},
        metadata: researchData.metadata || {},
      });
      
      logger.info(`Legal research created: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error('Error creating legal research', error);
      throw error;
    }
  }
  
  /**
   * Get legal research by ID
   * @param researchId Legal research ID
   * @param connection Sequelize connection
   * @returns Legal research
   */
  async getLegalResearchById(researchId: string, connection: Sequelize): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const UserModel = connection.model(User.name) as typeof User;
      
      return await LegalResearchModel.findByPk(researchId, {
        include: [
          { model: CaseModel, as: 'case' },
          { model: UserModel, as: 'creator' },
        ],
      }) as LegalResearch | null;
    } catch (error) {
      logger.error(`Error getting legal research by ID: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Update legal research
   * @param researchId Legal research ID
   * @param updateData Update data
   * @param connection Sequelize connection
   * @returns Updated legal research
   */
  async updateLegalResearch(
    researchId: string,
    updateData: UpdateLegalResearchDto,
    connection: Sequelize
  ): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // Update legal research
      await research.update(updateData);
      
      logger.info(`Legal research updated: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error updating legal research: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete legal research
   * @param researchId Legal research ID
   * @param connection Sequelize connection
   * @returns True if legal research was deleted
   */
  async deleteLegalResearch(researchId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return false;
      }
      
      // Delete legal research
      await research.destroy();
      
      logger.info(`Legal research deleted: ${research.title} (${research.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting legal research: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Get legal researches by tenant ID
   * @param tenantId Tenant ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Legal researches
   */
  async getLegalResearchesByTenantId(
    tenantId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ researches: LegalResearch[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await LegalResearchModel.findAndCountAll({
        where: { tenantId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        researches: rows as LegalResearch[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting legal researches by tenant ID: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get legal researches by case ID
   * @param caseId Case ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Legal researches
   */
  async getLegalResearchesByCaseId(
    caseId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ researches: LegalResearch[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await LegalResearchModel.findAndCountAll({
        where: { caseId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        researches: rows as LegalResearch[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting legal researches by case ID: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Search legal database
   * @param researchId Legal research ID
   * @param searchData Search data
   * @param userId User ID
   * @param connection Sequelize connection
   * @returns Updated legal research with search results
   */
  async searchLegalDatabase(
    researchId: string,
    searchData: SearchQueryDto,
    userId: string,
    connection: Sequelize
  ): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // In a real implementation, this would connect to external legal databases
      // For now, we'll simulate search results
      const simulatedResults = this.simulateSearchResults(searchData.query, searchData.source);
      
      // Create history entry
      const historyEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        query: searchData.query,
        source: searchData.source,
        resultsCount: simulatedResults.length,
        userId,
      };
      
      // Add results to research
      const newResults = simulatedResults.map(result => ({
        ...result,
        id: uuidv4(),
        savedAt: new Date(),
      }));
      
      // Update filters if provided
      const filters = searchData.filters || research.filters;
      
      // Update legal research
      await research.update({
        results: [...research.results, ...newResults],
        history: [...research.history, historyEntry],
        filters,
      });
      
      logger.info(`Legal database searched: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error searching legal database: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Generate analysis for legal research
   * @param researchId Legal research ID
   * @param connection Sequelize connection
   * @returns Updated legal research with analysis
   */
  async generateAnalysis(researchId: string, connection: Sequelize): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // In a real implementation, this would use AI to analyze the search results
      // For now, we'll simulate analysis
      const simulatedAnalysis = {
        summary: `Analysis of ${research.results.length} results related to "${research.query}"`,
        keyPoints: [
          'Key point 1 based on search results',
          'Key point 2 based on search results',
          'Key point 3 based on search results',
        ],
        recommendations: [
          'Recommendation 1 based on analysis',
          'Recommendation 2 based on analysis',
        ],
        generatedAt: new Date(),
      };
      
      // Update legal research
      await research.update({
        analysis: simulatedAnalysis,
        status: 'completed',
      });
      
      logger.info(`Analysis generated for legal research: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error generating analysis: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Add result to legal research
   * @param researchId Legal research ID
   * @param resultData Result data
   * @param connection Sequelize connection
   * @returns Updated legal research
   */
  async addResult(
    researchId: string,
    resultData: SearchResultDto,
    connection: Sequelize
  ): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // Create new result
      const newResult = {
        ...resultData,
        id: uuidv4(),
        savedAt: new Date(),
      };
      
      // Update legal research
      await research.update({
        results: [...research.results, newResult],
      });
      
      logger.info(`Result added to legal research: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error adding result to legal research: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Remove result from legal research
   * @param researchId Legal research ID
   * @param resultId Result ID
   * @param connection Sequelize connection
   * @returns Updated legal research
   */
  async removeResult(
    researchId: string,
    resultId: string,
    connection: Sequelize
  ): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // Remove result
      const updatedResults = research.results.filter(result => result.id !== resultId);
      
      // Update legal research
      await research.update({
        results: updatedResults,
      });
      
      logger.info(`Result removed from legal research: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error removing result from legal research: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Update result notes
   * @param researchId Legal research ID
   * @param resultId Result ID
   * @param notes Notes
   * @param connection Sequelize connection
   * @returns Updated legal research
   */
  async updateResultNotes(
    researchId: string,
    resultId: string,
    notes: string,
    connection: Sequelize
  ): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // Update result notes
      const updatedResults = research.results.map(result => {
        if (result.id === resultId) {
          return { ...result, notes };
        }
        return result;
      });
      
      // Update legal research
      await research.update({
        results: updatedResults,
      });
      
      logger.info(`Result notes updated in legal research: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error updating result notes: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Archive legal research
   * @param researchId Legal research ID
   * @param connection Sequelize connection
   * @returns Updated legal research
   */
  async archiveLegalResearch(researchId: string, connection: Sequelize): Promise<LegalResearch | null> {
    try {
      // Set the model to use the tenant connection
      const LegalResearchModel = connection.model(LegalResearch.name) as typeof LegalResearch;
      
      const research = await LegalResearchModel.findByPk(researchId) as LegalResearch | null;
      
      if (!research) {
        return null;
      }
      
      // Update legal research
      await research.update({
        status: 'archived',
      });
      
      logger.info(`Legal research archived: ${research.title} (${research.id})`);
      
      return research;
    } catch (error) {
      logger.error(`Error archiving legal research: ${researchId}`, error);
      throw error;
    }
  }
  
  /**
   * Simulate search results for demonstration purposes
   * @param query Search query
   * @param source Source database
   * @returns Simulated search results
   */
  private simulateSearchResults(query: string, source: string): SearchResultDto[] {
    // In a real implementation, this would connect to external legal databases
    // For now, we'll return simulated results
    const results: SearchResultDto[] = [
      {
        title: `${source} Result 1 for "${query}"`,
        source,
        citation: 'AIR 2020 SC 1234',
        url: 'https://example.com/result1',
        snippet: `This is a snippet from the first result that matches the query "${query}"...`,
        relevanceScore: 0.95,
      },
      {
        title: `${source} Result 2 for "${query}"`,
        source,
        citation: 'AIR 2019 SC 5678',
        url: 'https://example.com/result2',
        snippet: `Another snippet from the second result that matches the query "${query}"...`,
        relevanceScore: 0.85,
      },
      {
        title: `${source} Result 3 for "${query}"`,
        source,
        citation: 'AIR 2018 SC 9012',
        url: 'https://example.com/result3',
        snippet: `A third snippet from the third result that matches the query "${query}"...`,
        relevanceScore: 0.75,
      },
    ];
    
    return results;
  }
}

export default new LegalResearchService();