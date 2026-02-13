# AppleCare+ Activation Management System - PRD

## Original Problem Statement
Build an AppleCare+ activation management system for Apple partners. The process involves:
1. Customer/dealer fills form with: Dealer Name, Dealer Mobile, Customer Name, Customer Number, Customer Email, Model ID, Serial Number, Plans (searchable dropdown), Device Activation Date
2. System auto-creates ticket in osTicket
3. System auto-sends email to Apple in tabular format
4. Settings page to manage: Apple email recipient, SMTP config, osTicket API, and AppleCare+ plans master

## User Choices/Preferences
- osTicket integration: URL/API key to be configured later in settings
- Email: Google Workspace SMTP with app password
- Auth: JWT-based admin login with password reset
- Invoice: Local storage with auto-generated PDF if not uploaded
- Design: Minimal, professional

## User Personas
1. **Admin/Partner Staff**: Manages activation requests, configures settings, tracks statuses
2. **Dealer**: Submits activation requests via the form
3. **Customer**: End beneficiary of AppleCare+ activation

## Core Requirements (Static)
- [x] JWT-based authentication with password reset
- [x] Dashboard with stats and requests table
- [x] New Activation Request form with all required fields
- [x] AppleCare+ plans master management (CRUD)
- [x] Settings page for Email, osTicket, and Plans configuration
- [x] Request detail view with status management
- [x] Auto PDF invoice generation
- [x] Email to Apple in tabular format (ready when SMTP configured)
- [x] osTicket ticket creation (ready when API configured)

## What's Been Implemented (Feb 13, 2026)
### Backend (FastAPI)
- JWT authentication with Header authorization
- User management (login, password change)
- AppleCare+ Plans CRUD endpoints
- Activation Requests CRUD endpoints
- Settings management endpoints
- PDF invoice generation using reportlab
- Email service using aiosmtplib (SMTP/TLS)
- osTicket integration via HTTP API
- Dashboard stats endpoint
- Default admin and plans seeding on startup

### Frontend (React)
- Login page with credentials hint
- Dashboard with stats cards and requests table
- New Request form with searchable plan dropdown
- Settings page with 4 tabs (Email, osTicket, Plans, Password)
- Request detail page with status management
- Responsive sidebar navigation
- Toast notifications using sonner

## Database Collections
- `users` - Admin users
- `plans` - AppleCare+ plans master
- `activation_requests` - Activation requests
- `settings` - System configuration (email, osTicket, partner name)

## Prioritized Backlog
### P0 (Done)
- [x] Core CRUD operations
- [x] Authentication
- [x] Form submission
- [x] Settings management

### P1 (Ready - Needs User Config)
- [ ] SMTP email sending (waiting for user to configure credentials)
- [ ] osTicket integration (waiting for user to provide API URL/key)

### P2 (Future Enhancements)
- [ ] Bulk activation requests import
- [ ] Email templates customization
- [ ] Reporting and analytics
- [ ] Dealer portal (separate login)
- [ ] Notification when Apple responds

## Default Credentials
- Email: `admin@applecare.com`
- Password: `admin123`

## API Endpoints
- POST /api/auth/login, /api/auth/change-password
- GET /api/auth/me
- GET/POST /api/plans, PUT/DELETE /api/plans/{id}
- GET/PUT /api/settings
- GET/POST /api/activation-requests
- GET /api/activation-requests/{id}
- PUT /api/activation-requests/{id}/status
- POST /api/activation-requests/{id}/resend-email
- GET /api/activation-requests/{id}/invoice
- GET /api/stats
