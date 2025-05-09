import api from '@/utils/api';

/**
 * Service for interacting with AI-powered legal research features
 */
export class AIService {
  /**
   * Ask a legal question to the AI assistant
   * @param question The legal question or query
   * @param context Optional context (case details, document content, etc.)
   * @param options Optional parameters for the AI model
   * @returns The AI response
   */
  static async askLegalQuestion(
    question: string,
    context?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      sources?: string[];
      jurisdiction?: string;
    }
  ): Promise<{
    answer: string;
    citations: {
      text: string;
      source: string;
      url?: string;
    }[];
    relevantStatutes?: {
      name: string;
      section: string;
      text: string;
    }[];
  }> {
    try {
      const response = await api.post('/legal-research/ai/ask', {
        question,
        context,
        options,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get AI response');
    }
  }
  
  /**
   * Analyze a legal document using AI
   * @param documentContent The content of the document to analyze
   * @param documentType Optional type of document (contract, judgment, etc.)
   * @param options Optional parameters for the AI model
   * @returns The AI analysis
   */
  static async analyzeLegalDocument(
    documentContent: string,
    documentType?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      focusAreas?: string[];
      jurisdiction?: string;
    }
  ): Promise<{
    summary: string;
    keyPoints: string[];
    risks?: string[];
    obligations?: string[];
    recommendations?: string[];
    relevantCases?: {
      name: string;
      citation: string;
      relevance: string;
    }[];
  }> {
    try {
      const response = await api.post('/legal-research/ai/analyze', {
        documentContent,
        documentType,
        options,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to analyze document');
    }
  }
  
  /**
   * Generate a legal document using AI
   * @param documentType Type of document to generate
   * @param parameters Parameters for document generation
   * @param options Optional parameters for the AI model
   * @returns The generated document
   */
  static async generateLegalDocument(
    documentType: string,
    parameters: Record<string, any>,
    options?: {
      maxTokens?: number;
      temperature?: number;
      jurisdiction?: string;
      language?: string;
    }
  ): Promise<{
    content: string;
    format: 'text' | 'html' | 'markdown';
    warnings?: string[];
    suggestions?: string[];
  }> {
    try {
      const response = await api.post('/legal-research/ai/generate', {
        documentType,
        parameters,
        options,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate document');
    }
  }
  
  /**
   * Get case outcome prediction using AI
   * @param caseDetails Details of the case
   * @param options Optional parameters for the AI model
   * @returns The prediction results
   */
  static async predictCaseOutcome(
    caseDetails: {
      facts: string;
      legalIssues: string[];
      jurisdiction: string;
      court: string;
      precedents?: string[];
    },
    options?: {
      maxTokens?: number;
      temperature?: number;
      confidenceThreshold?: number;
    }
  ): Promise<{
    prediction: string;
    confidence: number;
    reasoning: string;
    similarCases: {
      name: string;
      citation: string;
      outcome: string;
      similarity: number;
    }[];
    factors: {
      favorable: string[];
      unfavorable: string[];
    };
  }> {
    try {
      const response = await api.post('/legal-research/ai/predict', {
        caseDetails,
        options,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to predict case outcome');
    }
  }
}

export default AIService;