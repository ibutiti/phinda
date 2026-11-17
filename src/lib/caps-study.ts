export type StudyQuestionType = 'multiple-choice' | 'short-text'

export type StudyQuestion = {
  id: string
  subject: 'Mathematics'
  topic: string
  prompt: string
  type: StudyQuestionType
  answer: string
  explanation: string
  source: string
  sourceReference: string
  choices?: string[]
}

export type StudyAttempt = {
  id: string
  questionId: string
  questionPrompt: string
  submittedAnswer: string
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  sourceReference: string
  timestamp: string
}

export type StudyResult = {
  isCorrect: boolean
  submittedAnswer: string
  correctAnswer: string
  explanation: string
  sourceReference: string
  attempt: StudyAttempt
}

const approvedCapsSources = [
  'CAPS Grade 7 Mathematics, DBE, Term 1: Numbers and Operations',
  'CAPS Grade 7 Mathematics, DBE, Term 2: Patterns and Algebra',
  'CAPS Grade 7 Mathematics, DBE, Term 3: Space and Shape',
  'CAPS Grade 7 Mathematics, DBE, Term 4: Data Handling',
]

const questionBank: StudyQuestion[] = [
  {
    id: 'q-1',
    subject: 'Mathematics',
    topic: 'Numbers and operations',
    prompt: 'What is 24 ÷ 6?',
    type: 'multiple-choice',
    answer: '4',
    explanation:
      'Division means splitting into equal groups. 24 shared equally into 6 groups gives 4 in each group.',
    source: approvedCapsSources[0],
    sourceReference: 'DBE Mathematics CAPS, Grade 7, Term 1, Whole numbers and operations',
    choices: ['2', '3', '4', '6'],
  },
  {
    id: 'q-2',
    subject: 'Mathematics',
    topic: 'Perimeter',
    prompt: 'A rectangle has length 8 cm and width 5 cm. What is the perimeter?',
    type: 'multiple-choice',
    answer: '26 cm',
    explanation:
      'Perimeter is the distance around the rectangle: 8 + 5 + 8 + 5 = 26 cm.',
    source: approvedCapsSources[2],
    sourceReference: 'DBE Mathematics CAPS, Grade 7, Term 3, Measurement and space',
    choices: ['18 cm', '24 cm', '26 cm', '40 cm'],
  },
  {
    id: 'q-3',
    subject: 'Mathematics',
    topic: 'Fractions and decimals',
    prompt: 'Write 3/5 as a decimal.',
    type: 'short-text',
    answer: '0.6',
    explanation:
      '3 ÷ 5 = 0.6, so 3/5 written in decimal form is 0.6.',
    source: approvedCapsSources[0],
    sourceReference: 'DBE Mathematics CAPS, Grade 7, Term 1, Fractions and decimals',
  },
  {
    id: 'q-4',
    subject: 'Mathematics',
    topic: 'Patterns',
    prompt: 'What is the next number in the pattern: 3, 6, 9, 12, ?',
    type: 'multiple-choice',
    answer: '15',
    explanation:
      'This pattern adds 3 each time, so after 12 comes 15.',
    source: approvedCapsSources[1],
    sourceReference: 'DBE Mathematics CAPS, Grade 7, Term 2, Numeric patterns',
    choices: ['13', '14', '15', '18'],
  },
  {
    id: 'q-5',
    subject: 'Mathematics',
    topic: 'Data handling',
    prompt: 'The marks for a test are 10, 12, 12, 15, 18. What is the mode?',
    type: 'short-text',
    answer: '12',
    explanation:
      'The mode is the value that appears most often. 12 appears twice, more than any other score.',
    source: approvedCapsSources[3],
    sourceReference: 'DBE Mathematics CAPS, Grade 7, Term 4, Data handling and probability',
  },
]

const history: StudyAttempt[] = []

export function isApprovedCapsMaterial(source: string) {
  return approvedCapsSources.some((approved) =>
    source.toLowerCase().includes(approved.toLowerCase().split(',')[0].replace('caps ', '').trim()),
  )
}

function normaliseAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%/ .-]/g, '')
    .replace(/\s+/g, ' ')
}

export function generateApprovedQuestion(questionType?: StudyQuestionType) {
  const filtered =
    questionType === undefined
      ? questionBank
      : questionBank.filter((question) => question.type === questionType)

  const selected = filtered[Math.floor(Math.random() * filtered.length)]

  if (!selected) {
    throw new Error('No approved CAPS question matches the requested type.')
  }

  if (!isApprovedCapsMaterial(selected.source)) {
    throw new Error('Question rejected: unsupported or uncertain source material.')
  }

  return structuredClone(selected)
}

export function gradeStudyAnswer(question: StudyQuestion, submittedAnswer: string): Omit<StudyResult, 'attempt'> {
  const candidate = normaliseAnswer(submittedAnswer)
  const correct = normaliseAnswer(question.answer)

  const isCorrect =
    question.type === 'multiple-choice'
      ? candidate === correct
      : candidate === correct || candidate.includes(correct.replace(/\s+/g, ' '))

  return {
    isCorrect,
    submittedAnswer: submittedAnswer.trim(),
    correctAnswer: question.answer,
    explanation: question.explanation,
    sourceReference: question.sourceReference,
  }
}

export function recordStudyAttempt(
  question: StudyQuestion,
  submittedAnswer: string,
  result: Omit<StudyResult, 'attempt'>,
) {
  const attempt: StudyAttempt = {
    id: `attempt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    questionId: question.id,
    questionPrompt: question.prompt,
    submittedAnswer: submittedAnswer.trim(),
    isCorrect: result.isCorrect,
    correctAnswer: result.correctAnswer,
    explanation: result.explanation,
    sourceReference: result.sourceReference,
    timestamp: new Date().toISOString(),
  }

  history.unshift(attempt)

  return attempt
}

export function getStudyHistory() {
  return [...history]
}

export function getStudyStats() {
  const total = history.length
  const correct = history.filter((attempt) => attempt.isCorrect).length

  return {
    total,
    correct,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  }
}
