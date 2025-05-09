import { CourtProceeding } from '../../models/court-proceeding.model';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, Op } from 'sequelize';
import { Case } from '../../models/case.model';
import { User } from '../../models/user.model';

export interface CreateCourtProceedingDto {
  title: string;
  date: Date;
  time?: string;
  type: string;
  courtRoom?: string;
  judge?: string;
  description?: string;
  notes?: string;
  tenantId: string;
  caseId: string;
  createdBy: string;
  attendees?: {
    name: string;
    role: string;
    type: 'lawyer' | 'client' | 'witness' | 'judge' | 'clerk' | 'expert' | 'other';
    present?: boolean;
    notes?: string;
  }[];
  documents?: {
    documentId: string;
    name: string;
    type: string;
    status?: 'pending' | 'submitted' | 'accepted' | 'rejected';
    notes?: string;
  }[];
  tasks?: {
    title: string;
    description?: string;
    dueDate: Date;
    assignedTo: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }[];
  metadata?: Record<string, any>;
}

export interface UpdateCourtProceedingDto {
  title?: string;
  date?: Date;
  time?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled';
  type?: string;
  courtRoom?: string;
  judge?: string;
  description?: string;
  notes?: string;
  nextDate?: Date;
  outcome?: string;
  attendees?: {
    id?: string;
    name: string;
    role: string;
    type: 'lawyer' | 'client' | 'witness' | 'judge' | 'clerk' | 'expert' | 'other';
    present: boolean;
    notes?: string;
  }[];
  documents?: {
    id?: string;
    documentId: string;
    name: string;
    type: string;
    status: 'pending' | 'submitted' | 'accepted' | 'rejected';
    notes?: string;
  }[];
  tasks?: {
    id?: string;
    title: string;
    description?: string;
    dueDate: Date;
    assignedTo: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    completedAt?: Date;
    completedBy?: string;
    notes?: string;
  }[];
  metadata?: Record<string, any>;
}

export interface AddAttendeeDto {
  name: string;
  role: string;
  type: 'lawyer' | 'client' | 'witness' | 'judge' | 'clerk' | 'expert' | 'other';
  present: boolean;
  notes?: string;
}

export interface AddDocumentDto {
  documentId: string;
  name: string;
  type: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  notes?: string;
}

export interface AddTaskDto {
  title: string;
  description?: string;
  dueDate: Date;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export class CourtProceedingService {
  /**
   * Create a new court proceeding
   * @param proceedingData Court proceeding data
   * @param connection Sequelize connection
   * @returns Created court proceeding
   */
  async createCourtProceeding(proceedingData: CreateCourtProceedingDto, connection: Sequelize): Promise<CourtProceeding> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      // Process attendees
      const attendees = proceedingData.attendees?.map(attendee => ({
        ...attendee,
        id: uuidv4(),
        present: attendee.present || false,
      })) || [];
      
      // Process documents
      const documents = proceedingData.documents?.map(document => ({
        ...document,
        id: uuidv4(),
        status: document.status || 'pending',
      })) || [];
      
      // Process tasks
      const tasks = proceedingData.tasks?.map(task => ({
        ...task,
        id: uuidv4(),
        status: 'pending',
        priority: task.priority || 'medium',
      })) || [];
      
      // Create initial timeline event
      const initialTimelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: 'Court proceeding created',
        type: 'status_change' as const,
        userId: proceedingData.createdBy,
      };
      
      // Create court proceeding
      const proceeding = await CourtProceedingModel.create({
        title: proceedingData.title,
        date: proceedingData.date,
        time: proceedingData.time,
        status: 'scheduled',
        type: proceedingData.type,
        courtRoom: proceedingData.courtRoom,
        judge: proceedingData.judge,
        description: proceedingData.description,
        notes: proceedingData.notes,
        tenantId: proceedingData.tenantId,
        caseId: proceedingData.caseId,
        createdBy: proceedingData.createdBy,
        attendees,
        documents,
        tasks,
        timeline: [initialTimelineEvent],
        metadata: proceedingData.metadata || {},
      });
      
