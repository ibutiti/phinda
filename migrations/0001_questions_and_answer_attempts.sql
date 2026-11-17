CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_text')),
  prompt TEXT NOT NULL,
  answer_key TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL
);

CREATE INDEX questions_by_subject ON questions (subject);

CREATE TABLE answer_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions (id),
  submitted_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX answer_attempts_by_student
  ON answer_attempts (student_id, created_at DESC);
