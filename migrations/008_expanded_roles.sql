ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('individual', 'certified_student', 'instructor_applicant', 'instructor', 'group_admin', 'admin', 'super_admin'));