      logger.info(`Court proceeding created: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error('Error creating court proceeding', error);
      throw error;
    }
  }
  
  /**
   * Get court proceeding by ID
   * @param proceedingId Court proceeding ID
   * @param connection Sequelize connection
   * @returns Court proceeding
   */
  async getCourtProceedingById(proceedingId: string, connection: Sequelize): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const UserModel = connection.model(User.name) as typeof User;
      
      return await CourtProceedingModel.findByPk(proceedingId, {
        include: [
          { model: CaseModel, as: 'case' },
          { model: UserModel, as: 'creator' },
        ],
      }) as CourtProceeding | null;
    } catch (error) {
      logger.error(`Error getting court proceeding by ID: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Update court proceeding
   * @param proceedingId Court proceeding ID
   * @param updateData Update data
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async updateCourtProceeding(
    proceedingId: string,
    updateData: UpdateCourtProceedingDto,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Process attendees if provided
      if (updateData.attendees) {
        const existingAttendees = proceeding.attendees || [];
        const updatedAttendees = updateData.attendees.map(attendee => {
          if (attendee.id) {
            // Update existing attendee
            const existingIndex = existingAttendees.findIndex(a => a.id === attendee.id);
            if (existingIndex >= 0) {
              return { ...existingAttendees[existingIndex], ...attendee };
            }
          }
          // Add new attendee
          return { ...attendee, id: uuidv4() };
        });
        updateData.attendees = updatedAttendees;
      }
      
      // Process documents if provided
      if (updateData.documents) {
        const existingDocuments = proceeding.documents || [];
        const updatedDocuments = updateData.documents.map(document => {
          if (document.id) {
            // Update existing document
            const existingIndex = existingDocuments.findIndex(d => d.id === document.id);
            if (existingIndex >= 0) {
              return { ...existingDocuments[existingIndex], ...document };
            }
          }
          // Add new document
          return { ...document, id: uuidv4() };
        });
        updateData.documents = updatedDocuments;
      }
      
      // Process tasks if provided
      if (updateData.tasks) {
        const existingTasks = proceeding.tasks || [];
        const updatedTasks = updateData.tasks.map(task => {
          if (task.id) {
            // Update existing task
            const existingIndex = existingTasks.findIndex(t => t.id === task.id);
            if (existingIndex >= 0) {
              // Check if task is being completed
              if (task.status === 'completed' && existingTasks[existingIndex].status !== 'completed') {
                task.completedAt = new Date();
                task.completedBy = userId;
              }
              return { ...existingTasks[existingIndex], ...task };
            }
          }
          // Add new task
          return { ...task, id: uuidv4(), status: task.status || 'pending' };
        });
        updateData.tasks = updatedTasks;
      }
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: 'Court proceeding updated',
        type: 'status_change' as const,
        userId,
      };
      
      // Add status change to timeline if status is changing
      if (updateData.status && updateData.status !== proceeding.status) {
        timelineEvent.title = `Status changed from ${proceeding.status} to ${updateData.status}`;
      }
      
      // Update court proceeding
      await proceeding.update({
        ...updateData,
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Court proceeding updated: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error updating court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete court proceeding
   * @param proceedingId Court proceeding ID
   * @param connection Sequelize connection
   * @returns True if court proceeding was deleted
   */
  async deleteCourtProceeding(proceedingId: string, connection: Sequelize): Promise<boolean> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return false;
      }
      
      // Delete court proceeding
      await proceeding.destroy();
      
      logger.info(`Court proceeding deleted: ${proceeding.title} (${proceeding.id})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Get court proceedings by case ID
   * @param caseId Case ID
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Court proceedings
   */
  async getCourtProceedingsByCaseId(
    caseId: string,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ proceedings: CourtProceeding[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CourtProceedingModel.findAndCountAll({
        where: { caseId },
        limit,
        offset,
        order: [['date', 'DESC']],
        include: [
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        proceedings: rows as CourtProceeding[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting court proceedings by case ID: ${caseId}`, error);
      throw error;
    }
  }
  
