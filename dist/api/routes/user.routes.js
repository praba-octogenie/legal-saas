"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const validation_1 = require("../../utils/validation");
const joi_1 = __importDefault(require("joi"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation schemas
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    role: joi_1.default.string().valid('manager', 'lawyer', 'paralegal', 'staff', 'user').required(),
});
const changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(8).required(),
});
// Public routes
router.post('/register', (0, validation_1.validateBody)(registerSchema), user_controller_1.default.registerUser);
router.post('/login', (0, validation_1.validateBody)(loginSchema), user_controller_1.default.loginUser);
router.post('/refresh-token', user_controller_1.default.refreshToken);
// Protected routes (require authentication)
router.get('/profile', auth_middleware_1.authenticate, user_controller_1.default.getUserProfile);
router.put('/profile', auth_middleware_1.authenticate, user_controller_1.default.updateUserProfile);
router.post('/change-password', auth_middleware_1.authenticate, (0, validation_1.validateBody)(changePasswordSchema), user_controller_1.default.changePassword);
// Admin routes (require admin authentication)
router.get('/', auth_middleware_1.authenticateAdmin, user_controller_1.default.getAllUsers);
router.get('/:id', auth_middleware_1.authenticateAdmin, user_controller_1.default.getUserById);
router.put('/:id', auth_middleware_1.authenticateAdmin, user_controller_1.default.updateUser);
router.delete('/:id', auth_middleware_1.authenticateAdmin, user_controller_1.default.deleteUser);
exports.default = router;
