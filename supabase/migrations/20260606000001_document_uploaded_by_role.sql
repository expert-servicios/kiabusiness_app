-- Add uploaded_by_role to documents to distinguish client uploads from admin deliverables.
-- Existing rows default to 'client'; admin-uploaded docs will be tagged 'admin' going forward.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS uploaded_by_role text NOT NULL DEFAULT 'client'
    CHECK (uploaded_by_role IN ('client', 'admin'));

COMMENT ON COLUMN documents.uploaded_by_role IS 'Who uploaded the file: client (client-provided input) or admin (deliverable/result from the advisory team)';
