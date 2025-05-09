# AI-Powered Legal Research Assistant - Deployment Guide

This guide provides detailed instructions for deploying and configuring the AI-powered Legal Research Assistant component of the Legal CRM SaaS system.

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [AI Component Architecture](#ai-component-architecture)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [OpenAI API Configuration](#openai-api-configuration)
7. [Testing the AI Integration](#testing-the-ai-integration)
8. [Customization](#customization)
9. [Performance Optimization](#performance-optimization)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)

## Overview

The AI-powered Legal Research Assistant provides the following capabilities:

- Natural language legal question answering with citations
- Legal document analysis and summarization
- Case outcome prediction based on facts and legal issues
- Integration with Indian legal databases

## System Requirements

### Hardware Requirements

- Minimum 4GB RAM (8GB recommended)
- 2 CPU cores (4 cores recommended)
- 20GB SSD storage

### Software Requirements

- Node.js 16.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher (for caching AI responses)
- OpenAI API key with access to GPT-4 or similar model

## AI Component Architecture

The AI-powered Legal Research Assistant consists of the following components:

### Backend Components

1. **AI Controller** (`src/api/controllers/ai.controller.ts`)
   - Handles API requests for AI functionality
   - Processes and formats prompts for the AI model
   - Parses AI responses to extract citations and statutes

2. **AI Routes** (`src/api/routes/ai.routes.ts`)
   - Defines API endpoints for AI functionality
   - Implements authentication and validation middleware

3. **Legal Research Integration**
   - Stores AI-generated analysis in the legal research database
   - Associates AI responses with cases and clients

### Frontend Components

1. **AI Legal Assistant** (`frontend/src/components/legal-research/AILegalAssistant.tsx`)
   - Provides chat interface for legal questions
   - Displays AI responses with citations and statutes
   - Allows saving important research

2. **Legal Research Page** (`frontend/src/pages/legal-research/index.tsx`)
   - Integrates AI assistant with other research tools
   - Provides document analysis and case prediction interfaces

3. **AI Service** (`frontend/src/services/aiService.ts`)
   - Handles communication with the backend AI endpoints
   - Manages state for AI interactions

## Backend Setup

### 1. Install Dependencies

Ensure your project has the required dependencies:

```bash
npm install axios dotenv winston
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```
# AI Integration
AI_API_KEY=your-openai-api-key
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.3
```

### 3. Deploy AI Controller

The AI controller (`src/api/controllers/ai.controller.ts`) handles:

- Legal question answering
- Document analysis
- Case outcome prediction

Ensure this file is properly deployed with your backend application.

### 4. Configure AI Routes

The AI routes (`src/api/routes/ai.routes.ts`) should be integrated with your existing legal research routes:

```javascript
// In src/api/routes/legal-research.routes.ts
import AIController from '../controllers/ai.controller';

// AI-powered legal research routes
router.post('/ai/ask', validateBody(...), AIController.askLegalQuestion);
router.post('/ai/analyze', validateBody(...), AIController.analyzeLegalDocument);
router.post('/ai/predict', validateBody(...), AIController.predictCaseOutcome);
```

## Frontend Setup

### 1. Install Dependencies

In the frontend directory, install the required dependencies:

```bash
cd frontend
npm install react-markdown axios
```

### 2. Deploy AI Components

Ensure the following components are properly deployed:

- `frontend/src/components/legal-research/AILegalAssistant.tsx`
- `frontend/src/pages/legal-research/index.tsx`
- `frontend/src/services/aiService.ts`

### 3. Configure Frontend Environment

Add the following to your frontend `.env.local` file:

```
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Legal CRM
```

## OpenAI API Configuration

### 1. Obtain API Key

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Navigate to the API section
3. Generate a new API key
4. Add the key to your `.env` file as `AI_API_KEY`

### 2. Model Selection

The system is configured to use GPT-4 by default, but you can use other models:

- `gpt-4`: Best quality, most expensive
- `gpt-3.5-turbo`: Good balance of quality and cost
- `gpt-3.5-turbo-16k`: Larger context window for document analysis

Update the `AI_MODEL` in your `.env` file to change the model.

### 3. API Usage Monitoring

Monitor your OpenAI API usage to control costs:

1. Log in to your OpenAI account
2. Navigate to the Usage section
3. Set up usage limits to prevent unexpected charges

## Testing the AI Integration

### 1. Test Legal Question Answering

```bash
curl -X POST http://localhost:3000/api/v1/legal-research/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "What is the legal definition of negligence in India?",
    "options": {
      "jurisdiction": "india",
      "temperature": 0.3
    }
  }'
```

### 2. Test Document Analysis

```bash
curl -X POST http://localhost:3000/api/v1/legal-research/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "documentContent": "YOUR_DOCUMENT_TEXT",
    "documentType": "contract",
    "options": {
      "focusAreas": ["obligations", "risks"]
    }
  }'
```

### 3. Test Case Prediction

```bash
curl -X POST http://localhost:3000/api/v1/legal-research/ai/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "caseDetails": {
      "facts": "The defendant failed to deliver goods as per the contract...",
      "legalIssues": ["breach of contract", "damages"],
      "jurisdiction": "delhi",
      "court": "Delhi High Court"
    }
  }'
