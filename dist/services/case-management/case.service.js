"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseService = void 0;
const case_model_1 = require("../../models/case.model");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const client_model_1 = require("../../models/client.model");
const user_model_1 = require("../../models/user.model");
class CaseService {
    /**
     * Generate a unique case number
     * @param tenantId Tenant ID
     * @param connection Sequelize connection
     * @returns Unique case number
     */
    async generateCaseNumber(tenantId, connection) {
        const CaseModel = connection.model(case_model_1.Case.name);
        // Get current year
        const year = new Date().getFullYear();
        // Get count of cases for this tenant in the current year
        const count = await CaseModel.count({
            where: {
                tenantId,
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(`${year}-01-01`),
                    [sequelize_1.Op.lt]: new Date(`${year + 1}-01-01`),
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
    async createCase(caseData, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            // Generate case number if not provided
            const caseNumber = caseData.caseNumber || await this.generateCaseNumber(caseData.tenantId, connection);
            // Process parties
            const parties = caseData.parties?.map(party => ({
                ...party,
                id: (0, uuid_1.v4)(),
            })) || [];
            // Process timeline events
            const timeline = caseData.timeline?.map(event => ({
                ...event,
                id: (0, uuid_1.v4)(),
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
            logger_1.logger.info(`Case created: ${caseInstance.title} (${caseInstance.id})`);
            return caseInstance;
        }
        catch (error) {
            logger_1.logger.error('Error creating case', error);
            throw error;
        }
    }
    /**
     * Get case by ID
     * @param caseId Case ID
     * @param connection Sequelize connection
     * @returns Case
     */
    async getCaseById(caseId, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
            return await CaseModel.findByPk(caseId, {
                include: [
                    { model: ClientModel, as: 'client' },
                    { model: UserModel, as: 'assignedUser' },
                ],
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting case by ID: ${caseId}`, error);
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
    async updateCase(caseId, updateData, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const caseInstance = await CaseModel.findByPk(caseId);
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
                    return { ...party, id: (0, uuid_1.v4)() };
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
                    return { ...event, id: (0, uuid_1.v4)() };
                });
                updateData.timeline = updatedEvents;
            }
            // Update case
            await caseInstance.update(updateData);
            logger_1.logger.info(`Case updated: ${caseInstance.title} (${caseInstance.id})`);
            return caseInstance;
        }
        catch (error) {
            logger_1.logger.error(`Error updating case: ${caseId}`, error);
            throw error;
        }
    }
    /**
     * Delete case
     * @param caseId Case ID
     * @param connection Sequelize connection
     * @returns True if case was deleted
     */
    async deleteCase(caseId, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const caseInstance = await CaseModel.findByPk(caseId);
            if (!caseInstance) {
                return false;
            }
            // Delete case
            await caseInstance.destroy();
            logger_1.logger.info(`Case deleted: ${caseInstance.title} (${caseInstance.id})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting case: ${caseId}`, error);
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
    async getCasesByTenantId(tenantId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting cases by tenant ID: ${tenantId}`, error);
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
    async getCasesByClientId(clientId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting cases by client ID: ${clientId}`, error);
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
    async getCasesByAssignedUserId(userId, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting cases by assigned user ID: ${userId}`, error);
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
    async getCasesByStatus(tenantId, status, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting cases by status: ${status}`, error);
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
    async getCasesByCourt(tenantId, court, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting cases by court: ${court}`, error);
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
    async searchCases(tenantId, searchTerm, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
            const { count, rows } = await CaseModel.findAndCountAll({
                where: {
                    tenantId,
                    [sequelize_1.Op.or]: [
                        { title: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                        { caseNumber: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                        { description: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error searching cases: ${searchTerm}`, error);
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
    async getUpcomingHearings(tenantId, days = 7, limit = 10, offset = 0, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const ClientModel = connection.model(client_model_1.Client.name);
            const UserModel = connection.model(user_model_1.User.name);
            // Calculate date range
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + days);
            const { count, rows } = await CaseModel.findAndCountAll({
                where: {
                    tenantId,
                    nextHearingDate: {
                        [sequelize_1.Op.gte]: today,
                        [sequelize_1.Op.lt]: endDate,
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
                cases: rows,
                total: count,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting upcoming hearings`, error);
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
    async addTimelineEvent(caseId, event, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const caseInstance = await CaseModel.findByPk(caseId);
            if (!caseInstance) {
                return null;
            }
            // Add event to timeline
            const timeline = [...caseInstance.timeline, { ...event, id: (0, uuid_1.v4)() }];
            // Update case
            await caseInstance.update({ timeline });
            // If event is a hearing, update next hearing date
            if (event.type === 'hearing' && event.status === 'pending') {
                await caseInstance.update({ nextHearingDate: event.date });
            }
            logger_1.logger.info(`Timeline event added to case: ${caseInstance.title} (${caseInstance.id})`);
            return caseInstance;
        }
        catch (error) {
            logger_1.logger.error(`Error adding timeline event to case: ${caseId}`, error);
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
    async updateCaseStatus(caseId, status, connection) {
        try {
            // Set the model to use the tenant connection
            const CaseModel = connection.model(case_model_1.Case.name);
            const caseInstance = await CaseModel.findByPk(caseId);
            if (!caseInstance) {
                return null;
            }
            // Update case status
            await caseInstance.update({ status });
            logger_1.logger.info(`Case status updated: ${caseInstance.title} (${caseInstance.id}) - ${status}`);
            return caseInstance;
        }
        catch (error) {
            logger_1.logger.error(`Error updating case status: ${caseId}`, error);
            throw error;
        }
    }
}
exports.CaseService = CaseService;
exports.default = new CaseService();
