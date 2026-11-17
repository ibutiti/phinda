export type QuestionType = 'multiple-choice' | 'short-text'

export type ApprovedSource = {
  id: string
  title: string
  subject: 'Mathematics'
  grade: 7
  curriculum: 'CAPS'
  url?: string
  sourceText?: string
}

export type MultipleChoiceQuestion = {
  id: string
  prompt: string
  type: 'multiple-choice'
  sourceRef: string
  options: string[]
  answerKey: string
  explanation: string
  rubric?: string[]
}

export type ShortTextQuestion = {
  id: string
  prompt: string
  type: 'short-text'
  sourceRef: string
  answerKey?: string
  explanation: string
  rubric?: string[]
}

export type AcceptedQuestion = {
  id: string
  status: 'accepted'
  prompt: string
  type: QuestionType
  sourceRef: string
  sourceTitle?: string
  answerKey?: string
  rubric?: string[]
  explanation: string
  options?: string[]
  generatedFrom?: string
}

export type RejectedQuestion = {
  id: string
  status: 'rejected'
  prompt: string
  type: QuestionType
  sourceRef?: string
  reason: string
}

export type StudentPublishedQuestion = {
  id: string
  prompt: string
  type: QuestionType
  sourceRef: string
  options?: string[]
}

export type QuestionBankDatabase = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<{ success: boolean; meta?: Record<string, unknown> }>
      all: () => Promise<{ results?: Record<string, unknown>[] }>
    }
  }
}

export type AIQuestionRunner = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

export const DEFAULT_APPROVED_CAPS_SOURCES: ApprovedSource[] = [
  {
    id: 'caps-mathematics-grade-7-2025',
    title: 'CAPS Mathematics Grade 7 official content reference',
    subject: 'Mathematics',
    grade: 7,
    curriculum: 'CAPS',
    url: 'https://example.invalid/caps/mathematics-grade-7',
    sourceText: 'Grade 7 CAPS Mathematics — number operations, patterns, geometry, data handling, and problem solving.',
  },
  {
    id: 'caps-mathematics-grade-7-patterns-and-algebra',
    title: 'CAPS Grade 7 Patterns and Algebra',
    subject: 'Mathematics',
    grade: 7,
    curriculum: 'CAPS',
    url: 'https://example.invalid/caps/mathematics-grade-7/patterns-and-algebra',
    sourceText: 'Patterns and algebra skills for Grade 7 CAPS Mathematics, including sequences, expressions, and rules.',
  },
]

export function assertApprovedSources(
  sources: ApprovedSource[] | null | undefined,
): ApprovedSource[] {
  const approved = sources && sources.length > 0 ? sources : DEFAULT_APPROVED_CAPS_SOURCES

  if (!approved.length) {
    throw new Error('Approved CAPS source set is unavailable. The project requires explicit Grade 7 CAPS source approval before publishing questions.')
  }

  return approved
}

export function isApprovedSourceReference(
  sourceRef: string | null | undefined,
  approvedSources: ApprovedSource[] | null | undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): boolean {
  if (!sourceRef || !sourceRef.trim()) {
    return false
  }

  const approved = assertApprovedSources(approvedSources)
  const normalized = sourceRef.trim()

  return approved.some((source) => {
    const sourceValues = [source.id, source.title, source.url, source.sourceText].filter(Boolean) as string[]
    return sourceValues.some((value) => value === normalized || value.startsWith(normalized))
  })
}

export function normalizeQuestionType(type: string): QuestionType {
  const normalized = type.trim().toLowerCase().replace(/[_-]+/g, ' ')

  if (
    normalized === 'multiple choice' ||
    normalized === 'multiple-choice' ||
    normalized === 'mcq' ||
    normalized === 'multiple choice question'
  ) {
    return 'multiple-choice'
  }

  if (
    normalized === 'short text' ||
    normalized === 'short-text' ||
    normalized === 'constructed response' ||
    normalized === 'free response' ||
    normalized === 'short answer'
  ) {
    return 'short-text'
  }

  throw new Error(`Unsupported question type: ${type}`)
}

