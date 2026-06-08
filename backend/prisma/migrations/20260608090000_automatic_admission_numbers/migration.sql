-- Create a database sequence so concurrent registrations always receive
-- different admission numbers.
CREATE SEQUENCE IF NOT EXISTS "student_admission_number_seq";

-- Continue after the largest numeric suffix already stored in the database.
DO $$
DECLARE
  next_admission_number BIGINT;
BEGIN
  SELECT COALESCE(
    MAX((regexp_match("admission_number", '([0-9]+)$'))[1]::BIGINT),
    0
  ) + 1
  INTO next_admission_number
  FROM "students"
  WHERE "admission_number" ~ '[0-9]+$';

  PERFORM setval(
    'student_admission_number_seq',
    next_admission_number,
    false
  );
END $$;

ALTER TABLE "students"
ALTER COLUMN "admission_number"
SET DEFAULT (
  'IKX' || lpad(nextval('student_admission_number_seq')::TEXT, 4, '0')
);
