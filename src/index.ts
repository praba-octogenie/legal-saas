import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger, requestLogger } from './utils/logger';
import { getDefaultConnection, closeAllConnections } from './database/config';
import { resolveTenant } from './middleware/tenant.middleware';
import tenantRoutes from './api/routes/tenant.routes';
import userRoutes from './api/routes/user.routes';
import clientRoutes from './api/routes/client.routes';
import caseRoutes from './api/routes/case.routes';
import documentRoutes from './api/routes/document.routes';
import courtProceedingRoutes from './api/routes/court-proceeding.routes';
import billingRoutes from './api/routes/billing.routes';
import communicationRoutes from './api/routes/communication.routes';
import legalResearchRoutes from './api/routes/legal-research.routes';
import dashboardRoutes from './api/routes/dashboard.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// Create static directories if they don't exist
const staticDir = path.join(__dirname, '../static');
const imagesDir = path.join(staticDir, 'images');
const avatarDir = path.join(imagesDir, 'avatar');

if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  logger.info(`Created static directory: ${staticDir}`);
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  logger.info(`Created images directory: ${imagesDir}`);
}

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
  logger.info(`Created avatar directory: ${avatarDir}`);
  
  // Create a sample avatar image (1.jpg)
  try {
    // This is just a placeholder. In a real app, you'd have actual avatar images.
    const sampleImagePath = path.join(avatarDir, '1.jpg');
    if (!fs.existsSync(sampleImagePath)) {
      fs.writeFileSync(sampleImagePath, 'Sample avatar image');
      logger.info(`Created sample avatar image: ${sampleImagePath}`);
    }
  } catch (error) {
    logger.error('Error creating sample avatar image', error);
  }
}

// Serve static files
app.use('/static', express.static(staticDir));

// Tenant resolution middleware
app.use(resolveTenant);

// API routes
app.use(`${apiPrefix}/admin/tenants`, tenantRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/clients`, clientRoutes);
app.use(`${apiPrefix}/cases`, caseRoutes);
app.use(`${apiPrefix}/documents`, documentRoutes);
app.use(`${apiPrefix}/court-proceedings`, courtProceedingRoutes);
app.use(`${apiPrefix}/billing`, billingRoutes);
app.use(`${apiPrefix}/communication`, communicationRoutes);
app.use(`${apiPrefix}/legal-research`, legalResearchRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Frontend route handlers for Next.js pages
// These routes will handle direct access to URLs that should be handled by the frontend
const frontendRoutes = [
  '/cases',
  '/court-proceedings',
  '/billing',
  '/communication',
  '/reports',
  '/settings',
  '/help'
];

frontendRoutes.forEach(route => {
  app.get(route, (req: Request, res: Response) => {
    res.status(200).json({
      message: `This route (${route}) should be handled by the frontend. If you're seeing this, it means the frontend routing is not working correctly.`
    });
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize default database connection
    await getDefaultConnection();
    
    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`API available at ${apiPrefix}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await closeAllConnections();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await closeAllConnections();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Start the server
startServer();