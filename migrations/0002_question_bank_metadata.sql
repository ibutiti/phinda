ALTER TABLE questions ADD COLUMN source_ref TEXT;
ALTER TABLE questions ADD COLUMN source_title TEXT;
ALTER TABLE questions ADD COLUMN rubric TEXT;
ALTER TABLE questions ADD COLUMN options TEXT;
ALTER TABLE questions ADD COLUMN generated_from TEXT;
ALTER TABLE questions ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'
  CHECK (status IN ('accepted', 'rejected'));

CREATE INDEX questions_by_status_subject
  ON questions (status, subject);