export function toStudentPublishedQuestion(question: AcceptedQuestion): StudentPublishedQuestion {
  return {
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    sourceRef: question.sourceRef,
    options: question.options,
  }
}

export function validateGeneratedQuestion(
  input: {
    id?: string
    type?: string
    sourceRef?: string
    sourceTitle?: string
    prompt?: string
    explanation?: string
    options?: string[]
    answerKey?: string
    rubric?: string[]
    generatedFrom?: string
  },
  approvedSources: ApprovedSource[] | null | undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): AcceptedQuestion | RejectedQuestion {
  const questionId = input.id ?? crypto?.randomUUID?.() ?? `question-${Date.now()}`

  if (!input.prompt || !input.prompt.trim()) {
    return {
      id: questionId,
      status: 'rejected',
      prompt: input.prompt ?? '',
      type: normalizeQuestionType(input.type ?? 'multiple-choice'),
      sourceRef: input.sourceRef,
      reason: 'Question prompt is required.',
    }
  }

  if (!input.sourceRef || !isApprovedSourceReference(input.sourceRef, approvedSources)) {
    return {
      id: questionId,
      status: 'rejected',
      prompt: input.prompt,
      type: normalizeQuestionType(input.type ?? 'multiple-choice'),
      sourceRef: input.sourceRef,
      reason: 'Question source is not an approved Grade 7 CAPS reference.',
    }
  }

  const type = normalizeQuestionType(input.type ?? 'multiple-choice')

  if (!input.explanation || !input.explanation.trim()) {
    return {
      id: questionId,
      status: 'rejected',
      prompt: input.prompt,
      type,
      sourceRef: input.sourceRef,
      reason: 'Questions must include an explanation for teacher validation.',
    }
  }

  if (type === 'multiple-choice') {
    if (!Array.isArray(input.options) || input.options.length < 2) {
      return {
        id: questionId,
        status: 'rejected',
        prompt: input.prompt,
        type,
        sourceRef: input.sourceRef,
        reason: 'Multiple-choice questions require at least two options.',
      }
    }

    if (!input.answerKey || !input.answerKey.trim()) {
      return {
        id: questionId,
        status: 'rejected',
        prompt: input.prompt,
        type,
        sourceRef: input.sourceRef,
        reason: 'Multiple-choice questions require an answer key.',
      }
    }

    return {
      id: questionId,
      status: 'accepted',
      prompt: input.prompt,
      type,
      sourceRef: input.sourceRef,
      sourceTitle: input.sourceTitle,
      answerKey: input.answerKey.trim(),
      explanation: input.explanation.trim(),
      options: input.options,
      rubric: input.rubric,
      generatedFrom: input.generatedFrom,
    }
  }

  if (!input.answerKey && (!input.rubric || input.rubric.length === 0)) {
    return {
      id: questionId,
      status: 'rejected',
      prompt: input.prompt,
      type,
      sourceRef: input.sourceRef,
      reason: 'Short-text questions require an answer key or a rubric.',
    }
  }

  return {
    id: questionId,
    status: 'accepted',
    prompt: input.prompt,
    type,
    sourceRef: input.sourceRef,
    sourceTitle: input.sourceTitle,
    answerKey: input.answerKey?.trim(),
    explanation: input.explanation.trim(),
    rubric: input.rubric,
    generatedFrom: input.generatedFrom,
  }
}

