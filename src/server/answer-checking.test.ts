import assert from "node:assert/strict";
import { test } from "node:test";

import {
	type AnswerAttempt,
	type AnswerRepository,
	getStudentAnswerHistory,
	type StoredQuestion,
	submitAnswer,
} from "./answer-checking.ts";

const multipleChoiceQuestion: StoredQuestion = {
	id: "math-1",
	type: "multiple_choice",
	answer_key: JSON.stringify({
		type: "multiple_choice",
		correctAnswer: "B",
	}),
	correct_answer: "B. 12",
	explanation: "Multiply 3 by 4.",
};

function createRepository(question: StoredQuestion) {
	const attempts: AnswerAttempt[] = [];
	const repository: AnswerRepository = {
		async findQuestion() {
			return question;
		},
		async saveAttempt(attempt) {
			attempts.push(attempt);
			return attempts.length;
		},
		async getProgress() {
			return [];
		},
		async getHistory() {
			return [];
		},
	};
	return { repository, attempts };
}

test("grades multiple-choice answers on the server and records the attempt", async () => {
	const { repository, attempts } = createRepository(multipleChoiceQuestion);

	const result = await submitAnswer(repository, "student-1", {
		questionId: "math-1",
		answer: " b ",
	});

	assert.deepEqual(result, {
		attemptId: 1,
		questionId: "math-1",
		correct: true,
	});
	assert.deepEqual(attempts, [
		{
			studentId: "student-1",
			questionId: "math-1",
			answer: " b ",
			correct: true,
		},
	]);
});

test("returns stored feedback and persists incorrect answers", async () => {
	const { repository, attempts } = createRepository(multipleChoiceQuestion);

	const result = await submitAnswer(repository, "student-1", {
		questionId: "math-1",
		answer: "A",
	});

	assert.deepEqual(result, {
		attemptId: 1,
		questionId: "math-1",
		correct: false,
		correctAnswer: "B. 12",
		explanation: "Multiply 3 by 4.",
	});
	assert.equal(attempts[0]?.correct, false);
});

test("grades short text against accepted answers and rubric terms", async () => {
	const question: StoredQuestion = {
		...multipleChoiceQuestion,
		type: "short_text",
		answer_key: JSON.stringify({
			type: "short_text",
			acceptedAnswers: ["right angle"],
			requiredTerms: ["90 degrees", "angle"],
		}),
		correct_answer: "A right angle is 90 degrees.",
	};
	const { repository } = createRepository(question);

	const accepted = await submitAnswer(repository, "student-1", {
		questionId: "math-1",
		answer: "RIGHT   ANGLE",
	});
	const rubricMatch = await submitAnswer(repository, "student-1", {
		questionId: "math-1",
		answer: "An angle of 90 degrees",
	});
	const incomplete = await submitAnswer(repository, "student-1", {
		questionId: "math-1",
		answer: "90 degrees",
	});

	assert.equal(accepted.correct, true);
	assert.equal(rubricMatch.correct, true);
	assert.equal(incomplete.correct, false);
});

test("returns subject progress and a bounded review history", async () => {
	const calls: { studentId: string; limit: number }[] = [];
	const repository: AnswerRepository = {
		async findQuestion() {
			return null;
		},
		async saveAttempt() {
			return 0;
		},
		async getProgress(studentId) {
			assert.equal(studentId, "student-1");
			return [
				{
					subject: "Mathematics",
					attempts: 3,
					correct: 2,
					lastAttemptAt: "2026-11-17T12:00:00.000Z",
					questionsAttempted: 2,
					questionCount: 5,
					completionPercentage: 40,
				},
			];
		},
		async getHistory(studentId, limit) {
			calls.push({ studentId, limit });
			return [];
		},
	};

	const result = await getStudentAnswerHistory(repository, "student-1");

	assert.equal(result.progress[0]?.attempts, 3);
	assert.deepEqual(calls, [{ studentId: "student-1", limit: 100 }]);
});
