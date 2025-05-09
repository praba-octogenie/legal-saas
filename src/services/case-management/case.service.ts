import { Case } from '../../models/case.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, Op } from 'sequelize';
import { Client } from '../../models/client.model';
import { User } from '../../models/user.model';

export interface CreateCaseDto {
  title: string;
  caseNumber?: string;
  description?: string;
  type: string;
  subType?: string;
  court: string;
  courtBranch?: string;
  judge?: string;
  opposingCounsel?: string;
  filingDate?: Date;
  nextHearingDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tenantId: string;
  clientId: string;
  assignedTo: string;
  parties?: {
    name: string;
    type: 'plaintiff' | 'defendant' | 'respondent' | 'petitioner' | 'appellant' | 'witness' | 'third_party' | 'other';
    role: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    counsel?: string;
  }[];
  timeline?: {
    date: Date;
    title: string;
    description?: string;
    type: 'filing' | 'hearing' | 'order' | 'judgment' | 'submission' | 'other';
    status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    documents?: string[];
  }[];
  team?: {
    userId: string;
    role: 'lead' | 'associate' | 'paralegal' | 'consultant' | 'admin';
    permissions: string[];
  }[];
  courtDetails?: {
    courtId?: string;
    courtType?: string;
    jurisdiction?: string;
    bench?: string;
    courtRoom?: string;
    filingNumber?: string;
    cnrNumber?: string;
  };
  fees?: {
    billingType?: 'hourly' | 'fixed' | 'contingency' | 'retainer';
    estimatedAmount?: number;
    currency?: string;
    ratePerHour?: number;
    retainerAmount?: number;
    contingencyPercentage?: number;
  };
  metadata?: Record<string, any>;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  status?: 'pending' | 'active' | 'on_hold' | 'closed' | 'archived';
  type?: string;
  subType?: string;
  court?: string;
  courtBranch?: string;
  judge?: string;
  opposingCounsel?: string;
  filingDate?: Date;
  nextHearingDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  clientId?: string;
  assignedTo?: string;
  parties?: {
    id?: string;
    name: string;
    type: 'plaintiff' | 'defendant' | 'respondent' | 'petitioner' | 'appellant' | 'witness' | 'third_party' | 'other';
    role: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    counsel?: string;
  }[];
  timeline?: {
    id?: string;
    date: Date;
    title: string;
    description?: string;
    type: 'filing' | 'hearing' | 'order' | 'judgment' | 'submission' | 'other';
    status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    documents?: string[];
  }[];
  team?: {
    userId: string;
    role: 'lead' | 'associate' | 'paralegal' | 'consultant' | 'admin';
    permissions: string[];
  }[];
  courtDetails?: {
    courtId?: string;
    courtType?: string;
    jurisdiction?: string;
    bench?: string;
    courtRoom?: string;
    filingNumber?: string;
    cnrNumber?: string;
  };
  fees?: {
    billingType?: 'hourly' | 'fixed' | 'contingency' | 'retainer';
    estimatedAmount?: number;
    currency?: string;
    ratePerHour?: number;
    retainerAmount?: number;
    contingencyPercentage?: number;
  };
  metadata?: Record<string, any>;
}

