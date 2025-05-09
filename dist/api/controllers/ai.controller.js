"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
/**
 * Controller for AI-powered legal research features
 */
class AIController {
    /**
     * Ask a legal question to the AI assistant
     * @route POST /api/legal-research/ai/ask
     */
    static async askLegalQuestion(req, res) {
        try {
            // Validate request
            if (!req.body) {
                res.status(400).json({ error: 'Invalid request data' });
                return;
            }
            const { question, context, options } = req.body;
            // Validate required fields
            if (!question) {
                res.status(400).json({ error: 'Question is required' });
                return;
            }
            // Configure AI model parameters
            const aiModelParams = {
                model: process.env.AI_MODEL || 'gpt-4',
                temperature: options?.temperature || 0.3,
                max_tokens: options?.maxTokens || 2000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            };
            // Prepare prompt with jurisdiction and context
            const jurisdiction = options?.jurisdiction || 'india';
            let prompt = `You are a legal expert specializing in ${jurisdiction} law. Answer the following legal question with accurate information, citing relevant cases, statutes, and legal principles. If you're unsure, indicate the limitations of your knowledge.`;
            if (context) {
                prompt += `\n\nContext: ${context}`;
            }
            prompt += `\n\nQuestion: ${question}`;
            // Call AI API
            const aiResponse = await axios_1.default.post(process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions', {
                model: aiModelParams.model,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: question }
                ],
                temperature: aiModelParams.temperature,
                max_tokens: aiModelParams.max_tokens,
                top_p: aiModelParams.top_p,
                frequency_penalty: aiModelParams.frequency_penalty,
                presence_penalty: aiModelParams.presence_penalty,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`
                }
            });
            // Process AI response to extract citations and statutes
            const answer = aiResponse.data.choices[0].message.content;
            // Extract citations using regex patterns
            const citationRegex = /\b([A-Za-z]+)\s+v\.?\s+([A-Za-z]+)(?:,\s+\((\d{4})\))?(?:\s+(\d+)\s+([A-Za-z]+)\s+(\d+))?/g;
            const statuteRegex = /\b(?:Section|Sec\.|S\.)\s+(\d+[A-Za-z]*)(?:\s+of\s+the\s+([A-Za-z\s]+)(?:\s+Act(?:,\s+(\d{4}))?)?)?/g;
            const citations = [];
            const relevantStatutes = [];
            // Extract citations
            let match;
            while ((match = citationRegex.exec(answer)) !== null) {
                const citation = match[0];
                const plaintiff = match[1];
                const defendant = match[2];
                const year = match[3];
                const volume = match[4];
                const reporter = match[5];
                const page = match[6];
                citations.push({
                    text: citation,
                    source: `${plaintiff} v. ${defendant}${year ? ` (${year})` : ''}${volume ? ` ${volume} ${reporter} ${page}` : ''}`,
                    url: `https://indiankanoon.org/search/?formInput=${encodeURIComponent(plaintiff + ' ' + defendant)}`
                });
            }
            // Extract statutes
            while ((match = statuteRegex.exec(answer)) !== null) {
                const section = match[1];
                const act = match[2] || 'Unknown Act';
                const year = match[3] || '';
                relevantStatutes.push({
                    name: `${act}${year ? `, ${year}` : ''}`,
                    section: section,
                    text: match[0]
                });
            }
            // Send response
            res.status(200).json({
                answer,
                citations,
                relevantStatutes
            });
        }
        catch (error) {
            logger_1.logger.error('Error in askLegalQuestion:', error);
            res.status(500).json({
                error: 'Failed to get AI response',
                details: error.response?.data?.error || error.message
            });
        }
    }
    /**
     * Analyze a legal document using AI
     * @route POST /api/legal-research/ai/analyze
     */
    static async analyzeLegalDocument(req, res) {
        try {
            // Validate request
            if (!req.body) {
                res.status(400).json({ error: 'Invalid request data' });
                return;
            }
            const { documentContent, documentType, options } = req.body;
            // Validate required fields
            if (!documentContent) {
                res.status(400).json({ error: 'Document content is required' });
                return;
            }
            // Configure AI model parameters
            const aiModelParams = {
                model: process.env.AI_MODEL || 'gpt-4',
                temperature: options?.temperature || 0.3,
                max_tokens: options?.maxTokens || 2000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            };
            // Prepare prompt
            const jurisdiction = options?.jurisdiction || 'india';
            const docType = documentType || 'legal document';
            let prompt = `You are a legal expert specializing in ${jurisdiction} law. Analyze the following ${docType} and provide a comprehensive analysis including a summary, key points, and any relevant legal implications.`;
            if (options?.focusAreas && options.focusAreas.length > 0) {
                prompt += ` Focus particularly on: ${options.focusAreas.join(', ')}.`;
            }
            // Call AI API
            const aiResponse = await axios_1.default.post(process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions', {
                model: aiModelParams.model,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: documentContent }
                ],
                temperature: aiModelParams.temperature,
                max_tokens: aiModelParams.max_tokens,
                top_p: aiModelParams.top_p,
                frequency_penalty: aiModelParams.frequency_penalty,
                presence_penalty: aiModelParams.presence_penalty,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`
                }
            });
            // Process AI response
            const analysisText = aiResponse.data.choices[0].message.content;
            // Extract sections using regex
            const summaryMatch = analysisText.match(/(?:Summary|SUMMARY):(.*?)(?=\n\n|$)/s);
            const keyPointsMatch = analysisText.match(/(?:Key Points|KEY POINTS):(.*?)(?=\n\n|$)/s);
            const risksMatch = analysisText.match(/(?:Risks|RISKS):(.*?)(?=\n\n|$)/s);
            const obligationsMatch = analysisText.match(/(?:Obligations|OBLIGATIONS):(.*?)(?=\n\n|$)/s);
            const recommendationsMatch = analysisText.match(/(?:Recommendations|RECOMMENDATIONS):(.*?)(?=\n\n|$)/s);
            // Extract key points as array
            const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : '';
            const keyPoints = keyPointsText
                .split(/\n\s*[-•*]\s*/)
                .filter((point) => point.trim().length > 0)
                .map((point) => point.trim());
            // Extract risks as array
            const risksText = risksMatch ? risksMatch[1].trim() : '';
            const risks = risksText
                .split(/\n\s*[-•*]\s*/)
                .filter((risk) => risk.trim().length > 0)
                .map((risk) => risk.trim());
            // Extract obligations as array
            const obligationsText = obligationsMatch ? obligationsMatch[1].trim() : '';
            const obligations = obligationsText
                .split(/\n\s*[-•*]\s*/)
                .filter((obligation) => obligation.trim().length > 0)
                .map((obligation) => obligation.trim());
            // Extract recommendations as array
            const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';
            const recommendations = recommendationsText
                .split(/\n\s*[-•*]\s*/)
                .filter((recommendation) => recommendation.trim().length > 0)
                .map((recommendation) => recommendation.trim());
            // Send response
            res.status(200).json({
                summary: summaryMatch ? summaryMatch[1].trim() : analysisText.substring(0, 200),
                keyPoints: keyPoints.length > 0 ? keyPoints : [analysisText.substring(0, 100)],
                risks: risks.length > 0 ? risks : undefined,
                obligations: obligations.length > 0 ? obligations : undefined,
                recommendations: recommendations.length > 0 ? recommendations : undefined,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in analyzeLegalDocument:', error);
            res.status(500).json({
                error: 'Failed to analyze document',
                details: error.response?.data?.error || error.message
            });
        }
    }
    /**
     * Predict case outcome using AI
     * @route POST /api/legal-research/ai/predict
     */
    static async predictCaseOutcome(req, res) {
        try {
            // Validate request
            if (!req.body) {
                res.status(400).json({ error: 'Invalid request data' });
                return;
            }
            const { caseDetails, options } = req.body;
            // Validate required fields
            if (!caseDetails || !caseDetails.facts || !caseDetails.legalIssues) {
                res.status(400).json({ error: 'Case facts and legal issues are required' });
                return;
            }
            // Configure AI model parameters
            const aiModelParams = {
                model: process.env.AI_MODEL || 'gpt-4',
                temperature: options?.temperature || 0.3,
                max_tokens: options?.maxTokens || 2000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            };
            // Prepare prompt
            const jurisdiction = caseDetails.jurisdiction || 'india';
            const court = caseDetails.court || 'appropriate court';
            let prompt = `You are a legal expert specializing in ${jurisdiction} law. Based on the following case details, predict the likely outcome if this case were to be heard in the ${court}.`;
            prompt += `\n\nFacts: ${caseDetails.facts}`;
            prompt += `\n\nLegal Issues: ${caseDetails.legalIssues.join(', ')}`;
            if (caseDetails.precedents && caseDetails.precedents.length > 0) {
                prompt += `\n\nRelevant Precedents: ${caseDetails.precedents.join('; ')}`;
            }
            prompt += `\n\nProvide your prediction with a confidence level (percentage), detailed reasoning, similar cases, and factors that may influence the outcome (both favorable and unfavorable).`;
            // Call AI API
            const aiResponse = await axios_1.default.post(process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions', {
                model: aiModelParams.model,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: `Predict the outcome for this ${jurisdiction} case in the ${court}.` }
                ],
                temperature: aiModelParams.temperature,
                max_tokens: aiModelParams.max_tokens,
                top_p: aiModelParams.top_p,
                frequency_penalty: aiModelParams.frequency_penalty,
                presence_penalty: aiModelParams.presence_penalty,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`
                }
            });
            // Process AI response
            const predictionText = aiResponse.data.choices[0].message.content;
            // Extract prediction and confidence
            const predictionMatch = predictionText.match(/(?:Prediction|PREDICTION):(.*?)(?=\n\n|$)/s);
            const confidenceMatch = predictionText.match(/(?:Confidence|CONFIDENCE):\s*(\d+)%/);
            const reasoningMatch = predictionText.match(/(?:Reasoning|REASONING):(.*?)(?=\n\n|$)/s);
            // Extract similar cases
            const similarCasesMatch = predictionText.match(/(?:Similar Cases|SIMILAR CASES):(.*?)(?=\n\n|$)/s);
            const similarCasesText = similarCasesMatch ? similarCasesMatch[1].trim() : '';
            const similarCasesRegex = /([A-Za-z\s]+)\s+v\.\s+([A-Za-z\s]+)(?:\s+\((\d{4})\))?(?:\s+-\s+([^,]+))?(?:,\s+([^)]+))?/g;
            const similarCases = [];
            let caseMatch;
            while ((caseMatch = similarCasesRegex.exec(similarCasesText)) !== null) {
                similarCases.push({
                    name: `${caseMatch[1]} v. ${caseMatch[2]}${caseMatch[3] ? ` (${caseMatch[3]})` : ''}`,
                    citation: caseMatch[5] || '',
                    outcome: caseMatch[4] || '',
                    similarity: Math.random() * 0.4 + 0.6 // Placeholder: 60-100% similarity
                });
            }
            // Extract favorable and unfavorable factors
            const favorableMatch = predictionText.match(/(?:Favorable Factors|FAVORABLE FACTORS):(.*?)(?=\n\n|$)/s);
            const unfavorableMatch = predictionText.match(/(?:Unfavorable Factors|UNFAVORABLE FACTORS):(.*?)(?=\n\n|$)/s);
            const favorableText = favorableMatch ? favorableMatch[1].trim() : '';
            const favorable = favorableText
                .split(/\n\s*[-•*]\s*/)
                .filter((factor) => factor.trim().length > 0)
                .map((factor) => factor.trim());
            const unfavorableText = unfavorableMatch ? unfavorableMatch[1].trim() : '';
            const unfavorable = unfavorableText
                .split(/\n\s*[-•*]\s*/)
                .filter((factor) => factor.trim().length > 0)
                .map((factor) => factor.trim());
            // Send response
            res.status(200).json({
                prediction: predictionMatch ? predictionMatch[1].trim() : 'Outcome cannot be determined with certainty',
                confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 70,
                reasoning: reasoningMatch ? reasoningMatch[1].trim() : predictionText,
                similarCases: similarCases.length > 0 ? similarCases : [],
                factors: {
                    favorable: favorable.length > 0 ? favorable : [],
                    unfavorable: unfavorable.length > 0 ? unfavorable : []
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in predictCaseOutcome:', error);
            res.status(500).json({
                error: 'Failed to predict case outcome',
                details: error.response?.data?.error || error.message
            });
        }
    }
}
exports.AIController = AIController;
exports.default = AIController;
