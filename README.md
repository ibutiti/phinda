# Phinda

Phinda is a CAPS-aligned mathematics learning app built for African classrooms. Students practise grade-appropriate maths, receive feedback, and track their progress.

## What it does

- Serves published Grade 7 CAPS Mathematics questions.
- Generates and separately verifies questions against approved source text when no published question matches the requested answer type.
- Grades multiple-choice and short-text answers on the server.
- Tracks student progress and recent attempts.
- Requires sign-in for study and curriculum routes.

The default question source is an excerpt from the Department of Basic Education's [Grade 7-9 Mathematics CAPS policy](https://www.education.gov.za/LinkClick.aspx?fileticket=uCNqOwfGbmc%3d&tabid=573&portalid=0&mid=1629&forcedownload=true#page=68), Grade 7 Term 4, Topic 1.3, page 68. The app supplies that excerpt and its exact supporting quotes to both AI checks. Migration `0003_unpublish_unverified_questions.sql` unpublishes older rows without current approved-source evidence.
AI question generation currently covers Grade 7 integer addition and subtraction only.

Students in under-resourced classrooms can lack reliable curriculum-aligned practice and timely feedback. Phinda aims to make structured practice, clear explanations, and progress visibility easier to access.

## Stack

- TanStack Start and TanStack Router
- Cloudflare Workers and D1
- Workers AI for question generation and verification
- Clerk for authentication

## Run locally

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Clerk

Copy `.env.example` to `.env.local`, then set the Clerk keys:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Create an application in the [Clerk dashboard](https://dashboard.clerk.com). Never expose `CLERK_SECRET_KEY`.

### 3. Configure D1

Create a database:

```bash
pnpm exec wrangler d1 create phinda
```

Set the returned database ID in `wrangler.jsonc`. Apply migrations locally:

```bash
pnpm exec wrangler d1 migrations apply phinda --local
```

Use `--remote` to apply migrations to the deployed database. Migration `0002_question_bank_metadata.sql` adds question provenance and publication fields. Migration `0003_unpublish_unverified_questions.sql` unpublishes rows without current approved-source evidence.

### 4. Start the app

```bash
pnpm dev
```

Open `http://localhost:3000`. `/study` and `/subjects/grade-7-mathematics` require a signed-in student.

Workers AI uses the `AI` binding in `wrangler.jsonc`. Local AI requests may use remote Cloudflare resources and incur charges.

## Data and answer checking

Answer submission uses the authenticated Clerk user ID; clients cannot choose another student ID. Incorrect answers return the stored correct answer and explanation. Progress counts unique published questions for completion, and includes all correct attempts.

Short-text answer keys use this JSON shape:

```json
{
  "type": "short_text",
  "acceptedAnswers": ["right angle"],
  "requiredTerms": ["90 degrees", "angle"]
}
```

An answer is correct when it matches an accepted answer after whitespace and case normalization, or includes every required rubric term. Multiple-choice keys use `{ "type": "multiple_choice", "correctAnswer": "B" }`.

## Development checks

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
```

`pnpm build` creates the production build. `pnpm deploy` builds and deploys to Cloudflare Workers; run `pnpm exec wrangler login` first.

For production, configure production Clerk keys and domain, set a real D1 database ID in `wrangler.jsonc`, apply migrations remotely, and verify Workers AI is enabled for the account.
