# Legal CRM Frontend

This is the frontend application for the Legal CRM SaaS product designed for the Indian legal ecosystem. It's built with Next.js, TypeScript, and Material UI.

## Features

- Multi-tenant architecture
- Multi-language support for Indian languages
- Responsive design for desktop and mobile
- Integration with backend API
- Authentication and authorization
- Client management
- Case management
- Document management
- Court proceedings tracking
- Legal research assistant
- Billing and invoicing
- Communication system

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Backend API running

## Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Legal CRM
```

Adjust the `NEXT_PUBLIC_API_URL` to match your backend API URL.

## Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## TypeScript Errors

If you encounter TypeScript errors during development, make sure you have installed all dependencies. The application uses several third-party libraries that provide their own type definitions.

If you still see errors, you can run:

```bash
npm run build
```

This will compile the TypeScript code and show any errors that need to be fixed.

## Project Structure

- `src/pages`: Next.js pages
- `src/components`: Reusable React components
- `src/hooks`: Custom React hooks
- `src/store`: Redux store and slices
- `src/services`: API services
- `src/utils`: Utility functions
- `src/styles`: Global styles and theme
- `src/types`: TypeScript type definitions
- `public`: Static assets and locales

## Multi-Language Support

The application supports multiple Indian languages. Language files are stored in the `public/locales` directory.

To add a new language:

1. Create a new directory in `public/locales` with the language code (e.g., `hi` for Hindi)
2. Copy the JSON files from the `en` directory to the new directory
3. Translate the strings in the JSON files

## Authentication

The application uses JWT authentication. The token is stored in localStorage and included in API requests.

## Styling

The application uses Material UI for styling. The theme is defined in `src/styles/theme.ts`.

## State Management

The application uses Redux Toolkit for state management. The store is defined in `src/store/store.ts`.

## API Integration

API services are defined in `src/services` directory. The application uses Axios for API requests.

## Testing

To run tests:

```bash
npm test
```

## Linting

To run linting:

```bash
npm run lint
```

## License

This project is proprietary and confidential.