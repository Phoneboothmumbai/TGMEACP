# AppleCare+ Activation Management System - PRD

## Original Problem Statement
Build an AppleCare+ activation management system for Apple partners. The process involves:
1. Customer/dealer fills form with: Dealer Name, Dealer Mobile, Customer Name, Customer Number, Customer Email, Model ID, Serial Number, Plans (searchable dropdown), Device Activation Date
2. System auto-creates ticket in TGME Support Ticket system
3. System auto-sends email to Apple in tabular format (supports multiple recipients)
4. Settings page to manage: Apple email recipients, SMTP config, TGME Support Ticket API, and AppleCare+ plans master

## User Choices/Preferences
- Form is public - anyone can fill without login
- TGME Support Ticket integration: URL/API key to be configured in settings
- Email: Google Workspace SMTP with app password
- Auth: JWT-based admin login with password reset
- Invoice: Local storage with auto-generated PDF if not uploaded
- Design: Minimal, professional
- Billing Location: Hardcoded as F9B4869273B7
- Payment Type: Hardcoded as Insta

## User Personas
1. **Admin/Partner Staff**: Manages activation requests, configures settings, tracks statuses
2. **Dealer/Customer**: Submits activation requests via the PUBLIC form (no login needed)

## Core Requirements

### Implemented ✅
- [x] PUBLIC activation form (no login required)
- [x] Form cursor bug fixed (InputField moved outside component)
- [x] Billing Location and Payment Type fields removed from form (hardcoded in backend)
- [x] JWT-based authentication for admin portal
- [x] Dashboard with stats and requests table with Ticket ID column
- [x] AppleCare+ plans management with full CRUD
- [x] Excel upload for plans with sample file download
- [x] Plan dropdown displays: SKU - Description (₹MRP)
- [x] Settings page for Email, TGME Support Ticket, and Plans configuration
- [x] Multiple Apple email recipients support (comma-separated)
- [x] Request detail view with status management
- [x] Auto PDF invoice generation
- [x] Email to Apple in tabular format (ready when SMTP configured)
- [x] TGME Support Ticket creation with ID sync (ready when API configured)
- [x] Renamed "osTicket" to "TGME Support Ticket" throughout the app

### URL Structure
- `/` - Public form (anyone can access)
- `/login` - Admin login
- `/admin` - Admin dashboard
- `/admin/settings` - Settings (Email, TGME Support Ticket, Plans, Password)
- `/admin/request/:id` - Request details

## Database Collections
- `users` - Admin users
- `plans` - AppleCare+ plans master with: id, name, part_code, sku, description, mrp, active, created_at
- `activation_requests` - Activation requests with tgme_ticket_id field
- `settings` - System configuration with multiple email support

## API Endpoints
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `GET /api/activation-requests` - List all requests
- `POST /api/activation-requests` - Create new request (public)
- `GET /api/activation-requests/{id}` - Get request details
- `PUT /api/activation-requests/{id}/status` - Update status
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan
- `PUT /api/plans/{id}` - Update plan
- `DELETE /api/plans/{id}` - Deactivate plan
- `GET /api/plans/sample` - Download sample Excel
- `POST /api/plans/upload` - Upload plans from Excel
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Prioritized Backlog

### P0 - Critical (Next)
- [ ] Full TGME Support Ticket integration (waiting for user API credentials)
- [ ] Full SMTP email integration (waiting for user credentials)

### P1 - High Priority
- [ ] PDF invoice customization
- [ ] Email templates customization

### P2 - Future Enhancements
- [ ] Bulk activation requests import
- [ ] Reporting and analytics
- [ ] Dealer portal with login

## Default Credentials
- Email: `admin@applecare.com`
- Password: `admin123`

## Tech Stack
- Backend: FastAPI, MongoDB, JWT
- Frontend: React, TailwindCSS, Shadcn/UI
- PDF: ReportLab
- Excel: OpenPyXL

---
Last Updated: Feb 13, 2026
