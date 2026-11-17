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
          WHERE id = ?
            AND status = 'accepted'
            AND source_ref IS NOT NULL AND TRIM(source_ref) != ''
            AND source_title IS NOT NULL AND TRIM(source_title) != ''
            AND generated_from IS NOT NULL AND TRIM(generated_from) != ''`,
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
            COUNT(a.id) AS attempts,
            COALESCE(SUM(a.is_correct), 0) AS correct,
            MAX(a.created_at) AS last_attempt_at,
            COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN q.id END) AS questions_attempted,
            COUNT(DISTINCT q.id) AS question_count
          FROM questions q
          LEFT JOIN answer_attempts a
            ON a.question_id = q.id
            AND a.student_id = ?
          WHERE q.status = 'accepted'
            AND q.source_ref IS NOT NULL AND TRIM(q.source_ref) != ''
            AND q.source_title IS NOT NULL AND TRIM(q.source_title) != ''
            AND q.generated_from IS NOT NULL AND TRIM(q.generated_from) != ''
          GROUP BY q.subject
          ORDER BY q.subject`,
				)
				.bind(studentId)
				.all<{
					subject: string;
					attempts: number;
					correct: number;
					last_attempt_at: string | null;
					questions_attempted: number;
					question_count: number;
				}>();

			return result.results.map((row): SubjectProgress => {
				const questionCount = row.question_count;
				const questionsAttempted = row.questions_attempted;
				return {
					subject: row.subject,
					attempts: row.attempts,
					correct: row.correct,
					lastAttemptAt: row.last_attempt_at,
					questionsAttempted,
					questionCount,
					completionPercentage:
						questionCount === 0
							? 0
							: Math.round((questionsAttempted / questionCount) * 1000) / 10,
				};
			});
		},

		async getHistory(studentId, limit) {
			const result = await db
				.prepare(
					`SELECT
            a.id AS attempt_id,
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
					attempt_id: number;
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
					id: row.attempt_id,
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
