# Sales Order AI Automation Platform

## Overview

Sales Order AI Automation is a multi-tenant SaaS platform that automates the complete purchase order lifecycle from email intake to ERP integration. The system uses AI-powered document processing to extract, validate, and format purchase order data, then automatically pushes it to various ERP systems like NetSuite, SAP, Oracle, and Microsoft Dynamics.

The platform provides real-time monitoring, agent observability, and comprehensive analytics for enterprise purchase order processing workflows. Each tenant has isolated data and configurations with role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Updates**: WebSocket integration for live process monitoring

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with JSON responses

### Multi-Tenant Data Isolation
- Tenant-based data segregation at the database level
- Role-based access control (RBAC) for user permissions
- Isolated configurations for email accounts, ERP systems, and AI settings per tenant

### AI Processing Pipeline
- **Document Processing**: OCR and text extraction from PDFs, Word docs, and images
- **AI Classification**: OpenAI integration for email and document classification
- **Data Extraction**: LangGraph-based agents for structured data extraction
- **Validation**: Automated vendor and address validation against master data
- **Formatting**: ERP-specific data formatting for different target systems

### Email Integration
- **Multi-Provider Support**: Gmail, Outlook, and IMAP email account integration
- **OAuth Authentication**: Secure OAuth flows for Gmail and Microsoft Graph
- **Background Monitoring**: Automated email checking with configurable intervals
- **Attachment Processing**: Support for PDF, Word, image, and text file attachments

### ERP Integration Layer
- **Multiple ERP Support**: NetSuite, SAP, Oracle Fusion, Microsoft Dynamics
- **API Abstraction**: Unified interface for different ERP system APIs
- **Error Handling**: Comprehensive retry logic and error logging
- **Real-time Status**: Live updates on integration success/failure

### Database Schema
- **Sessions Table**: Required for Replit Auth session management
- **Users & Tenants**: Multi-tenant user management with role assignments
- **Email Accounts**: Configuration storage for email monitoring
- **ERP Systems**: ERP connection credentials and settings
- **Purchase Orders**: Core business entity with processing status
- **Processing Logs**: Audit trail for all processing activities
- **Notifications**: System alerts and user notifications

### Background Processing
- **Job Scheduling**: Interval-based email monitoring and processing
- **Queue Management**: Asynchronous processing of purchase orders
- **Agent Orchestration**: Coordination between email, AI, and ERP agents
- **Monitoring**: Real-time tracking of all background processes

### Security & Compliance
- **Authentication**: Replit Auth with OpenID Connect
- **Data Encryption**: Secure credential storage for ERP and email accounts
- **Audit Logging**: Complete audit trail for all processing activities
- **Multi-tenant Isolation**: Strict data separation between tenants

## External Dependencies

### Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Connection Pooling**: pg library with connection pooling
- **Migrations**: Drizzle Kit for database schema management

### AI & Machine Learning
- **OpenAI API**: GPT models for document classification and data extraction
- **Custom AI Endpoints**: Support for custom AI model endpoints
- **Document Processing**: Tesseract.js for OCR, pdf-parse for PDF processing

### Email Services
- **Google Gmail API**: Gmail integration via Google OAuth
- **Microsoft Graph API**: Outlook/Office 365 integration
- **IMAP Protocol**: Generic IMAP email server support

### ERP Systems
- **NetSuite REST API**: Direct integration with NetSuite
- **SAP APIs**: SAP system integration
- **Oracle Fusion Cloud**: Oracle ERP integration
- **Microsoft Dynamics**: Dynamics 365 integration

### Authentication & Session Management
- **Replit Auth**: Primary authentication provider
- **OpenID Connect**: Standard authentication protocol
- **PostgreSQL Session Store**: Session persistence

### Real-time Communication
- **WebSocket Server**: Real-time updates for process monitoring
- **Event Broadcasting**: Live status updates across connected clients

### File Processing
- **Mammoth.js**: Word document text extraction
- **PDF-parse**: PDF text extraction
- **Tesseract.js**: Image OCR processing

### Development & Deployment
- **Vite**: Frontend build tool and development server
- **ESBuild**: Server-side TypeScript compilation
- **Replit Runtime**: Deployment platform integration