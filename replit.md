# EDC Management Console

## Overview

This is a full-stack web application called "EDC Management Console" - an enterprise data connector (EDC) management platform built with modern web technologies. The application follows an ARENA2036 theme and provides a comprehensive interface for managing connectors, monitoring data flows, and configuring dataspace settings. It features a dashboard with KPI cards, connector management, and various monitoring pages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a Single Page Application (SPA) using React 18 with TypeScript. Key architectural decisions include:

- **Component Library**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible UI components
- **Styling**: TailwindCSS with custom ARENA2036 theme colors (primary orange: #F28C00)
- **State Management**: React Query for server state management and React Context for client state (user authentication, language preferences)
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Internationalization**: Simple EN/DE language toggle stored in localStorage

The application uses a sidebar layout with protected routes, featuring:
- Global sidebar navigation with app branding
- Top bar with user dropdown and language switcher
- Main content area with page-specific components

### Backend Architecture
The backend is a REST API built with Express.js and TypeScript:

- **Server Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **Database Layer**: Uses an in-memory storage implementation (MemStorage) that can be easily replaced with a persistent database
- **API Design**: RESTful endpoints for authentication, connectors, stats, and dataspace settings
- **Development Setup**: Vite integration for hot module replacement and development server

### Data Storage Solutions
Currently implements an in-memory storage pattern with interfaces designed for easy migration:

- **Storage Interface**: IStorage interface defines contracts for data operations
- **Schema Definition**: Drizzle ORM schemas define data structure for future PostgreSQL migration
- **Data Models**: User management, connector management, dataspace settings, and statistics tracking

The application is configured for PostgreSQL with Drizzle ORM but currently uses in-memory storage for simplicity.

### Authentication and Authorization
Implements a basic session-based authentication system:

- **Login System**: Username/password authentication with Zod validation
- **Session Management**: Basic user session handling (designed for enhancement with proper session stores)
- **Route Protection**: Protected routes using React context and conditional rendering
- **Default Credentials**: Admin user (admin/admin123) for development

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript and Vite build system
- **Component Library**: Extensive shadcn/ui components based on Radix UI primitives
- **Styling**: TailwindCSS with PostCSS processing
- **State Management**: TanStack React Query for server state, React Hook Form for forms
- **Validation**: Zod for schema validation and type safety
- **Icons**: Lucide React for consistent iconography
- **Utilities**: clsx and tailwind-merge for conditional styling, date-fns for date handling

### Backend Dependencies
- **Server**: Express.js with TypeScript support
- **Database**: Prepared for PostgreSQL with Drizzle ORM and Neon serverless adapter
- **Session Storage**: connect-pg-simple for PostgreSQL session storage (when database is connected)
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **Database Migration**: Drizzle Kit for database schema management
- **Replit Integration**: Specialized Replit plugins for development environment
- **TypeScript**: Full TypeScript support with strict configuration

### Environment Configuration
The application expects several environment variables for full functionality:
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_API_BASE`: API base URL for frontend
- `VITE_SDE_URL`: External SDE service URL
- `VITE_DEFAULT_EDC_URL`: Default EDC endpoint
- `VITE_DEFAULT_HOSTNAME`: Default hostname configuration
- `VITE_DEFAULT_API_KEY`: Default API key for external services