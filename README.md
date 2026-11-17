# Phinda

Phinda is a CAPS-aligned mathematics learning app built for African classrooms. It helps students practise grade-appropriate maths questions, receive instant feedback, and build confidence through short, structured exercises that match the curriculum they are learning in school.

## What the app does

The app is designed around a simple loop:

- generate or approve maths questions from trusted CAPS sources
- publish only valid questions into a student-facing question bank
- let students answer multiple-choice or short-text questions
- grade answers automatically
- return the correct answer and explanation when a response is wrong
- track student progress and recent attempts over time

Under the hood, the project uses:

- TanStack Start for the app shell and server functions
- Cloudflare Workers for the runtime
- D1 for persistent data
- Clerk for authentication
- a validated question bank that enforces approved Grade 7 CAPS sources

The question validation logic is intentionally strict. Questions must come from an approved source, include a clear explanation, and satisfy the expected answer format before they are published.

## The African problem it solves

Across many African classrooms, students still face a shortage of reliable, curriculum-aligned practice resources, especially in under-resourced schools where teacher time and feedback are limited.

Phinda addresses that gap by giving schools and learners a lightweight system for:

- structured maths practice aligned to South African CAPS standards
- immediate feedback instead of waiting for delayed marking
- consistent question quality and answer checking
- progress visibility without needing a large, expensive learning platform

In practical terms, it helps turn scarce classroom time into better practice and faster learning, especially for learners who need regular reinforcement and clear explanations.

## Key features

- CAPS-aware question validation with approved-source checks
- Multiple-choice and short-text question support
- Automatic grading and rubric-style short-answer matching
- Student progress summaries and recent attempt history
- Secure authenticated server functions
- Cloudflare-native deployment with D1 database support

## Project structure

- `src/lib/caps-question-bank.ts` — question generation and validation rules
- `src/server/answer-checking.ts` — answer grading and progress logic
- `src/server/answer-api.ts` — authenticated student answer endpoints
- `src/server/d1-answer-repository.ts` — D1 storage layer
- `migrations/0001_questions_and_answer_attempts.sql` — database schema
- `wrangler.jsonc` — Cloudflare Worker and D1 config

## How to run it locally

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment variables

Copy the sample environment file and add your Clerk keys:

```bash
cp .env.example .env.local
```

Then fill in:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3) Create the local Cloudflare D1 database

```bash
pnpm exec wrangler d1 create phinda
```

Take the database ID returned by Wrangler and paste it into `wrangler.jsonc` in the `d1_databases` entry.

### 4) Apply the schema

```bash
pnpm exec wrangler d1 migrations apply phinda --local
```

### 5) Start the app

```bash
pnpm dev
```

The app runs on:

```text
http://localhost:3000
```

## Production build

To build for production:

```bash
pnpm build
```

To deploy to Cloudflare Workers:

```bash
pnpm run deploy
```

If you are deploying for the first time, make sure you are logged in to Wrangler:

```bash
npx wrangler login
```

## Notes for development

- `pnpm test` runs the answer-checking test suite.
- `pnpm lint`, `pnpm format`, and `pnpm check` are available for code quality checks.
- The app is intentionally strict about approved curriculum sources, which helps keep student-facing content trustworthy and aligned to the curriculum.

## Why this matters

This project is not just a quiz app. It is a practical tool for raising learning quality where students need reliable practice and fast feedback the most. By combining curriculum validation, instant grading, and progress tracking, Phinda turns a common classroom problem into a scalable, accessible learning workflow.
