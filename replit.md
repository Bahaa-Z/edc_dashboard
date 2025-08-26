# EDC Management Console

## Overview

The EDC Management Console is a full-stack web application for managing Enterprise Data Connector (EDC) instances within the ARENA2036 dataspace ecosystem. It provides a comprehensive dashboard for monitoring connectors, managing dataspace settings, and facilitating EDC deployment through an intuitive wizard interface. The application serves as a centralized control panel for dataspace participants to oversee their connector infrastructure and data sharing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built as a modern Single Page Application (SPA) using React 18 with TypeScript:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, consistent interface elements
- **Styling**: TailwindCSS with custom ARENA2036 theme (primary orange: #F28C00) for brand consistency
- **State Management**: React Query for server state caching and synchronization, React Context for client-side state (authentication, language preferences)
- **Routing**: Wouter for lightweight client-side routing with protected route patterns
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Internationalization**: Simple EN/DE language toggle with localStorage persistence
- **Development**: Vite for fast development server and optimized builds

The application uses a sidebar layout with protected routes, featuring a persistent navigation sidebar, top bar with user controls, and dynamic main content area.

### Backend Architecture
The server is an Express.js REST API with TypeScript:

- **Framework**: Express.js with standard middleware (JSON parsing, CORS, cookie handling)
- **Authentication**: Session-based authentication with support for Keycloak integration via JWT tokens
- **Database Abstraction**: Storage interface pattern allowing easy migration from in-memory to persistent storage
- **API Design**: RESTful endpoints for connectors, statistics, dataspace settings, and authentication
- **Development Integration**: Vite middleware integration for seamless full-stack development

### Data Storage Solutions
Currently implements flexible storage architecture designed for easy migration:

- **Storage Interface**: IStorage interface defines contracts for all data operations (users, connectors, settings, stats)
- **In-Memory Implementation**: MemStorage class for development and testing with demo data
- **Schema Definition**: Drizzle ORM schemas ready for PostgreSQL migration
- **Data Models**: User management, connector lifecycle, dataspace configuration, and analytics tracking

The application is configured for PostgreSQL with Drizzle ORM but uses in-memory storage for simplicity and rapid development.

### Authentication and Authorization
Implements hybrid authentication supporting both local and Keycloak-based authentication:

- **Session Management**: Express sessions with HttpOnly cookies for security
- **Keycloak Integration**: JWT token handling for ARENA2036 Central Identity Provider
- **Password Grant Flow**: Support for username/password authentication via Keycloak
- **Protected Routes**: Client-side route protection using React Context
- **Token Management**: Automatic token refresh and session validation

## External Dependencies

### Third-Party Services
- **Keycloak**: Central Identity Provider (https://centralidp.arena2036-x.de) for authentication and authorization
- **SDE (Semantic Data Exchange)**: External service for dataspace statistics and connector data

### Database and Storage
- **PostgreSQL**: Configured for production deployment with Drizzle ORM
- **Neon Database**: Cloud PostgreSQL service integration ready

### Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across full stack
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation for API boundaries

### UI and Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **React Hook Form**: Form state management

### Infrastructure
- **Replit**: Development environment with runtime error handling
- **Node.js**: Runtime environment (v20 recommended for macOS compatibility)
- **Express.js**: Web server framework