import { z } from "zod";

const MultipleChoiceKeySchema = z.object({
	type: z.literal("multiple_choice"),
	correctAnswer: z.string().trim().min(1),
});

const ShortTextKeySchema = z.object({
	type: z.literal("short_text"),
	acceptedAnswers: z.array(z.string().trim().min(1)).default([]),
	requiredTerms: z.array(z.string().trim().min(1)).default([]),
});

const AnswerKeySchema = z.discriminatedUnion("type", [
	MultipleChoiceKeySchema,
	ShortTextKeySchema,
]);

export const AnswerSubmissionSchema = z.object({
	questionId: z.string().trim().min(1).max(128),
	answer: z.string().trim().min(1).max(2000),
});

export type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

export interface StoredQuestion {
	id: string;
	type: "multiple_choice" | "short_text";
	answer_key: string;
	correct_answer: string;
	explanation: string;
}

export interface AnswerAttempt {
	studentId: string;
	questionId: string;
	answer: string;
	correct: boolean;
}

export interface SubjectProgress {
	subject: string;
	attempts: number;
	correct: number;
	lastAttemptAt: string | null;
	questionsAttempted: number;
	questionCount: number;
	completionPercentage: number;
}

export interface AnswerHistoryEntry {
	id: number;
	questionId: string;
	subject: string;
	prompt: string;
	answer: string;
	correct: boolean;
	correctAnswer: string | null;
	explanation: string | null;
	createdAt: string;
}

export interface AnswerRepository {
	findQuestion(questionId: string): Promise<StoredQuestion | null>;
	saveAttempt(attempt: AnswerAttempt): Promise<number>;
	getProgress(studentId: string): Promise<SubjectProgress[]>;
	getHistory(studentId: string, limit: number): Promise<AnswerHistoryEntry[]>;
}

export class QuestionNotFoundError extends Error {
	constructor(questionId: string) {
		super(`Question not found: ${questionId}`);
		this.name = "QuestionNotFoundError";
	}
}

function normalizeAnswer(value: string) {
	return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function gradeAnswer(question: StoredQuestion, answer: string) {
	const parsedKey = AnswerKeySchema.parse(JSON.parse(question.answer_key));

	if (question.type !== parsedKey.type) {
		throw new Error(`Answer key type does not match question ${question.id}`);
	}

	if (parsedKey.type === "multiple_choice") {
		return normalizeAnswer(answer) === normalizeAnswer(parsedKey.correctAnswer);
	}

	const normalizedAnswer = normalizeAnswer(answer);
	const hasAcceptedAnswer = parsedKey.acceptedAnswers.some(
		(acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
	);
	const satisfiesRubric =
		parsedKey.requiredTerms.length > 0 &&
		parsedKey.requiredTerms.every((term) =>
			normalizedAnswer.includes(normalizeAnswer(term)),
		);

	if (
		parsedKey.acceptedAnswers.length === 0 &&
		parsedKey.requiredTerms.length === 0
	) {
		throw new Error(
			`Short-text answer key is empty for question ${question.id}`,
		);
	}

	return hasAcceptedAnswer || satisfiesRubric;
}

export async function submitAnswer(
	repository: AnswerRepository,
	studentId: string,
	submission: AnswerSubmission,
) {
	const question = await repository.findQuestion(submission.questionId);
	if (!question) throw new QuestionNotFoundError(submission.questionId);

	const correct = gradeAnswer(question, submission.answer);
	const attemptId = await repository.saveAttempt({
		studentId,
		questionId: question.id,
		answer: submission.answer,
		correct,
	});

	return {
		attemptId,
		questionId: question.id,
		correct,
		...(!correct && {
			correctAnswer: question.correct_answer,
			explanation: question.explanation,
		}),
	};
}

export async function getStudentAnswerHistory(
	repository: AnswerRepository,
	studentId: string,
) {
	const [progress, history] = await Promise.all([
		repository.getProgress(studentId),
		repository.getHistory(studentId, 100),
	]);
	return { progress, history };
}
