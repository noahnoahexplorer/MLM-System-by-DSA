# MLM Exclusion Audit Logging System

This document describes the implementation of an audit logging system for the MLM exclusion list. The system tracks who excluded a specific username, who inactivated/reactivated them, and other changes to exclusion records, with timestamps for all actions.

## Implementation Overview

The solution consists of:

1. A new database table to store audit logs
2. Enhanced API endpoints to record actions
3. A user interface to view the audit logs

## Setup Instructions

### 1. Create the Audit Log Table

Run the SQL script in `scripts/create_exclusion_audit_table.sql` to create the table in your Snowflake database:

```sql
-- Create the audit log table for exclusion actions
CREATE TABLE IF NOT EXISTS DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_AUDIT_LOG (
  ID NUMBER AUTOINCREMENT START 1 INCREMENT 1,
  REFEREE_LOGIN VARCHAR(255) NOT NULL,
  ACTION_TYPE VARCHAR(50) NOT NULL,
  ACTION_BY VARCHAR(255) NOT NULL,
  ACTION_DETAILS TEXT,
  PREVIOUS_STATE TEXT,
  NEW_STATE TEXT,
  ACTION_DATE TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (ID)
);
```

### 2. Deploy the Updated API Endpoints

The following files have been modified to support audit logging:

- `app/api/exclusion-referees/route.ts` - Enhanced POST endpoint to log creation actions
- `app/api/exclusion-referees/[id]/route.ts` - Enhanced PUT endpoint to log update actions
- `app/api/exclusion-audit/route.ts` - New endpoint to fetch audit logs

### 3. Deploy the UI Components

- `components/exclusion-list/exclusion-audit-log.tsx` - New component to display audit logs
- `components/exclusion-list/exclusion-list-manager.tsx` - Updated to include a tab for audit logs

## How It Works

### Creating an Exclusion

When a new exclusion is created:
1. The system adds a record to the exclusion list
2. It also adds an audit log entry with:
   - `ACTION_TYPE` = "CREATE"
   - Details about who created the exclusion
   - The initial state of the exclusion

### Updating an Exclusion

When an exclusion is updated:
1. The system updates the record in the exclusion list
2. It compares the old and new values to determine what changed
3. It adds an audit log entry with:
   - `ACTION_TYPE` = "UPDATE"
   - Details about what was changed (active status, reason, end date)
   - Who made the change
   - The previous and new states

### Viewing Audit Logs

Users can view the audit logs by:
1. Going to the Exclusion List Manager
2. Clicking on the "Audit Logs" tab
3. Using the search box to filter logs by referee, action type, or the person who performed the action
4. Clicking refresh to update the list

### Filtering Audit Logs by Referee

To see all changes for a specific referee:
1. Go to the Audit Logs tab
2. Enter the referee's username in the search box
3. The list will show only changes affecting that referee

## Additional Notes

- Audit logs are never deleted to maintain a complete history
- Each action is timestamped with the exact time it occurred
- The audit log includes details about who performed each action
- The system tracks both successful and unsuccessful changes 