  /**
   * Get upcoming court proceedings
   * @param tenantId Tenant ID
   * @param days Number of days to look ahead
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Upcoming court proceedings
   */
  async getUpcomingCourtProceedings(
    tenantId: string,
    days: number = 7,
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ proceedings: CourtProceeding[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const UserModel = connection.model(User.name) as typeof User;
      
      // Calculate date range
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);
      
      const { count, rows } = await CourtProceedingModel.findAndCountAll({
        where: {
          tenantId,
          date: {
            [Op.gte]: today,
            [Op.lt]: endDate,
          },
          status: {
            [Op.in]: ['scheduled', 'in_progress'],
          },
        },
        limit,
        offset,
        order: [['date', 'ASC']],
        include: [
          { model: CaseModel, as: 'case' },
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        proceedings: rows as CourtProceeding[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting upcoming court proceedings`, error);
      throw error;
    }
  }
  
  /**
   * Get court proceedings by status
   * @param tenantId Tenant ID
   * @param status Status
   * @param limit Limit
   * @param offset Offset
   * @param connection Sequelize connection
   * @returns Court proceedings
   */
  async getCourtProceedingsByStatus(
    tenantId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled',
    limit: number = 10,
    offset: number = 0,
    connection: Sequelize
  ): Promise<{ proceedings: CourtProceeding[]; total: number }> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      const CaseModel = connection.model(Case.name) as typeof Case;
      const UserModel = connection.model(User.name) as typeof User;
      
      const { count, rows } = await CourtProceedingModel.findAndCountAll({
        where: { tenantId, status },
        limit,
        offset,
        order: [['date', 'DESC']],
        include: [
          { model: CaseModel, as: 'case' },
          { model: UserModel, as: 'creator' },
        ],
      });
      
      return {
        proceedings: rows as CourtProceeding[],
        total: count,
      };
    } catch (error) {
      logger.error(`Error getting court proceedings by status: ${status}`, error);
      throw error;
    }
  }
  
  /**
   * Add attendee to court proceeding
   * @param proceedingId Court proceeding ID
   * @param attendeeData Attendee data
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async addAttendee(
    proceedingId: string,
    attendeeData: AddAttendeeDto,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create new attendee
      const newAttendee = {
        ...attendeeData,
        id: uuidv4(),
      };
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: `Attendee added: ${attendeeData.name} (${attendeeData.role})`,
        type: 'attendee_added' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        attendees: [...proceeding.attendees, newAttendee],
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Attendee added to court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error adding attendee to court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Add document to court proceeding
   * @param proceedingId Court proceeding ID
   * @param documentData Document data
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async addDocument(
    proceedingId: string,
    documentData: AddDocumentDto,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create new document
      const newDocument = {
        ...documentData,
        id: uuidv4(),
      };
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: `Document added: ${documentData.name}`,
        type: 'document_added' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        documents: [...proceeding.documents, newDocument],
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Document added to court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error adding document to court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Add task to court proceeding
   * @param proceedingId Court proceeding ID
   * @param taskData Task data
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async addTask(
    proceedingId: string,
    taskData: AddTaskDto,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create new task
      const newTask = {
        ...taskData,
        id: uuidv4(),
        status: 'pending' as const,
      };
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: `Task added: ${taskData.title}`,
        type: 'task_added' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        tasks: [...proceeding.tasks, newTask],
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Task added to court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error adding task to court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Update court proceeding status
   * @param proceedingId Court proceeding ID
   * @param status New status
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async updateStatus(
    proceedingId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled',
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: `Status changed from ${proceeding.status} to ${status}`,
        type: 'status_change' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        status,
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Court proceeding status updated: ${proceeding.title} (${proceeding.id}) - ${status}`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error updating court proceeding status: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Add note to court proceeding
   * @param proceedingId Court proceeding ID
   * @param note Note text
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async addNote(
    proceedingId: string,
    note: string,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: 'Note added',
        description: note,
        type: 'note_added' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        notes: proceeding.notes ? `${proceeding.notes}\n\n${new Date().toISOString()}: ${note}` : `${new Date().toISOString()}: ${note}`,
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Note added to court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error adding note to court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Set next hearing date
   * @param proceedingId Court proceeding ID
   * @param nextDate Next hearing date
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async setNextHearingDate(
    proceedingId: string,
    nextDate: Date,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: `Next hearing date set to ${nextDate.toISOString().split('T')[0]}`,
        type: 'status_change' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        nextDate,
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Next hearing date set for court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error setting next hearing date for court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
  
  /**
   * Record outcome
   * @param proceedingId Court proceeding ID
   * @param outcome Outcome text
   * @param userId User ID (for timeline)
   * @param connection Sequelize connection
   * @returns Updated court proceeding
   */
  async recordOutcome(
    proceedingId: string,
    outcome: string,
    userId: string,
    connection: Sequelize
  ): Promise<CourtProceeding | null> {
    try {
      // Set the model to use the tenant connection
      const CourtProceedingModel = connection.model(CourtProceeding.name) as typeof CourtProceeding;
      
      const proceeding = await CourtProceedingModel.findByPk(proceedingId) as CourtProceeding | null;
      
      if (!proceeding) {
        return null;
      }
      
      // Create timeline event
      const timelineEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        title: 'Outcome recorded',
        description: outcome,
        type: 'status_change' as const,
        userId,
      };
      
      // Update court proceeding
      await proceeding.update({
        outcome,
        status: 'completed',
        timeline: [...proceeding.timeline, timelineEvent],
      });
      
      logger.info(`Outcome recorded for court proceeding: ${proceeding.title} (${proceeding.id})`);
      
      return proceeding;
    } catch (error) {
      logger.error(`Error recording outcome for court proceeding: ${proceedingId}`, error);
      throw error;
    }
  }
}

export default new CourtProceedingService();