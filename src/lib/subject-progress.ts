export type SubjectPack = {
  id: string
  name: string
  questionCount: number
  publishedQuestionIds: string[]
}

export type AnswerAttempt = {
  id: string
  subjectId: string
  questionId: string
  userId: string
  correct: boolean
}

export function getSubjectProgress(
  subject: SubjectPack,
  attempts: AnswerAttempt[],
  userId: string,
) {
  const relevantAttempts = attempts.filter(
    (attempt) =>
      attempt.userId === userId &&
      attempt.subjectId === subject.id &&
      subject.publishedQuestionIds.includes(attempt.questionId),
  )

  const uniqueAttempted = new Set(
    relevantAttempts.map((attempt) => attempt.questionId),
  ).size

  const completionPercentage =
    subject.questionCount > 0
      ? (uniqueAttempted / subject.questionCount) * 100
      : 0

  const correctAttempts = relevantAttempts.filter((attempt) => attempt.correct).length

  return {
    attemptedQuestions: uniqueAttempted,
    completionPercentage,
    correctAttempts,
    questionCount: subject.questionCount,
  }
}
