import express from 'express';
import AIController from '../controllers/ai.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/legal-research/ai/ask
 * @desc    Ask a legal question to the AI assistant
 * @access  Private
 */
router.post('/ask', authenticate, AIController.askLegalQuestion);

/**
 * @route   POST /api/legal-research/ai/analyze
 * @desc    Analyze a legal document using AI
 * @access  Private
 */
router.post('/analyze', authenticate, AIController.analyzeLegalDocument);

/**
 * @route   POST /api/legal-research/ai/predict
 * @desc    Predict case outcome using AI
 * @access  Private
 */
router.post('/predict', authenticate, AIController.predictCaseOutcome);

export default router;