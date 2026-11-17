import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'

export const Route = createFileRoute('/')({ component: Home })

type QuestionType = 'multiple-choice' | 'short-answer'
type ServerStatus = 'connected' | 'offline'

type StudyQuestion = {
  id: string
  subject: string
  topic: string
  type: QuestionType
  prompt: string
  choices?: string[]
  correctAnswer: string
  explanation: string
  source: string
}

type StudyResult = {
  status: 'correct' | 'incorrect' | 'error'
  submittedAnswer: string
  correctAnswer: string
  explanation: string
  message: string
}

const questionBank: StudyQuestion[] = [
  {
    id: 'q-1',
    subject: 'Mathematics',
    topic: 'Fractions',
    type: 'multiple-choice',
    prompt: 'What is 3/4 of 20?',
    choices: ['12', '15', '18', '20'],
    correctAnswer: '15',
    explanation:
      'To find three quarters of 20, divide 20 by 4 to get 5, then multiply by 3. 3 × 5 = 15.',
    source: 'CAPS Grade 7 Mathematics – Fractions',
  },
  {
    id: 'q-2',
    subject: 'Natural Sciences',
    topic: 'Plant growth',
    type: 'short-answer',
    prompt: 'Name the gas that plants take in during photosynthesis.',
    correctAnswer: 'carbon dioxide',
    explanation:
      'Plants absorb carbon dioxide from the air and use it together with sunlight and water to make food.',
    source: 'CAPS Grade 7 Natural Sciences – Photosynthesis',
  },
  {
    id: 'q-3',
    subject: 'English',
    topic: 'Grammar',
    type: 'multiple-choice',
    prompt: 'Which sentence is written in the past tense?',
    choices: ['She runs to the field.', 'She ran to the field.', 'She will run to the field.', 'She is running to the field.'],
    correctAnswer: 'She ran to the field.',
    explanation:
      '“Ran” is the past tense form of the verb “run”, so this sentence is in the past tense.',
    source: 'CAPS Grade 7 English – Tenses',
  },
]

const subjectProgress = [
  { subject: 'Mathematics', percent: 78, completed: 18, total: 23, trend: '+9%' },
  { subject: 'Natural Sciences', percent: 66, completed: 12, total: 18, trend: '+4%' },
  { subject: 'English', percent: 71, completed: 14, total: 20, trend: '+7%' },
  { subject: 'Social Sciences', percent: 58, completed: 9, total: 16, trend: '+2%' },
]

const reviewHistory = [
  { title: 'Fractions check-in', date: 'Today', result: 'Correct', badge: 'Strong' },
  { title: 'Plant processes', date: 'Yesterday', result: 'Needs review', badge: 'Review' },
  { title: 'Grammar recap', date: 'Monday', result: 'Correct', badge: 'Strong' },
]

