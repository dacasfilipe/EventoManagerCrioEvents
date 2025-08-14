# Event Management Platform

## Project Overview
A modern event management platform built with React.js, TypeScript, Express.js, and PostgreSQL. Designed to simplify event planning, tracking, and engagement through intuitive design and powerful features.

## Architecture
- **Frontend**: React.js with TypeScript, Vite build tool
- **Backend**: Express.js with TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Local auth + OAuth (Google, Facebook)
- **File Upload**: Multer for image uploads
- **UI Components**: shadcn/ui with Tailwind CSS
- **Email**: Nodemailer integration
- **Deployment**: Configured for Vercel

## Recent Changes (January 2025)

### Security Updates
- ✓ Fixed CVE-2025-48997 vulnerability by upgrading multer from 1.4.5-lts.2 to 2.0.2
- ✓ Updated @types/multer for TypeScript compatibility

### Deployment Configuration - COMPLETED ✅
- ✓ Created complete Vercel deployment configuration (vercel.json)
- ✓ Built serverless function entry point (api/index.ts)
- ✓ Added environment variables template (.env.example)
- ✓ Created comprehensive deployment guide (DEPLOY_VERCEL.md)
- ✓ Configured upload handling for production environment
- ✓ Added .vercelignore for clean deployments
- ✓ Installed @vercel/node package for deployment support
- ✓ Set up proper routing for API endpoints and static files

## Key Features
- User authentication (local + OAuth)
- Event creation and management
- Attendee registration
- File upload for event images
- Activity logging
- Dashboard with statistics
- Responsive design

## Database Schema
- **users**: User accounts with roles and OAuth support
- **events**: Event information with categories and status
- **attendees**: Event registration data
- **activities**: System activity logs

## Deployment Instructions

### Vercel Deploy Steps:
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard:
   - DATABASE_URL (required)
   - GOOGLE_CLIENT_ID/SECRET (optional)
   - EMAIL_USER/EMAIL_PASS (optional)  
   - SESSION_SECRET (required)
   - FACEBOOK_CLIENT_ID/SECRET (optional)
3. Deploy with automatic builds

### Environment Variables Required:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Random secret key for sessions
- OAuth credentials (optional but recommended)

## User Preferences
- Language: Portuguese (user communicates in Portuguese)
- Deployment preference: Vercel
- Security-conscious: Requires immediate fixes for vulnerabilities

## Development Guidelines
- Use TypeScript for type safety
- Follow the fullstack_js blueprint patterns
- Minimize file count by combining similar components
- Use PostgreSQL for persistence
- Authentication required for sensitive operations