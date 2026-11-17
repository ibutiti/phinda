import assert from "node:assert/strict";
import { test } from "node:test";

import {
	type AcceptedQuestion,
	choosePublishedQuestion,
	DEFAULT_APPROVED_CAPS_SOURCES,
	generateQuestionFromApprovedSource,
	generateQuestionRecord,
	getPublishedStudentQuestions,
	persistAcceptedQuestion,
	type QuestionBankDatabase,
	toStudentPublishedQuestion,
	validateGeneratedQuestion,
} from "./caps-question-bank.ts";

const source = DEFAULT_APPROVED_CAPS_SOURCES[0];
if (!source?.sourceText) throw new Error("Test CAPS source is missing.");

const candidate = {
	evidence: "Subtracting an integer is the same as adding its additive inverse.",
	prompt: "What is 7 - (-4)?",
	type: "multiple-choice",
	options: ["-11", "3", "11"],
	answerKey: "11",
	explanation: "Subtracting a negative is adding its additive inverse: 7 + 4 = 11.",
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
				evidence: "7 – (– 4) = 7 + (+4) = 11 or –7 – (– 4) = –7 + (+4) = –3",
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
	assert.equal(result.answerKey, "11");
	assert.equal(
		result.generatedFrom,
		"7 – (– 4) = 7 + (+4) = 11 or –7 – (– 4) = –7 + (+4) = –3",
	);
	assert.deepEqual(toStudentPublishedQuestion(result), {
		id: result.id,
		prompt: candidate.prompt,
		type: "multiple-choice",
		sourceRef: source.url,
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

test("rejects evidence that only names the broad CAPS topic", async () => {
	const ai = createAI([
		{
			response: JSON.stringify({
				...candidate,
				evidence: "Grade 7 Term 4, Topic 1.3: Integers.",
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

test("generic question validation also sends the CAPS source to its AI verifier", async () => {
	let verifierInput = "";
	const ai = {
		async run(_model: string, input: { messages: { content: string }[] }) {
			verifierInput = input.messages[1]?.content ?? "";
			return {
				response: JSON.stringify({
					verified: true,
					evidence: candidate.evidence,
				}),
			};
		},
	};

	const result = await generateQuestionRecord(
		{
			...candidate,
			sourceRef: source.url,
			sourceTitle: source.title,
		},
		ai,
	);

	assert.equal(result.status, "accepted");
	assert.equal(JSON.parse(verifierInput).sourceText, source.sourceText);
});

test("rejects multiple-choice answer keys absent from the choices", () => {
	const result = validateGeneratedQuestion({
		...candidate,
		sourceRef: source.url,
		sourceTitle: source.title,
		generatedFrom: candidate.evidence,
	});

	assert.equal(result.status, "accepted");

	const invalid = validateGeneratedQuestion({
		...candidate,
		answerKey: "12",
		sourceRef: source.id,
		sourceTitle: source.title,
		generatedFrom: candidate.evidence,
	});
	assert.equal(invalid.status, "rejected");
});

test("published-question query excludes accepted rows without provenance", async () => {
	let statement = "";
	const db: QuestionBankDatabase = {
		prepare(query) {
			statement = query;
			return {
				bind() {
					return {
						async run() {
							return { success: true };
						},
						async all() {
							return {
								results: [
									{
										id: "published",
										prompt: candidate.prompt,
										type: "multiple_choice",
										source_ref: source.url,
										source_title: source.title,
										options: JSON.stringify(candidate.options),
									},
									{
										id: "legacy",
										prompt: candidate.prompt,
										type: "multiple_choice",
										source_ref: null,
										source_title: null,
									},
									{
										id: "unapproved",
										prompt: candidate.prompt,
										type: "multiple_choice",
										source_ref: "https://example.com/other-source",
										source_title: "Other source",
									},
								],
							};
						},
					};
				},
			};
		},
	};

	const questions = await getPublishedStudentQuestions(db);

	assert.match(statement, /source_ref IS NOT NULL/);
	assert.match(statement, /source_title IS NOT NULL/);
	assert.match(statement, /generated_from IS NOT NULL/);
	assert.deepEqual(
		questions.map((question) => question.id),
		["published"],
	);
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
		correctAnswer: "11",
	});
	assert.equal(boundValues[5], "11");
	assert.equal(boundValues[7], source.id);
});

test("reuses a published question when every matching question was excluded", () => {
	const question = {
		id: "question-1",
		prompt: candidate.prompt,
		type: "multiple-choice" as const,
		sourceRef: source.url,
		sourceTitle: source.title,
		options: candidate.options,
	};

	assert.equal(
		choosePublishedQuestion([question], "multiple-choice", [question.id]),
		question,
	);
	assert.equal(choosePublishedQuestion([], "multiple-choice", []), undefined);
});
