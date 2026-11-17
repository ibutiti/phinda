import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { type FormEvent, useEffect, useState } from 'react'

import {
  type StudyAttempt,
  type StudyQuestion,
  type StudyQuestionType,
  generateApprovedQuestion,
  getStudyHistory,
  getStudyStats,
  gradeStudyAnswer,
  recordStudyAttempt,
} from '../lib/caps-study'

const generateStudyQuestion = createServerFn({ method: 'POST' }).handler(
  async (input: { questionType?: StudyQuestionType } = {}) => {
    return generateApprovedQuestion(input.questionType)
  },
)

const checkStudyAnswer = createServerFn({ method: 'POST' }).handler(
  async (input: { question: StudyQuestion; submittedAnswer: string }) => {
    const result = gradeStudyAnswer(input.question, input.submittedAnswer)
    const attempt = recordStudyAttempt(input.question, input.submittedAnswer, result)

    return {
      ...result,
      attempt,
    }
  },
)

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [question, setQuestion] = useState<StudyQuestion | null>(null)
  const [selectedChoice, setSelectedChoice] = useState('')
  const [studentAnswer, setStudentAnswer] = useState('')
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean
    submittedAnswer: string
    correctAnswer: string
    explanation: string
    sourceReference: string
    attempt: StudyAttempt
  } | null>(null)
  const [history, setHistory] = useState<StudyAttempt[]>(() => getStudyHistory())
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    void loadQuestion()
  }, [])

  async function loadQuestion() {
    setIsLoading(true)
    setFeedback(null)
    setStudentAnswer('')
    setSelectedChoice('')

    try {
      const questionType: StudyQuestionType =
        Math.random() > 0.5 ? 'multiple-choice' : 'short-text'
      const nextQuestion = await generateStudyQuestion({ questionType })
      setQuestion(nextQuestion)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!question) return

    const answer =
      question.type === 'multiple-choice' ? selectedChoice || studentAnswer : studentAnswer

    if (!answer.trim()) {
      setFeedback(null)
      return
    }

    const result = await checkStudyAnswer({
      question,
      submittedAnswer: answer,
    })

    setFeedback(result)
    setHistory((previous) => [result.attempt, ...previous].slice(0, 10))
    setStudentAnswer(answer)
  }

  const stats = getStudyStats()
  const currentAnswer =
    question?.type === 'multiple-choice' ? selectedChoice || studentAnswer : studentAnswer

  return (
    <main className="min-h-screen bg-transparent p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-white/75 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Grade 7 CAPS study
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              AI-validated maths practice
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {isConnected ? 'Server connected' : 'Server offline'}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Approved source material
                </p>
                <p className="mt-1 text-sm text-emerald-700">DBE CAPS maths bank</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void loadQuestion()
                }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isLoading ? 'Loading...' : 'Next question'}
              </button>
            </div>

            {!question ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                Loading approved question...
              </div>
            ) : (
              <form onSubmit={submitAnswer} className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {question.topic}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold leading-relaxed text-slate-900">
                    {question.prompt}
                  </h2>
                </div>

                {question.type === 'multiple-choice' && question.choices ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {question.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => {
                          setSelectedChoice(choice)
                          setStudentAnswer(choice)
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left text-base font-medium transition ${
                          currentAnswer === choice
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Your answer
                    </span>
                    <input
                      value={studentAnswer}
                      onChange={(event) => {
                        setStudentAnswer(event.target.value)
                      }}
                      placeholder="Type your answer here"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500"
                    />
                  </label>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Check answer
                  </button>

                  <span className="text-sm text-slate-500">
                    Source: {question.sourceReference}
                  </span>
                </div>

                {feedback && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      feedback.isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.18em]">
                      {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                    </p>
                    <p className="mt-2 text-base font-medium">
                      {feedback.isCorrect
                        ? 'Well done.'
                        : `Correct answer: ${feedback.correctAnswer}`}
                    </p>
                    <p className="mt-2 text-sm leading-6">{feedback.explanation}</p>
                  </div>
                )}
              </form>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Session status
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Connection</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {isConnected ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Attempts</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Correct</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.correct}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Accuracy</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.percentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Review history
              </p>

              <div className="mt-4 space-y-3">
                {history.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                    No attempts recorded yet.
                  </p>
                ) : (
                  history.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {attempt.isCorrect ? 'Correct' : 'Needs review'}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          {attempt.isCorrect ? '✓' : '✕'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {attempt.questionPrompt}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
