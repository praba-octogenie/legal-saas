"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/legal-research/ai/ask
 * @desc    Ask a legal question to the AI assistant
 * @access  Private
 */
router.post('/ask', auth_middleware_1.authenticate, ai_controller_1.default.askLegalQuestion);
/**
 * @route   POST /api/legal-research/ai/analyze
 * @desc    Analyze a legal document using AI
 * @access  Private
 */
router.post('/analyze', auth_middleware_1.authenticate, ai_controller_1.default.analyzeLegalDocument);
/**
 * @route   POST /api/legal-research/ai/predict
 * @desc    Predict case outcome using AI
 * @access  Private
 */
router.post('/predict', auth_middleware_1.authenticate, ai_controller_1.default.predictCaseOutcome);
exports.default = router;
