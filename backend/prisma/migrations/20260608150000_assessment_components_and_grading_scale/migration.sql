ALTER TABLE "assessments"
ADD COLUMN "ca_recorded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "exam_recorded" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "grading_scales" (
  "id" SERIAL NOT NULL,
  "grade" TEXT NOT NULL,
  "min" INTEGER NOT NULL,
  "max" INTEGER NOT NULL,
  "remarks" TEXT NOT NULL,
  CONSTRAINT "grading_scales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grading_scales_grade_key" ON "grading_scales"("grade");

INSERT INTO "grading_scales" ("grade", "min", "max", "remarks") VALUES
('A', 80, 100, 'Exemplary'),
('B', 70, 79, 'Very good'),
('C', 60, 69, 'Satisfactory'),
('D', 50, 59, 'Fair effort'),
('E', 0, 49, 'Needs focused support');

INSERT INTO "_StreamSubjects" ("A", "B")
SELECT s.id, sub.id
FROM "streams" s
CROSS JOIN "subjects" sub
ON CONFLICT DO NOTHING;