```

## Customization

### 1. Prompt Engineering

The AI controller uses carefully crafted prompts to get the best results. You can customize these prompts in `src/api/controllers/ai.controller.ts`:

```javascript
// Example: Customizing the legal question prompt
const prompt = `You are a legal expert specializing in ${jurisdiction} law. 
Answer the following legal question with accurate information, 
citing relevant cases, statutes, and legal principles.`;
```

### 2. Response Parsing

The AI controller parses responses to extract citations and statutes. You can customize the regex patterns:

```javascript
// Example: Customizing citation extraction
const citationRegex = /\b([A-Za-z]+)\s+v\.?\s+([A-Za-z]+)(?:,\s+\((\d{4})\))?(?:\s+(\d+)\s+([A-Za-z]+)\s+(\d+))?/g;
```

### 3. UI Customization

Customize the AI assistant UI in `frontend/src/components/legal-research/AILegalAssistant.tsx`:

- Change the welcome message
- Modify the chat interface
- Add custom functionality

## Performance Optimization

### 1. Response Caching

Implement Redis caching for AI responses to improve performance and reduce API costs:

```javascript
// Example: Caching AI responses
const getCachedResponse = async (question) => {
  const cachedResponse = await redisClient.get(`ai:question:${md5(question)}`);
  if (cachedResponse) {
    return JSON.parse(cachedResponse);
  }
  return null;
};

const cacheResponse = async (question, response) => {
  await redisClient.set(
    `ai:question:${md5(question)}`,
    JSON.stringify(response),
    'EX',
    86400 // Cache for 24 hours
  );
};
```

### 2. Batch Processing

For document analysis of large documents, implement batch processing:

```javascript
// Example: Batch processing for large documents
const batchSize = 4000; // tokens
const batches = [];
for (let i = 0; i < documentContent.length; i += batchSize) {
  batches.push(documentContent.substring(i, i + batchSize));
}

const results = await Promise.all(
  batches.map(batch => analyzeDocumentBatch(batch))
);
```

### 3. Rate Limiting

Implement rate limiting to prevent API abuse:

```javascript
// Example: Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

router.use('/ai', rateLimiter);
```

## Monitoring and Maintenance

### 1. Logging

Monitor AI interactions with detailed logging:

```javascript
// Example: AI interaction logging
logger.info('AI Request', {
  endpoint: 'askLegalQuestion',
  question: question.substring(0, 100),
  userId: req.user.id,
  tenantId: req.tenant.id
});

logger.info('AI Response', {
  endpoint: 'askLegalQuestion',
  responseLength: answer.length,
  citationsCount: citations.length,
  processingTime: Date.now() - startTime
});
```

### 2. Error Handling

Implement robust error handling for AI API failures:

```javascript
// Example: Error handling for AI API
try {
  const aiResponse = await axios.post(
    process.env.AI_API_ENDPOINT,
    {
      model: process.env.AI_MODEL,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: question }
      ],
      temperature: aiModelParams.temperature,
      max_tokens: aiModelParams.max_tokens,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      }
    }
  );
  
  // Process response
} catch (error) {
  logger.error('OpenAI API Error', {
    status: error.response?.status,
    message: error.response?.data?.error?.message,
    code: error.response?.data?.error?.code
  });
  
  // Implement fallback strategy
  if (error.response?.status === 429) {
    // Rate limit exceeded, retry with exponential backoff
  } else if (error.response?.status === 500) {
    // Server error, use cached response if available
  }
}
```

### 3. Performance Monitoring

Monitor AI component performance:

```javascript
// Example: Performance monitoring
const startTime = Date.now();
// AI processing
const processingTime = Date.now() - startTime;

if (processingTime > 5000) {
  logger.warn('Slow AI response', {
    endpoint: 'askLegalQuestion',
    processingTime,
    questionLength: question.length
  });
}
```

## Troubleshooting

### Common Issues

#### 1. OpenAI API Key Issues

**Problem**: Authentication errors with OpenAI API
**Solution**:
- Verify the API key is correctly set in `.env`
- Check if the API key has been revoked or expired
- Ensure billing is set up correctly in your OpenAI account

#### 2. Rate Limit Exceeded

**Problem**: OpenAI API returns 429 Too Many Requests
**Solution**:
- Implement exponential backoff and retry logic
- Increase the caching of common responses
- Consider upgrading your OpenAI plan for higher rate limits

#### 3. Response Parsing Errors

**Problem**: Citation or statute extraction fails
**Solution**:
- Check the regex patterns in the AI controller
- Log the raw AI responses to identify pattern issues
- Update the regex patterns to match the actual response format

#### 4. High Latency

**Problem**: AI responses are slow
**Solution**:
- Implement caching for common questions
- Use a faster model (e.g., gpt-3.5-turbo instead of gpt-4)
- Optimize prompt length and complexity
- Implement streaming responses for better user experience

#### 5. Inaccurate Responses

**Problem**: AI provides incorrect legal information
**Solution**:
- Refine the system prompts to emphasize accuracy
- Add more context about Indian law in the prompts
- Implement a feedback mechanism for users to report issues
- Consider fine-tuning the model with legal datasets (if using a fine-tunable model)

---

This deployment guide covers the specific setup and configuration of the AI-powered Legal Research Assistant. For general system deployment, refer to the main installation guide.