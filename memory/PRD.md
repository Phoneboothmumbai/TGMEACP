# AppleCare+ Activation Management System - PRD

## Original Problem Statement
Build an AppleCare+ activation management system for Apple partners. The process involves:
1. Customer/dealer fills form with: Dealer Name, Dealer Mobile, Customer Name, Customer Number, Customer Email, Model ID, Serial Number, Plans (searchable dropdown), Device Activation Date
2. System auto-creates ticket in osTicket
3. System auto-sends email to Apple in tabular format
4. Settings page to manage: Apple email recipient, SMTP config, osTicket API, and AppleCare+ plans master

## User Choices/Preferences
- Form is public - anyone can fill without login
- osTicket integration: URL/API key to be configured later in settings
- Email: Google Workspace SMTP with app password
- Auth: JWT-based admin login with password reset (for backend only)
- Invoice: Local storage with auto-generated PDF if not uploaded
- Design: Minimal, professional

## User Personas
1. **Admin/Partner Staff**: Manages activation requests, configures settings, tracks statuses
2. **Dealer/Customer**: Submits activation requests via the PUBLIC form (no login needed)

## Core Requirements (Static)
- [x] PUBLIC activation form (no login required)
- [x] JWT-based authentication for admin portal
- [x] Dashboard with stats and requests table with osTicket ID column
- [x] New Activation Request form with all required fields
- [x] AppleCare+ plans master management (CRUD)
- [x] Settings page for Email, osTicket, and Plans configuration
- [x] Request detail view with status management
- [x] Auto PDF invoice generation
- [x] Email to Apple in tabular format (ready when SMTP configured)
- [x] osTicket ticket creation with ID sync (ready when API configured)

## What's Been Implemented (Feb 13, 2026)

### URL Structure
- `/` - Public form (anyone can access)
- `/login` - Admin login
- `/admin` - Admin dashboard
- `/admin/settings` - Settings
- `/admin/request/:id` - Request details

### Backend (FastAPI)
- Public POST endpoint for activation requests
- JWT authentication for admin routes
- osTicket ID synced with each request
- PDF invoice generation
- Email service (SMTP/TLS)
- Dashboard stats endpoint

### Frontend (React)
- Public form page at root URL
- Success confirmation after submission
- Admin dashboard with Ticket ID column
- Settings page with all configurations

## Database Collections
- `users` - Admin users
- `plans` - AppleCare+ plans master
- `activation_requests` - Activation requests (includes osticket_id field)
- `settings` - System configuration

## Prioritized Backlog
### P1 (Ready - Needs User Config)
- [ ] SMTP email sending (waiting for user to configure credentials)
- [ ] osTicket integration (waiting for user to provide API URL/key)

### P2 (Future Enhancements)
- [ ] Bulk activation requests import
- [ ] Email templates customization
- [ ] Reporting and analytics

## Default Credentials
- Email: `admin@applecare.com`
- Password: `admin123`
