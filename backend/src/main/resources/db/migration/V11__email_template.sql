ALTER TABLE society_settings
  ADD COLUMN reminder_email_subject VARCHAR(200) DEFAULT 'Maintenance Due Reminder',
  ADD COLUMN reminder_email_body TEXT;