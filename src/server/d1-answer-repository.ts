import type {
	AnswerAttempt,
	AnswerHistoryEntry,
	AnswerRepository,
	StoredQuestion,
	SubjectProgress,
} from "./answer-checking";

export function createD1AnswerRepository(db: D1Database): AnswerRepository {
	return {
		async findQuestion(questionId) {
			return db
				.prepare(
					`SELECT id, type, answer_key, correct_answer, explanation
          FROM questions
          WHERE id = ?`,
				)
				.bind(questionId)
				.first<StoredQuestion>();
		},

		async saveAttempt(attempt: AnswerAttempt) {
			const result = await db
				.prepare(
					`INSERT INTO answer_attempts
            (student_id, question_id, submitted_answer, is_correct)
          VALUES (?, ?, ?, ?)
          RETURNING id`,
				)
				.bind(
					attempt.studentId,
					attempt.questionId,
					attempt.answer,
					Number(attempt.correct),
				)
				.first<{ id: number }>();

			if (!result) throw new Error("Failed to save answer attempt");
			return result.id;
		},

		async getProgress(studentId) {
			const result = await db
				.prepare(
					`SELECT
            q.subject,
            COUNT(*) AS attempts,
            SUM(a.is_correct) AS correct,
            MAX(a.created_at) AS last_attempt_at
          FROM answer_attempts a
          JOIN questions q ON q.id = a.question_id
          WHERE a.student_id = ?
          GROUP BY q.subject
          ORDER BY q.subject`,
				)
				.bind(studentId)
				.all<{
					subject: string;
					attempts: number;
					correct: number;
					last_attempt_at: string;
				}>();

			return result.results.map(
				(row): SubjectProgress => ({
					subject: row.subject,
					attempts: row.attempts,
					correct: row.correct,
					lastAttemptAt: row.last_attempt_at,
				}),
			);
		},

		async getHistory(studentId, limit) {
			const result = await db
				.prepare(
					`SELECT
            q.id AS question_id,
            q.subject,
            q.prompt,
            a.submitted_answer,
            a.is_correct,
            CASE WHEN a.is_correct = 0 THEN q.correct_answer END AS correct_answer,
            CASE WHEN a.is_correct = 0 THEN q.explanation END AS explanation,
            a.created_at
          FROM answer_attempts a
          JOIN questions q ON q.id = a.question_id
          WHERE a.student_id = ?
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT ?`,
				)
				.bind(studentId, limit)
				.all<{
					question_id: string;
					subject: string;
					prompt: string;
					submitted_answer: string;
					is_correct: number;
					correct_answer: string | null;
					explanation: string | null;
					created_at: string;
				}>();

			return result.results.map(
				(row): AnswerHistoryEntry => ({
					questionId: row.question_id,
					subject: row.subject,
					prompt: row.prompt,
					answer: row.submitted_answer,
					correct: row.is_correct === 1,
					correctAnswer: row.correct_answer,
					explanation: row.explanation,
					createdAt: row.created_at,
				}),
			);
		},
	};
}
