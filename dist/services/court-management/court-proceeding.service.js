"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtProceedingService = void 0;
const court_proceeding_model_1 = require("../../models/court-proceeding.model");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const case_model_1 = require("../../models/case.model");
const user_model_1 = require("../../models/user.model");
class CourtProceedingService {
    /**
     * Create a new court proceeding
     * @param proceedingData Court proceeding data
     * @param connection Sequelize connection
     * @returns Created court proceeding
     */
    async createCourtProceeding(proceedingData, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            // Process attendees
            const attendees = proceedingData.attendees?.map(attendee => ({
                ...attendee,
                id: (0, uuid_1.v4)(),
                present: attendee.present || false,
            })) || [];
            // Process documents
            const documents = proceedingData.documents?.map(document => ({
                ...document,
                id: (0, uuid_1.v4)(),
                status: document.status || 'pending',
            })) || [];
            // Process tasks
            const tasks = proceedingData.tasks?.map(task => ({
                ...task,
                id: (0, uuid_1.v4)(),
                status: 'pending',
                priority: task.priority || 'medium',
            })) || [];
            // Create initial timeline event
            const initialTimelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: 'Court proceeding created',
                type: 'status_change',
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
            logger_1.logger.info(`Court proceeding created: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error('Error creating court proceeding', error);
            throw error;
        }
    }
    /**
     * Get court proceeding by ID
     * @param proceedingId Court proceeding ID
     * @param connection Sequelize connection
     * @returns Court proceeding
     */
    async getCourtProceedingById(proceedingId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const UserModel = connection.model(user_model_1.User.name);
            return await CourtProceedingModel.findByPk(proceedingId, {
                include: [
                    { model: CaseModel, as: 'case' },
                    { model: UserModel, as: 'creator' },
                ],
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting court proceeding by ID: ${proceedingId}`, error);
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
    async updateCourtProceeding(proceedingId, updateData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
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
                    return { ...attendee, id: (0, uuid_1.v4)() };
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
                    return { ...document, id: (0, uuid_1.v4)() };
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
                    return { ...task, id: (0, uuid_1.v4)(), status: task.status || 'pending' };
                });
                updateData.tasks = updatedTasks;
            }
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: 'Court proceeding updated',
                type: 'status_change',
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
            logger_1.logger.info(`Court proceeding updated: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error updating court proceeding: ${proceedingId}`, error);
            throw error;
        }
    }
    /**
     * Delete court proceeding
     * @param proceedingId Court proceeding ID
     * @param connection Sequelize connection
     * @returns True if court proceeding was deleted
     */
    async deleteCourtProceeding(proceedingId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return false;
            }
            // Delete court proceeding
            await proceeding.destroy();
            logger_1.logger.info(`Court proceeding deleted: ${proceeding.title} (${proceeding.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting court proceeding: ${proceedingId}`, error);
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
    async getCourtProceedingsByCaseId(caseId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                proceedings: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting court proceedings by case ID: ${caseId}`, error);
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
    async getUpcomingCourtProceedings(tenantId, days = 7, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const UserModel = connection.model(user_model_1.User.name);
            // Calculate date range
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + days);
            const { count, rows } = await CourtProceedingModel.findAndCountAll({
                where: {
                    tenantId,
                    date: {
                        [sequelize_1.Op.gte]: today,
                        [sequelize_1.Op.lt]: endDate,
                    },
                    status: {
                        [sequelize_1.Op.in]: ['scheduled', 'in_progress'],
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
                proceedings: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting upcoming court proceedings`, error);
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
    async getCourtProceedingsByStatus(tenantId, status, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const CaseModel = connection.model(case_model_1.Case.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                proceedings: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting court proceedings by status: ${status}`, error);
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
    async addAttendee(proceedingId, attendeeData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create new attendee
            const newAttendee = {
                ...attendeeData,
                id: (0, uuid_1.v4)(),
            };
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: `Attendee added: ${attendeeData.name} (${attendeeData.role})`,
                type: 'attendee_added',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                attendees: [...proceeding.attendees, newAttendee],
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Attendee added to court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error adding attendee to court proceeding: ${proceedingId}`, error);
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
    async addDocument(proceedingId, documentData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create new document
            const newDocument = {
                ...documentData,
                id: (0, uuid_1.v4)(),
            };
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: `Document added: ${documentData.name}`,
                type: 'document_added',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                documents: [...proceeding.documents, newDocument],
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Document added to court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error adding document to court proceeding: ${proceedingId}`, error);
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
    async addTask(proceedingId, taskData, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create new task
            const newTask = {
                ...taskData,
                id: (0, uuid_1.v4)(),
                status: 'pending',
            };
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: `Task added: ${taskData.title}`,
                type: 'task_added',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                tasks: [...proceeding.tasks, newTask],
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Task added to court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error adding task to court proceeding: ${proceedingId}`, error);
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
    async updateStatus(proceedingId, status, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: `Status changed from ${proceeding.status} to ${status}`,
                type: 'status_change',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                status,
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Court proceeding status updated: ${proceeding.title} (${proceeding.id}) - ${status}`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error updating court proceeding status: ${proceedingId}`, error);
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
    async addNote(proceedingId, note, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: 'Note added',
                description: note,
                type: 'note_added',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                notes: proceeding.notes ? `${proceeding.notes}\n\n${new Date().toISOString()}: ${note}` : `${new Date().toISOString()}: ${note}`,
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Note added to court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error adding note to court proceeding: ${proceedingId}`, error);
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
    async setNextHearingDate(proceedingId, nextDate, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: `Next hearing date set to ${nextDate.toISOString().split('T')[0]}`,
                type: 'status_change',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                nextDate,
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Next hearing date set for court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error setting next hearing date for court proceeding: ${proceedingId}`, error);
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
    async recordOutcome(proceedingId, outcome, userId, connection) {
        try {
            // Set the model to use the tenant connection
            const CourtProceedingModel = connection.model(court_proceeding_model_1.CourtProceeding.name);
            const proceeding = await CourtProceedingModel.findByPk(proceedingId);
            if (!proceeding) {
                return null;
            }
            // Create timeline event
            const timelineEvent = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date(),
                title: 'Outcome recorded',
                description: outcome,
                type: 'status_change',
                userId,
            };
            // Update court proceeding
            await proceeding.update({
                outcome,
                status: 'completed',
                timeline: [...proceeding.timeline, timelineEvent],
            });
            logger_1.logger.info(`Outcome recorded for court proceeding: ${proceeding.title} (${proceeding.id})`);
            return proceeding;
        }
        catch (error) {
            logger_1.logger.error(`Error recording outcome for court proceeding: ${proceedingId}`, error);
            throw error;
        }
    }
}
exports.CourtProceedingService = CourtProceedingService;
exports.default = new CourtProceedingService();
