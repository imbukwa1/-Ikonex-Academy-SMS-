# Ikonex Student Management System API

Backend API for Ikonex Academy using Node.js, TypeScript, Express, PostgreSQL, and Prisma.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set your PostgreSQL `DATABASE_URL` and `CORS_ORIGIN`.

3. Generate Prisma Client and run the migration:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```

4. Seed sample streams and subjects:

   ```bash
   npm run seed
   ```

5. Import spreadsheet data when needed:

   ```bash
   npm run import:workbook -- "C:\Users\imbuk\Downloads\Ikonex_SMS_Demo_Data_120_Students.xlsx" "Term 1"
   ```

   The importer reads the workbook headers dynamically, removes trailing headcount
   numbers from student names, creates streams and subjects, assigns subjects to
   streams, registers students, and upserts assessment scores.

6. Start the API:

   ```bash
   npm run dev
   ```

## Endpoints

- `POST /streams` - create a stream
- `GET /streams` - list streams
- `GET /streams/:id` - view one stream with assigned subjects and students
- `POST /streams/:id/subjects` - assign subjects to a stream with `{ "subjectIds": [1, 2] }`
- `POST /subjects` - create a subject
- `GET /subjects` - list subjects
- `PATCH /subjects/:id` - update a subject
- `DELETE /subjects/:id` - delete a subject
- `POST /students` - register a student and assign to a stream
- `GET /students` - list students
- `GET /students/stream/:streamId` - list students in a stream
- `GET /students/:id` - view one student with stream and assessments
- `PATCH /students/:id` - update a student
- `DELETE /students/:id` - delete a student
- `POST /scores` - record marks for a student
- `PATCH /scores/:id` - edit recorded marks and recalculate total, grade, and remarks
- `GET /results/subject/:subjectId/stream/:streamId` - rank a stream in one subject
- `GET /results/student/:studentId` - view one student's results, totals, average, and class position
- `GET /results/class/:streamId` - view class rankings and summary statistics

## Example Score Payload

```json
{
  "student_id": 1,
  "subject_id": 1,
  "ca_score": 35,
  "exam_score": 52,
  "term": "Term 1"
}
```

## Example Student Payload

```json
{
  "admission_number": "IKX001",
  "first_name": "Amina",
  "last_name": "Otieno",
  "stream_id": 1
}
```