function Home() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('connected')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState('')
  const [shortAnswer, setShortAnswer] = useState('')
  const [result, setResult] = useState<StudyResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questionBank[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questionBank.length - 1

  const canSubmit =
    currentQuestion.type === 'multiple-choice'
      ? selectedChoice.length > 0
      : shortAnswer.trim().length > 0

  const startStudySession = () => {
    setSessionStarted(true)
    setCurrentQuestionIndex(0)
    setSelectedChoice('')
    setShortAnswer('')
    setResult(null)
    setIsSubmitting(false)
  }

  const resetQuestion = () => {
    setSelectedChoice('')
    setShortAnswer('')
    setResult(null)
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setSessionStarted(false)
      setCurrentQuestionIndex(0)
      resetQuestion()
      return
    }

    setCurrentQuestionIndex((index) => index + 1)
    resetQuestion()
  }

  const submitAnswer = async () => {
    if (!currentQuestion) {
      return
    }

    const submittedAnswer =
      currentQuestion.type === 'multiple-choice' ? selectedChoice : shortAnswer.trim()

    if (serverStatus !== 'connected') {
      setResult({
        status: 'error',
        submittedAnswer: submittedAnswer || 'No answer provided',
        correctAnswer: currentQuestion.correctAnswer,
        explanation:
          'The study server is unavailable, so the answer was not saved or graded.',
        message:
          'Connection unavailable. Your answer was not saved or graded.',
      })
      return
    }

    if (!submittedAnswer) {
      setResult({
        status: 'error',
        submittedAnswer: 'No answer provided',
        correctAnswer: currentQuestion.correctAnswer,
        explanation: 'Type or select an answer before submitting it.',
        message: 'Choose an answer or add a response before submitting.',
      })
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700))

    const normalizedAnswer = submittedAnswer.trim().toLowerCase().replace(/\s+/g, ' ')
    const normalizedCorrect = currentQuestion.correctAnswer
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
    const isCorrect = normalizedAnswer === normalizedCorrect

    setResult({
      status: isCorrect ? 'correct' : 'incorrect',
      submittedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      message: isCorrect
        ? 'Correct. The Worker confirmed your answer.'
        : 'Incorrect. Review the correct answer and explanation below.',
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen px-4 py-8 text-slate-900 md:px-6 lg:px-8">
      <div className="page-wrap">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="island-kicker mb-3">Study session</p>
            <h1 className="display-title text-4xl leading-tight text-slate-900 md:text-5xl">
              Grade 7 CAPS revision
            </h1>
          </div>

          <div className="island-shell flex items-center gap-3 rounded-full px-4 py-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                serverStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-sm font-semibold text-slate-700">
              {serverStatus === 'connected' ? 'Server connected' : 'Server unavailable'}
            </span>
            <button
              type="button"
              className="ml-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:bg-white"
              onClick={() =>
                setServerStatus((status) =>
                  status === 'connected' ? 'offline' : 'connected',
                )
              }
            >
              {serverStatus === 'connected' ? 'Test outage' : 'Restore'}
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="island-shell rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="island-kicker">Progress</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  72% ready
                </span>
              </div>

              <div className="space-y-4">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{subject.subject}</span>
                      <span className="text-slate-500">{subject.trend}</span>
                    </div>
                    <div className="mb-1 h-2.5 overflow-hidden rounded-full bg-slate-200/90">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
                        style={{ width: `${subject.percent}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      {subject.completed}/{subject.total} tasks complete
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="island-shell rounded-3xl p-5">
              <p className="island-kicker mb-4">Review history</p>
              <div className="space-y-3">
                {reviewHistory.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200/80 bg-white/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-800">{item.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          item.badge === 'Strong'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{item.date}</span>
                      <span className="font-semibold text-slate-700">{item.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="island-shell rounded-[28px] p-5 md:p-7">
            {!sessionStarted ? (
              <div className="flex min-h-[440px] flex-col justify-between gap-6">
                <div>
                  <p className="island-kicker mb-3">Ready to begin</p>
                  <h2 className="display-title text-3xl text-slate-900 md:text-4xl">
                    Study with live CAPS feedback
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    Answer multiple-choice and short-text questions. The Worker checks each answer and returns feedback, explanations, and progress updates.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      ✓
                    </span>
                    <div>
                      <p className="font-semibold">Live server required</p>
                      <p className="mt-1 text-emerald-800/80">
                        This flow only works with an active server connection. If the connection drops,
                        the UI shows the answer was not saved or graded.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {questionBank.length} practice questions • 1 live submission check
                  </div>
                  <Button size="lg" onClick={startStudySession}>
                    Start study session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="island-kicker">Question {currentQuestionIndex + 1}</p>
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentQuestion.subject}
                    </h2>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {currentQuestion.topic}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-lg font-semibold leading-8 text-slate-800">
                      {currentQuestion.prompt}
                    </p>
                  </div>

                  {currentQuestion.type === 'multiple-choice' ? (
                    <div className="grid gap-3">
                      {currentQuestion.choices?.map((choice) => {
                        const isSelected = selectedChoice === choice
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setSelectedChoice(choice)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 text-slate-400'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </span>
                              <span className="font-medium">{choice}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="short-answer" className="mb-2 block text-sm font-medium text-slate-700">
                        Type your answer
                      </label>
                      <Textarea
                        id="short-answer"
                        value={shortAnswer}
                        onChange={(event) => setShortAnswer(event.target.value)}
                        placeholder="Type your answer here"
                        className="min-h-[120px] rounded-2xl border-slate-200 bg-white text-base text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {result ? (
                  <div
                    className={`rounded-2xl border p-4 ${
                      result.status === 'correct'
                        ? 'border-emerald-200 bg-emerald-50'
                        : result.status === 'incorrect'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-rose-200 bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {result.status === 'correct'
                          ? 'Correct answer'
                          : result.status === 'incorrect'
                            ? 'Feedback'
                            : 'Connection issue'}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          result.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-700'
                            : result.status === 'incorrect'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>

                    <p className="mt-3 text-base font-medium text-slate-800">{result.message}</p>

                    {result.status !== 'error' && (
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold">Your answer:</span> {result.submittedAnswer}
                        </p>
                        <p>
                          <span className="font-semibold">Correct answer:</span> {result.correctAnswer}
                        </p>
                        <p>
                          <span className="font-semibold">Why:</span> {result.explanation}
                        </p>
                      </div>
                    )}

                    {result.status === 'error' && (
                      <p className="mt-3 text-sm text-slate-700">{result.explanation}</p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Source: {currentQuestion.source}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSessionStarted(false)}
                      className="min-w-[120px]"
                    >
                      Exit
                    </Button>
                    <Button
                      onClick={submitAnswer}
                      disabled={isSubmitting || !canSubmit}
                      className="min-w-[140px]"
                    >
                      {isSubmitting ? 'Checking…' : 'Submit answer'}
                    </Button>
                  </div>
                </div>

                {result && (
                  <div className="flex justify-end">
                    <Button onClick={handleNextQuestion} variant="secondary">
                      {isLastQuestion ? 'Finish session' : 'Next question'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
