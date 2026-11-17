import assert from "node:assert/strict";
import { test } from "node:test";

import {
	type AcceptedQuestion,
	choosePublishedQuestion,
	DEFAULT_APPROVED_CAPS_SOURCES,
	generateQuestionFromApprovedSource,
	persistAcceptedQuestion,
	type QuestionBankDatabase,
	toStudentPublishedQuestion,
	validateGeneratedQuestion,
} from "./caps-question-bank.ts";

const source = DEFAULT_APPROVED_CAPS_SOURCES[0];
if (!source?.sourceText) throw new Error("Test CAPS source is missing.");

const candidate = {
	evidence: "numbers and operations",
	prompt: "What is 4 + 4?",
	type: "multiple-choice",
	options: ["6", "8", "10"],
	answerKey: "8",
	explanation: "Adding four and four gives eight.",
};

function createAI(responses: unknown[]) {
	let index = 0;
	return {
		async run() {
			const response = responses[index];
			index += 1;
			return response;
		},
	};
}

test("generates and separately verifies a CAPS question before accepting it", async () => {
	const ai = createAI([
		{ response: JSON.stringify(candidate) },
		{
			response: JSON.stringify({
				verified: true,
				evidence: "numbers and operations",
			}),
		},
	]);

	const result = await generateQuestionFromApprovedSource(
		ai,
		source.id,
		"multiple-choice",
	);

	assert.equal(result.status, "accepted");
	if (result.status !== "accepted") return;
	assert.equal(result.answerKey, "8");
	assert.equal(result.generatedFrom, "numbers and operations");
	assert.deepEqual(toStudentPublishedQuestion(result), {
		id: result.id,
		prompt: candidate.prompt,
		type: "multiple-choice",
		sourceRef: source.url ?? source.id,
		sourceTitle: source.title,
		options: candidate.options,
	});
});

test("rejects AI questions without source evidence", async () => {
	const ai = createAI([
		{
			response: JSON.stringify({
				...candidate,
				evidence: "an unsupported curriculum claim",
			}),
		},
	]);

	const result = await generateQuestionFromApprovedSource(
		ai,
		source.id,
		"multiple-choice",
	);

	assert.equal(result.status, "rejected");
});

test("rejects multiple-choice answer keys absent from the choices", () => {
	const result = validateGeneratedQuestion({
		...candidate,
		sourceRef: source.url ?? source.id,
		sourceTitle: source.title,
	});

	assert.equal(result.status, "accepted");

	const invalid = validateGeneratedQuestion({
		...candidate,
		answerKey: "12",
		sourceRef: source.id,
		sourceTitle: source.title,
	});
	assert.equal(invalid.status, "rejected");
});

test("persists accepted questions in the same D1 table used for grading", async () => {
	let statement = "";
	let boundValues: unknown[] = [];
	const db: QuestionBankDatabase = {
		prepare(query) {
			statement = query;
			return {
				bind(...values) {
					boundValues = values;
					return {
						async run() {
							return { success: true };
						},
						async all() {
							return { results: [] };
						},
					};
				},
			};
		},
	};
	const question: AcceptedQuestion = {
		id: "question-1",
		status: "accepted",
		prompt: candidate.prompt,
		type: "multiple-choice",
		sourceRef: source.id,
		sourceTitle: source.title,
		answerKey: candidate.answerKey,
		explanation: candidate.explanation,
		options: candidate.options,
		generatedFrom: candidate.evidence,
	};

	await persistAcceptedQuestion(db, question);

	assert.match(statement, /INSERT INTO questions/);
	assert.doesNotMatch(statement, /question_bank/);
	assert.deepEqual(JSON.parse(String(boundValues[4])), {
		type: "multiple_choice",
		correctAnswer: "8",
	});
	assert.equal(boundValues[5], "8");
	assert.equal(boundValues[7], source.id);
});

test("reuses a published question when every matching question was excluded", () => {
	const question = {
		id: "question-1",
		prompt: candidate.prompt,
		type: "multiple-choice" as const,
		sourceRef: source.url ?? source.id,
		sourceTitle: source.title,
		options: candidate.options,
	};

	assert.equal(
		choosePublishedQuestion([question], "multiple-choice", [question.id]),
		question,
	);
	assert.equal(choosePublishedQuestion([], "multiple-choice", []), undefined);
});
