"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communication_controller_1 = __importDefault(require("../controllers/communication.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Apply middleware to all routes
router.use(auth_middleware_1.authenticate);
router.use(tenant_middleware_1.requireTenant);
// Message routes
router.post('/messages', communication_controller_1.default.createMessage);
router.get('/messages/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), communication_controller_1.default.getMessageById);
router.get('/conversations/:conversationId/messages', (0, validation_1.validateParams)(joi_1.default.object({
    conversationId: joi_1.default.string().uuid().required(),
})), (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(50),
    offset: joi_1.default.number().integer().min(0).default(0),
})), communication_controller_1.default.getMessagesByConversation);
// Conversation routes
router.post('/conversations', communication_controller_1.default.createConversation);
router.get('/conversations', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), communication_controller_1.default.getConversationsByUser);
router.get('/conversations/:id', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), communication_controller_1.default.getConversationById);
// Notification routes
router.post('/notifications', communication_controller_1.default.createNotification);
router.get('/notifications', (0, validation_1.validateQuery)(joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    offset: joi_1.default.number().integer().min(0).default(0),
})), communication_controller_1.default.getNotificationsByUser);
router.patch('/notifications/:id/read', (0, validation_1.validateParams)(joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
})), communication_controller_1.default.markNotificationAsRead);
router.patch('/notifications/read-all', communication_controller_1.default.markAllNotificationsAsRead);
exports.default = router;