export class CaseService {
  /**
   * Generate a unique case number
   * @param tenantId Tenant ID
   * @param connection Sequelize connection
   * @returns Unique case number
   */
  private async generateCaseNumber(tenantId: string, connection: Sequelize): Promise<string> {
    const CaseModel = connection.model(Case.name) as typeof Case;
    
    // Get current year
    const year = new Date().getFullYear();
    
    // Get count of cases for this tenant in the current year
    const count = await CaseModel.count({
      where: {
        tenantId,
        createdAt: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lt]: new Date(`${year + 1}-01-01`),
        },
      },
    });
    
    // Generate case number in format: TENANT-YEAR-SEQUENCE
    // Extract first 3 characters of tenant ID
    const tenantPrefix = tenantId.substring(0, 3).toUpperCase();
    
    // Format sequence with leading zeros
    const sequence = (count + 1).toString().padStart(5, '0');
    
    return `${tenantPrefix}-${year}-${sequence}`;
  }

  /**
   * Create a new case
   * @param caseData Case data
   * @param connection Sequelize connection
   * @returns Created case
   */
  async createCase(caseData: CreateCaseDto, connection: Sequelize): Promise<Case> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      // Generate case number if not provided
      const caseNumber = caseData.caseNumber || await this.generateCaseNumber(caseData.tenantId, connection);
      
      // Process parties
      const parties = caseData.parties?.map(party => ({
        ...party,
        id: uuidv4(),
      })) || [];
      
      // Process timeline events
      const timeline = caseData.timeline?.map(event => ({
        ...event,
        id: uuidv4(),
      })) || [];
      
      // Create case
      const caseInstance = await CaseModel.create({
        title: caseData.title,
        caseNumber,
        description: caseData.description,
        status: 'pending',
        type: caseData.type,
        subType: caseData.subType,
        court: caseData.court,
        courtBranch: caseData.courtBranch,
        judge: caseData.judge,
        opposingCounsel: caseData.opposingCounsel,
        filingDate: caseData.filingDate,
        nextHearingDate: caseData.nextHearingDate,
        priority: caseData.priority,
        tenantId: caseData.tenantId,
        clientId: caseData.clientId,
        assignedTo: caseData.assignedTo,
        parties,
        timeline,
        team: caseData.team || [{
          userId: caseData.assignedTo,
          role: 'lead',
          permissions: ['*'],
        }],
        courtDetails: caseData.courtDetails || {},
        fees: caseData.fees || {},
        metadata: caseData.metadata || {},
      });
      
      logger.info(`Case created: ${caseInstance.title} (${caseInstance.id})`);
      
      return caseInstance;
    } catch (error) {
      logger.error('Error creating case', error);
      throw error;
    }
  }
  
  /**
   * Get case by ID
   * @param caseId Case ID
   * @param connection Sequelize connection
   * @returns Case
   */
  async getCaseById(caseId: string, connection: Sequelize): Promise<Case | null> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      return await CaseModel.findByPk(caseId, {
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      }) as Case | null;
    } catch (error) {
      logger.error(`Error getting case by ID: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Update case
   * @param caseId Case ID
   * @param updateData Update data
   * @param connection Sequelize connection
   * @returns Updated case
   */
  async updateCase(caseId: string, updateData: UpdateCaseDto, connection: Sequelize): Promise<Case | null> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      const caseInstance = await CaseModel.findByPk(caseId) as Case | null;
      
      if (!caseInstance) {
        return null;
      }
      
      // Process parties if provided
      if (updateData.parties) {
        const existingParties = caseInstance.parties || [];
        const updatedParties = updateData.parties.map(party => {
          if (party.id) {
            // Update existing party
            const existingIndex = existingParties.findIndex(p => p.id === party.id);
            if (existingIndex >= 0) {
              return { ...existingParties[existingIndex], ...party };
            }
          }
          // Add new party
          return { ...party, id: uuidv4() };
        });
        updateData.parties = updatedParties;
      }
      
      // Process timeline events if provided
      if (updateData.timeline) {
        const existingEvents = caseInstance.timeline || [];
        const updatedEvents = updateData.timeline.map(event => {
          if (event.id) {
            // Update existing event
            const existingIndex = existingEvents.findIndex(e => e.id === event.id);
            if (existingIndex >= 0) {
              return { ...existingEvents[existingIndex], ...event };
            }
          }
          // Add new event
          return { ...event, id: uuidv4() };
        });
        updateData.timeline = updatedEvents;
      }
      
      // Update case
      await caseInstance.update(updateData);
      
      logger.info(`Case updated: ${caseInstance.title} (${caseInstance.id})`);
      
      return caseInstance;
    } catch (error) {
      logger.error(`Error updating case: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete case
   * @param caseId Case ID
   * @param connection Sequelize connection
   * @returns True if case was deleted
   */
  async deleteCase(caseId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      const caseInstance = await CaseModel.findByPk(caseId) as Case | null;
      
      if (!caseInstance) {
        return false;
      }
      
      // Delete case
      await caseInstance.destroy();
      
      logger.info(`Case deleted: ${caseInstance.title} (${caseInstance.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting case: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all cases for a tenant
   * @param tenantId Tenant ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async getCasesByTenantId(
    tenantId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: { tenantId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting cases by tenant ID: ${tenantId}`, error);
      throw error;
    }
  }
  
  /**
   * Get cases by client ID
   * @param clientId Client ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async getCasesByClientId(
    clientId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: { clientId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting cases by client ID: ${clientId}`, error);
      throw error;
    }
  }
  
  /**
   * Get cases by assigned user ID
   * @param userId User ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async getCasesByAssignedUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: { assignedTo: userId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: ClientModel, as: 'client' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting cases by assigned user ID: ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Get cases by status
   * @param tenantId Tenant ID
   * @param status Status
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async getCasesByStatus(
    tenantId: string,
    status: 'pending' | 'active' | 'on_hold' | 'closed' | 'archived',
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: { tenantId, status },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting cases by status: ${status}`, error);
      throw error;
    }
  }
  
  /**
   * Get cases by court
   * @param tenantId Tenant ID
   * @param court Court
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async getCasesByCourt(
    tenantId: string,
    court: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: { tenantId, court },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting cases by court: ${court}`, error);
      throw error;
    }
  }
  
  /**
   * Search cases
   * @param tenantId Tenant ID
   * @param searchTerm Search term
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases
   */
  async searchCases(
    tenantId: string,
    searchTerm: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: {
          tenantId,
          [Op.or]: [
            { title: { [Op.iLike]: `%${searchTerm}%` } },
            { caseNumber: { [Op.iLike]: `%${searchTerm}%` } },
            { description: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error searching cases: ${searchTerm}`, error);
      throw error;
    }
  }
  
  /**
   * Get upcoming hearings
   * @param tenantId Tenant ID
   * @param days Number of days to look ahead
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Cases with upcoming hearings
   */
  async getUpcomingHearings(
    tenantId: string,
    days: number = 7,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ cases: Case[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      const ClientModel = connection.model(Client.name) as typeof Client;
      const UserModel = connection.model(User.name) as typeof User;
      
      // Calculate date range
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);
      
      const { count, rows } = await CaseModel.findAndCountAll({
        where: {
          tenantId,
          nextHearingDate: {
            [Op.gte]: today,
            [Op.lt]: endDate,
          },
        },
        limit,
        offset,
        order: [['nextHearingDate', 'ASC']],
        include: [
          { model: ClientModel, as: 'client' },
          { model: UserModel, as: 'assignedUser' },
        ],
      });
      
      return {
        cases: rows as Case[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting upcoming hearings`, error);
      throw error;
    }
  }
  
  /**
   * Add timeline event to case
   * @param caseId Case ID
   * @param event Timeline event
   * @param connection Sequelize connection
   * @returns Updated case
   */
  async addTimelineEvent(
    caseId: string,
    event: {
      date: Date;
      title: string;
      description?: string;
      type: 'filing' | 'hearing' | 'order' | 'judgment' | 'submission' | 'other';
      status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
      notes?: string;
      documents?: string[];
    },
    connection: Sequelize
  ): Promise<Case | null> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      const caseInstance = await CaseModel.findByPk(caseId) as Case | null;
      
      if (!caseInstance) {
        return null;
      }
      
      // Add event to timeline
      const timeline = [...caseInstance.timeline, { ...event, id: uuidv4() }];
      
      // Update case
      await caseInstance.update({ timeline });
      
      // If event is a hearing, update next hearing date
      if (event.type === 'hearing' && event.status === 'pending') {
        await caseInstance.update({ nextHearingDate: event.date });
      }
      
      logger.info(`Timeline event added to case: ${caseInstance.title} (${caseInstance.id})`);
      
      return caseInstance;
    } catch (error) {
      logger.error(`Error adding timeline event to case: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Update case status
   * @param caseId Case ID
   * @param status New status
   * @param connection Sequelize connection
   * @returns Updated case
   */
  async updateCaseStatus(
    caseId: string,
    status: 'pending' | 'active' | 'on_hold' | 'closed' | 'archived',
    connection: Sequelize
  ): Promise<Case | null> {
    try {
      // Set the model to use the tenant connection
      const CaseModel = connection.model(Case.name) as typeof Case;
      
      const caseInstance = await CaseModel.findByPk(caseId) as Case | null;
      
      if (!caseInstance) {
        return null;
      }
      
      // Update case status
      await caseInstance.update({ status });
      
      logger.info(`Case status updated: ${caseInstance.title} (${caseInstance.id}) - ${status}`);
      
      return caseInstance;
    } catch (error) {
      logger.error(`Error updating case status: ${caseId}`, error);
      throw error;
    }
  }
}

export default new CaseService();