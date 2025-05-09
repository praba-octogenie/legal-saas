"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./utils/logger");
const config_1 = require("./database/config");
const tenant_middleware_1 = require("./middleware/tenant.middleware");
const tenant_routes_1 = __importDefault(require("./api/routes/tenant.routes"));
const user_routes_1 = __importDefault(require("./api/routes/user.routes"));
const client_routes_1 = __importDefault(require("./api/routes/client.routes"));
const case_routes_1 = __importDefault(require("./api/routes/case.routes"));
const document_routes_1 = __importDefault(require("./api/routes/document.routes"));
const court_proceeding_routes_1 = __importDefault(require("./api/routes/court-proceeding.routes"));
const billing_routes_1 = __importDefault(require("./api/routes/billing.routes"));
const communication_routes_1 = __importDefault(require("./api/routes/communication.routes"));
const legal_research_routes_1 = __importDefault(require("./api/routes/legal-research.routes"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || '/api/v1';
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
app.use(logger_1.requestLogger);
// Create static directories if they don't exist
const staticDir = path_1.default.join(__dirname, '../static');
const imagesDir = path_1.default.join(staticDir, 'images');
const avatarDir = path_1.default.join(imagesDir, 'avatar');
if (!fs_1.default.existsSync(staticDir)) {
    fs_1.default.mkdirSync(staticDir, { recursive: true });
    logger_1.logger.info(`Created static directory: ${staticDir}`);
}
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
    logger_1.logger.info(`Created images directory: ${imagesDir}`);
}
if (!fs_1.default.existsSync(avatarDir)) {
    fs_1.default.mkdirSync(avatarDir, { recursive: true });
    logger_1.logger.info(`Created avatar directory: ${avatarDir}`);
    // Create a sample avatar image (1.jpg)
    try {
        // This is just a placeholder. In a real app, you'd have actual avatar images.
        const sampleImagePath = path_1.default.join(avatarDir, '1.jpg');
        if (!fs_1.default.existsSync(sampleImagePath)) {
            fs_1.default.writeFileSync(sampleImagePath, 'Sample avatar image');
            logger_1.logger.info(`Created sample avatar image: ${sampleImagePath}`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error creating sample avatar image', error);
    }
}
// Serve static files
app.use('/static', express_1.default.static(staticDir));
// Tenant resolution middleware
app.use(tenant_middleware_1.resolveTenant);
// API routes
app.use(`${apiPrefix}/admin/tenants`, tenant_routes_1.default);
app.use(`${apiPrefix}/users`, user_routes_1.default);
app.use(`${apiPrefix}/clients`, client_routes_1.default);
app.use(`${apiPrefix}/cases`, case_routes_1.default);
app.use(`${apiPrefix}/documents`, document_routes_1.default);
app.use(`${apiPrefix}/court-proceedings`, court_proceeding_routes_1.default);
app.use(`${apiPrefix}/billing`, billing_routes_1.default);
app.use(`${apiPrefix}/communication`, communication_routes_1.default);
app.use(`${apiPrefix}/legal-research`, legal_research_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error', err);
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
    app.get(route, (req, res) => {
        res.status(200).json({
            message: `This route (${route}) should be handled by the frontend. If you're seeing this, it means the frontend routing is not working correctly.`
        });
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Start server
const startServer = async () => {
    try {
        // Initialize default database connection
        await (0, config_1.getDefaultConnection)();
        // Start server
        app.listen(port, () => {
            logger_1.logger.info(`Server running on port ${port}`);
            logger_1.logger.info(`API available at ${apiPrefix}`);
        });
        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            await (0, config_1.closeAllConnections)();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            await (0, config_1.closeAllConnections)();
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
};
// Start the server
startServer();