export async function persistAcceptedQuestion(
  db: QuestionBankDatabase,
  question: AcceptedQuestion,
): Promise<AcceptedQuestion> {
  if (question.status !== 'accepted') {
    throw new Error('Only accepted questions may be stored in the D1 question bank.')
  }

  const sql = `
    INSERT INTO question_bank (
      id,
      prompt,
      type,
      source_ref,
      source_title,
      answer_key,
      explanation,
      rubric,
      options,
      generated_from,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const statement = db.prepare(sql)
  await statement.bind(
    question.id,
    question.prompt,
    question.type,
    question.sourceRef,
    question.sourceTitle ?? null,
    question.answerKey ?? null,
    question.explanation,
    question.rubric ? JSON.stringify(question.rubric) : null,
    question.options ? JSON.stringify(question.options) : null,
    question.generatedFrom ?? null,
    question.status,
  ).run()

  return question
}

export async function getPublishedStudentQuestions(
  db: QuestionBankDatabase,
): Promise<StudentPublishedQuestion[]> {
  const statement = db.prepare(`SELECT * FROM question_bank WHERE status = ? ORDER BY id`)
  const result = await statement.bind('accepted').all()

  const rows = Array.isArray(result.results) ? result.results : []

  return rows.map((row) => {
    const stored = row as Record<string, unknown>

    return {
      id: String(stored.id ?? ''),
      prompt: String(stored.prompt ?? ''),
      type: normalizeQuestionType(String(stored.type ?? 'multiple-choice')),
      sourceRef: String(stored.source_ref ?? ''),
      options: typeof stored.options === 'string' ? JSON.parse(stored.options) : undefined,
    }
  })
}

export type QuestionGeneratorInput = {
  id?: string
  prompt: string
  type: string
  sourceRef: string
  sourceTitle?: string
  options?: string[]
  answerKey?: string
  explanation?: string
  rubric?: string[]
  generatedFrom?: string
  approvedSources?: ApprovedSource[]
}

export async function generateQuestionRecord(
  input: QuestionGeneratorInput,
  ai?: AIQuestionRunner,
  approvedSources: ApprovedSource[] | null | undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): Promise<AcceptedQuestion | RejectedQuestion> {
  const sourceSet = approvedSources ?? DEFAULT_APPROVED_CAPS_SOURCES

  if (!input.prompt || !input.prompt.trim()) {
    throw new Error('Question generation requires a prompt.')
  }

  if (!input.sourceRef || !isApprovedSourceReference(input.sourceRef, sourceSet)) {
    return {
      id: input.id ?? `rejected-${Date.now()}`,
      status: 'rejected',
      prompt: input.prompt,
      type: normalizeQuestionType(input.type ?? 'multiple-choice'),
      sourceRef: input.sourceRef,
      reason: 'Unsupported or unapproved CAPS source reference.',
    }
  }

  if (ai) {
    const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'Verify all generated question content against the approved Grade 7 CAPS source set before returning it.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            type: input.type,
            prompt: input.prompt,
            sourceRef: input.sourceRef,
            approvedSources: sourceSet.map((source) => source.id),
          }),
        },
      ],
    })

    const payload = typeof result === 'string' ? JSON.parse(result) : result

    return validateGeneratedQuestion(
      {
        ...input,
        ...payload,
        sourceRef: input.sourceRef,
      },
      sourceSet,
    )
  }

  return validateGeneratedQuestion(input, sourceSet)
}

export async function buildQuestionBankWorkflow(
  params: {
    approvedSources?: ApprovedSource[]
    db?: QuestionBankDatabase
    ai?: AIQuestionRunner
  } = {},
): Promise<{
  approve: (question: QuestionGeneratorInput) => Promise<AcceptedQuestion | RejectedQuestion>
  persist: (question: AcceptedQuestion) => Promise<AcceptedQuestion>
  studentView: (question: AcceptedQuestion) => StudentPublishedQuestion
}> {
  const approved = assertApprovedSources(params.approvedSources)

  return {
    approve: async (question) => generateQuestionRecord(question, params.ai, approved),
    persist: async (question) => {
      if (!params.db) {
        throw new Error('A D1 database binding is required to persist questions.')
      }
      return persistAcceptedQuestion(params.db, question)
    },
    studentView: (question) => toStudentPublishedQuestion(question),
  }
}

export const createQuestionBank = buildQuestionBankWorkflow
export const approveQuestion = generateQuestionRecord
export const persistQuestion = persistAcceptedQuestion
export const publishQuestionForStudent = toStudentPublishedQuestion
export const validateQuestion = validateGeneratedQuestion
export const ensureApprovedSources = assertApprovedSources
export const generateQuestion = generateQuestionRecord
export const studentSafeQuestion = toStudentPublishedQuestion
