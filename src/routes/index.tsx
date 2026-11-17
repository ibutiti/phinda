import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@clerk/tanstack-react-start/server'

import {
  type AnswerAttempt,
  type SubjectPack,
  getSubjectProgress,
} from '../lib/subject-progress'

const SUBJECT_PACKS: SubjectPack[] = [
  {
    id: 'biology',
    name: 'Biology',
    questionCount: 18,
    publishedQuestionIds: [
      'bio-1',
      'bio-2',
      'bio-3',
      'bio-4',
      'bio-5',
      'bio-6',
      'bio-7',
      'bio-8',
      'bio-9',
      'bio-10',
      'bio-11',
      'bio-12',
      'bio-13',
      'bio-14',
      'bio-15',
      'bio-16',
      'bio-17',
      'bio-18',
    ],
  },
  {
    id: 'history',
    name: 'History',
    questionCount: 12,
    publishedQuestionIds: [
      'his-1',
      'his-2',
      'his-3',
      'his-4',
      'his-5',
      'his-6',
      'his-7',
      'his-8',
      'his-9',
      'his-10',
      'his-11',
      'his-12',
    ],
  },
  {
    id: 'maths',
    name: 'Mathematics',
    questionCount: 15,
    publishedQuestionIds: [
      'math-1',
      'math-2',
      'math-3',
      'math-4',
      'math-5',
      'math-6',
      'math-7',
      'math-8',
      'math-9',
      'math-10',
      'math-11',
      'math-12',
      'math-13',
      'math-14',
      'math-15',
    ],
  },
]

const ANSWER_ATTEMPTS: AnswerAttempt[] = [
  { id: 'a1', subjectId: 'biology', questionId: 'bio-1', userId: 'student-42', correct: true },
  { id: 'a2', subjectId: 'biology', questionId: 'bio-1', userId: 'student-42', correct: true },
  { id: 'a3', subjectId: 'biology', questionId: 'bio-2', userId: 'student-42', correct: false },
  { id: 'a4', subjectId: 'biology', questionId: 'bio-3', userId: 'student-42', correct: true },
  { id: 'a5', subjectId: 'biology', questionId: 'bio-3', userId: 'student-42', correct: true },
  { id: 'a6', subjectId: 'biology', questionId: 'bio-5', userId: 'student-42', correct: true },
  { id: 'a7', subjectId: 'biology', questionId: 'bio-8', userId: 'student-42', correct: true },
  { id: 'a8', subjectId: 'biology', questionId: 'bio-10', userId: 'student-42', correct: false },
  { id: 'a9', subjectId: 'biology', questionId: 'bio-10', userId: 'student-42', correct: true },
  { id: 'a10', subjectId: 'history', questionId: 'his-1', userId: 'student-42', correct: true },
  { id: 'a11', subjectId: 'history', questionId: 'his-2', userId: 'student-42', correct: true },
  { id: 'a12', subjectId: 'history', questionId: 'his-2', userId: 'student-42', correct: false },
  { id: 'a13', subjectId: 'history', questionId: 'his-4', userId: 'student-42', correct: true },
  { id: 'a14', subjectId: 'history', questionId: 'his-7', userId: 'student-42', correct: true },
  { id: 'a15', subjectId: 'history', questionId: 'his-9', userId: 'student-42', correct: false },
  { id: 'a16', subjectId: 'maths', questionId: 'math-2', userId: 'student-42', correct: true },
  { id: 'a17', subjectId: 'maths', questionId: 'math-2', userId: 'student-42', correct: true },
  { id: 'a18', subjectId: 'maths', questionId: 'math-4', userId: 'student-42', correct: true },
  { id: 'a19', subjectId: 'maths', questionId: 'math-6', userId: 'student-42', correct: true },
  { id: 'a20', subjectId: 'maths', questionId: 'math-6', userId: 'student-42', correct: false },
  { id: 'a21', subjectId: 'maths', questionId: 'math-8', userId: 'student-42', correct: true },
  { id: 'a22', subjectId: 'maths', questionId: 'math-9', userId: 'student-42', correct: true },
  { id: 'a23', subjectId: 'maths', questionId: 'math-12', userId: 'student-42', correct: true },
  { id: 'a24', subjectId: 'maths', questionId: 'math-13', userId: 'student-42', correct: false },
  { id: 'a25', subjectId: 'maths', questionId: 'math-13', userId: 'student-42', correct: true },
]

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const { userId } = await auth()
    return { userId }
  },
})

function Home() {
  const { userId } = Route.useLoaderData()
  const userKey = userId ?? 'signed-out'

  const subjectSummaries = SUBJECT_PACKS.map((subject) => {
    const summary = getSubjectProgress(subject, ANSWER_ATTEMPTS, userKey)

    return {
      ...subject,
      ...summary,
      completionPercent: Number(summary.completionPercentage.toFixed(1)),
    }
  })

  return (
    <main className="page-wrap py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--lagoon-deep)]">
              Student dashboard
            </p>
            <h1 className="display-title mt-2 text-4xl font-bold text-[var(--sea-ink)]">
              Subject study progress
            </h1>
          </div>
          <a
            href="/sign-in"
            className="rounded-full bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--lagoon)]"
          >
            {userId ? 'Open account' : 'Sign in'}
          </a>
        </div>

        {!userId && (
          <section className="island-shell rounded-3xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">
              Progress is locked to signed-in students
            </h2>
            <p className="mt-3 text-base text-[var(--sea-ink-soft)]">
              Sign in to view subject completion and correct answer totals.
            </p>
          </section>
        )}

        {userId && (
          <section className="grid gap-5 md:grid-cols-3">
            {subjectSummaries.map((subject) => (
              <article
                key={subject.id}
                className="island-shell rounded-3xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--sea-ink-soft)]">
                      Subject pack
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--sea-ink)]">
                      {subject.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-sm font-semibold text-[var(--lagoon-deep)]">
                    {subject.completionPercent}%
                  </span>
                </div>

                <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--palm)]"
                    style={{ width: `${Math.min(subject.completionPercent, 100)}%` }}
                  />
                </div>

                <dl className="mt-6 space-y-3 text-sm text-[var(--sea-ink-soft)]">
                  <div className="flex items-center justify-between gap-4">
                    <dt>Completion</dt>
                    <dd className="font-semibold text-[var(--sea-ink)]">
                      {subject.attemptedQuestions}/{subject.questionCount} published questions
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>Correct attempts</dt>
                    <dd className="font-semibold text-[var(--sea-ink)]">
                      {subject.correctAttempts}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
