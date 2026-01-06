# SendGrid Email Notification System for Rental Management

## Overview

This system provides automated email notifications for rental management, including:
- **Rental End Reminders**: Sent 1-3 days before rental end date
- **Overdue Notifications**: Sent when rentals are past due
- **Penalty Charge Alerts**: Sent when late return penalties are applied
- **Status Update Emails**: Sent when rental status changes

## Configuration

### Environment Variables (.env)

```env
# SendGrid Email Configuration
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=your-email@example.com
FROM_NAME=D'jackman Tailor Deluxe

# Rental Penalty Configuration
PENALTY_RATE_PER_DAY=100
REMINDER_DAYS_BEFORE=1
```

## File Structure

```
backend/
├── services/
│   ├── emailService.js           # SendGrid email sending service
│   ├── rentalMonitoringService.js # Rental monitoring and penalty calculation
│   └── cronScheduler.js          # Scheduled task management
├── database/
│   └── rental_penalty_schema.sql  # Database schema for penalty tracking
└── .env                           # Environment configuration
```

## Features

### 1. Automated Email Notifications

#### Rental End Reminders
- Sent 1, 2, and 3 days before rental end date
- Also sent on the day of rental end
- Professional HTML template with rental details

#### Overdue Notifications
- Sent when rental is 1, 3, and 7 days overdue
- Includes current penalty amount
- Sent every 3 days for ongoing overdue rentals

#### Penalty Charge Emails
- Sent when admin marks rental as "Returned" after due date
- Includes breakdown of original price and penalty
- Shows total amount due

### 2. Scheduled Tasks (Cron Jobs)

- **Hourly Check**: Monitors overdue rentals every hour
- **6-Hour Check**: Sends reminder notifications every 6 hours
- **Startup Check**: Runs all checks when server starts

### 3. Database Tables

#### rental_email_logs
Tracks all sent emails with status and timestamps.

#### rental_reminders_sent
Prevents duplicate reminder emails for the same rental.

#### rental_penalty_tracking
Tracks daily penalty calculations for overdue rentals.

## API Endpoints

### GET /api/rentals/monitoring/active
Get all active rentals with their penalty status.

### GET /api/rentals/monitoring/penalty/:itemId
Calculate penalty for a specific rental item.

### POST /api/rentals/monitoring/check
Trigger a manual rental check (admin only).

### GET /api/rentals/monitoring/status
Get the scheduler status.

## Frontend Integration

### User Interface (Profile.jsx)
- Shows overdue warnings with penalty amounts
- Displays "Due Today" and "Due Soon" alerts
- Shows late return penalty in order details

### Admin Interface (Rental.jsx)
- Overdue badges in rental table
- Detailed overdue information in view modal
- Penalty information in order details
- Email notification status indicators

## Email Templates

### Professional HTML Templates Include:
- Company branding (D'jackman Tailor Deluxe)
- Gradient headers
- Clear rental details
- Penalty warnings with amounts
- Call-to-action buttons
- Responsive design

## Penalty Calculation

- **Rate**: ₱100 per day
- **Calculation**: (Current Date - Rental End Date) × ₱100
- **Applied**: When rental status is changed to "Returned"
- **Stored**: In `pricing_factors` JSON field

## Usage

### Starting the Server
```bash
cd backend
npm run devStart
```

The scheduler will automatically initialize and begin monitoring rentals.

### Manual Trigger
Use the API endpoint or admin panel to manually trigger a rental check:
```bash
curl -X POST http://localhost:5000/api/rentals/monitoring/check
```

## Logs

The system logs all activities with prefixes:
- `[EMAIL SERVICE]` - Email sending operations
- `[RENTAL MONITOR]` - Rental monitoring operations
- `[CRON SCHEDULER]` - Scheduled task operations
- `[RENTAL PENALTY]` - Penalty calculation operations

## Troubleshooting

### Emails Not Sending
1. Check SendGrid API key in `.env`
2. Verify sender email is verified in SendGrid
3. Check server logs for `[EMAIL SERVICE]` errors

### Scheduler Not Running
1. Check server startup logs for initialization messages
2. Use `/api/rentals/monitoring/status` to check scheduler status

### Penalties Not Calculating
1. Ensure `rental_end_date` is set in order_items
2. Check if status is being changed to "returned"
3. Verify database tables are created

## Security Notes

- API endpoints require authentication
- Admin-only endpoints check user role
- Email logs don't store sensitive content
- API keys stored in environment variables
