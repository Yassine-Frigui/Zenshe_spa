-- Add jotform_submission column to reservations table
-- This column stores the complete Jotform submission data as JSON

ALTER TABLE reservations 
ADD COLUMN jotform_submission JSON DEFAULT NULL 
COMMENT 'Stores Jotform submission data including all answers and metadata';

-- Add a generated column for submissionID extracted from jotform_submission JSON
ALTER TABLE reservations
ADD COLUMN jotform_submission_id VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(jotform_submission, '$.submissionID'))) STORED;

-- Add index for better query performance when filtering by Jotform submissionID
CREATE INDEX idx_reservations_jotform_id ON reservations (jotform_submission_id);
