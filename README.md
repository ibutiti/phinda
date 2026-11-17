# Phinda

Phinda is a CAPS-aligned mathematics learning app built for African classrooms. Students practise grade-appropriate maths, receive feedback, and track their progress.

## What it does

- Serves published Grade 7 CAPS Mathematics questions.
- Generates and separately verifies questions against approved source text when no published question matches the requested answer type.
- Grades multiple-choice and short-text answers on the server.
- Tracks student progress and recent attempts.
- Requires sign-in for study and curriculum routes.

The question bank currently uses an app-maintained curriculum summary and links to the Department of Basic Education's CAPS policy page. It does not fetch or verify against a Grade 7 Mathematics source document. Review `DEFAULT_APPROVED_CAPS_SOURCES` before relying on generated questions as authoritative curriculum content.

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

Use `--remote` to apply migrations to the deployed database. Migration `0002_question_bank_metadata.sql` adds question provenance and publication fields.

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
