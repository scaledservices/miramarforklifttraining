CREATE TABLE IF NOT EXISTS instructor_assignments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES onsite_training_requests(id),
  instructor_id INTEGER NOT NULL REFERENCES instructors(id),
  status TEXT NOT NULL DEFAULT 'proposed',
  assigned_by_user_id INTEGER NOT NULL REFERENCES users(id),
  notes TEXT,
  assigned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instructor_assignments_request_id_idx ON instructor_assignments(request_id);
CREATE INDEX IF NOT EXISTS instructor_assignments_instructor_id_idx ON instructor_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS instructor_assignments_status_idx ON instructor_assignments(status);

CREATE TABLE IF NOT EXISTS instructor_assignment_status_changes (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES instructor_assignments(id),
  changed_by_user_id INTEGER NOT NULL REFERENCES users(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instructor_assignment_status_changes_assignment_id_idx ON instructor_assignment_status_changes(assignment_id);
