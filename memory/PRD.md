# AppleCare+ Activation Management System - PRD

## Original Problem Statement
Build an AppleCare+ activation management system for Apple partners. The process involves:
1. Customer/dealer fills form with: Dealer Name, Dealer Mobile, Customer Name, Customer Number, Customer Email, Model ID, Serial Number, Plans (searchable dropdown), Device Activation Date
2. **NEW: Admin receives approval email with Approve/Decline buttons**
3. **Only after approval**: System auto-creates ticket in TGME Support Ticket system
4. **Only after approval**: System auto-sends email to Apple in tabular format (supports multiple recipients)
5. Settings page to manage: Apple email recipients, **Approval email address**, SMTP config, TGME Support Ticket API, and AppleCare+ plans master

## User Choices/Preferences
- Form is public - anyone can fill without login
- TGME Support Ticket integration: URL/API key to be configured in settings
- Email: Google Workspace SMTP with app password
- Auth: JWT-based admin login with password reset
- Invoice: Local storage with auto-generated PDF if not uploaded
- Design: Minimal, professional
- Billing Location: Hardcoded as F9B4869273B7
- Payment Type: Hardcoded as Insta
- **Approval workflow enabled by default** - requests need admin approval before processing

## User Personas
1. **Admin/Partner Staff**: Manages activation requests, **approves/declines requests**, configures settings, tracks statuses
2. **Dealer/Customer**: Submits activation requests via the PUBLIC form (no login needed)

## Core Requirements

### Implemented ✅
- [x] PUBLIC activation form (no login required)
- [x] Form cursor bug FIXED (using individual useState per field)
- [x] Dealer Email field added to form
- [x] Billing Location and Payment Type fields removed from form (hardcoded in backend)
- [x] JWT-based authentication for admin portal
- [x] Dashboard with stats and requests table with Ticket ID column
- [x] AppleCare+ plans management with full CRUD
- [x] Excel upload for plans with sample file download
- [x] Plan dropdown displays: SKU - Description (₹MRP)
- [x] Settings page for Email, TGME Support Ticket, and Plans configuration
- [x] Multiple Apple email recipients support (comma-separated)
- [x] Request detail view with status management
- [x] **Professional PDF Invoice Generation** matching real invoice format:
  - Random Indian mobile shop names and addresses
  - Date = Activation Date
  - Customer details from form
  - Product table with 2 items: Device + AppleCare+
  - **Serial number shown on BOTH Device AND AppleCare+ items**
  - Device auto-detected from AppleCare+ plan (iPhone, MacBook Pro, iPad, etc.)
  - Device pricing: MacBook Air ₹80K, MacBook Pro ₹1.69L, iPhone ₹79.9K, etc.
  - 18% GST inclusive with CGST/SGST breakdown
  - HSN/SAC codes, amount in words, tax breakdown table
- [x] Email to Apple in tabular format (ready when SMTP configured)
- [x] **TGME Support Ticket uses DEALER details** (name, email, mobile) not customer
- [x] Renamed "osTicket" to "TGME Support Ticket" throughout the app
- [x] **APPROVAL WORKFLOW COMPLETE:**
  - New requests get `pending_approval` status by default
  - Configurable approval email address in Settings (default: contact@thegoodmen.in)
  - Approval email sent with all request details + Approve/Decline buttons
  - Email-based approval via secure token links
  - Dashboard shows "Pending Approval" stat card
  - Approve/Decline buttons in Dashboard for pending_approval requests
  - Status filter includes "Pending Approval" and "Declined" options
  - Only approved requests trigger TGME ticket creation and Apple email
  - Declined requests marked as `declined` status

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
