# Ikonex Student Management System

Production-ready school management system for Ikonex Academy.

## Project Layout

```text
backend/   Node.js, TypeScript, Express, PostgreSQL, Prisma
frontend/  React, Vite, TypeScript, Tailwind CSS, TanStack Query
```

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

Required backend environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

For production, set `CORS_ORIGIN` to the deployed Vercel frontend URL.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Required frontend environment variable:

```env
VITE_API_URL=http://localhost:3000
```

For production, set `VITE_API_URL` to the deployed Railway backend URL.

## Core Features

- Stream, subject, and student management
- Subject assignment per class stream
- Score entry with CA and exam validation
- Duplicate score protection by student, subject, and term
- Automated grading and remarks
- Subject ranking and overall class ranking
- Analytics dashboard with class performance charts
- Professional PDF report card template
- Professional PDF class performance summary template

## Ranking Logic

The backend ranking engine uses PostgreSQL `RANK() OVER` window functions for term-based rankings.

- Subject position ranks students in the same stream and subject.
- Overall class position ranks students in the same stream by total marks.
- Ties share the same rank, so scores can rank as `1st, 1st, 3rd`.

## Review Notes

Generated folders such as `node_modules/`, `dist/`, and TypeScript build cache files are intentionally ignored. Run each app's build command to regenerate production output.
