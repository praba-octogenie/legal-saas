# Legal CRM SaaS for Indian Legal Ecosystem

A comprehensive multi-tenant SaaS application specifically designed for the Indian legal ecosystem. This system provides law firms with tools for case management, document management, court proceedings tracking, legal research, and more, all tailored to the Indian legal context.

## Features

- **Multi-Tenant Architecture**: Secure tenant isolation with separate schemas per tenant
- **Indian Legal System Integration**: Support for the hierarchical Indian court system
- **Multi-Language Support**: Interface available in multiple Indian languages
- **User Management**: Role-based access control and comprehensive user profiles
- **Client Management**: Complete client information management with KYC verification
- **Case Management**: Track cases across multiple courts with detailed information
- **Document Management**: Version-controlled document storage with templates
- **Court Proceedings Tracker**: Manage hearing dates and track case status
- **AI-powered Legal Research**: Integration with Indian legal databases
- **Automated Document Generation**: Generate legal documents from templates
- **Billing and Invoicing**: GST-compliant billing with multiple payment methods
- **Secure Communication**: End-to-end encrypted messaging via Rocket.Chat
- **Mobile Application**: Cross-platform mobile access for on-the-go legal professionals

## Technical Architecture

- **Backend**: Node.js with Express.js and TypeScript
- **Frontend**: React.js for web, React Native for mobile
- **Database**: PostgreSQL with schema separation for multi-tenancy
- **API Gateway**: KrakenD
- **Authentication**: JWT and OAuth2
- **Communication**: Rocket.Chat integration

## Project Structure

```
src/
├── api/                  # API endpoints
│   ├── controllers/      # Request handlers
│   └── routes/           # API routes
├── common/               # Shared code
├── config/               # Configuration files
├── database/             # Database configuration and migrations
├── middleware/           # Express middleware
├── models/               # Database models
├── services/             # Business logic
│   ├── user-management/  # User management service
│   ├── client-management/# Client management service
│   ├── case-management/  # Case management service
│   └── ...               # Other services
├── utils/                # Utility functions
├── web/                  # Web frontend
├── mobile/               # Mobile app
└── index.ts              # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Redis (v6+)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/legal-crm-saas.git
   cd legal-crm-saas
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration.

5. Create the database:
   ```
   createdb legal_crm
   ```

6. Build the application:
   ```
   npm run build
   ```

7. Start the application:
   ```
   npm start
   ```

### Development

1. Start the development server:
   ```
   npm run dev
   ```

2. Run tests:
   ```
   npm test
   ```

3. Lint the code:
   ```
   npm run lint
   ```

## Multi-Tenant Architecture

The application uses a multi-tenant architecture with the following characteristics:

- **Data Isolation**: Each tenant has its own schema in the PostgreSQL database
- **Tenant Identification**: Tenants are identified by subdomain or custom domain
- **Tenant-Specific Encryption**: Each tenant has its own encryption keys
- **Resource Allocation**: Resources are allocated based on the tenant's plan

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

For more information, please contact [your-email@example.com](mailto:your-email@example.com).