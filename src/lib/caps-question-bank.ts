import { z } from "zod";

export type QuestionType = "multiple-choice" | "short-text";

export type ApprovedSource = {
	id: string;
	title: string;
	subject: "Mathematics";
	grade: 7;
	curriculum: "CAPS";
	url?: string;
	sourceText?: string;
};

export type MultipleChoiceQuestion = {
	id: string;
	prompt: string;
	type: "multiple-choice";
	sourceRef: string;
	options: string[];
	answerKey: string;
	explanation: string;
	rubric?: string[];
};

export type ShortTextQuestion = {
	id: string;
	prompt: string;
	type: "short-text";
	sourceRef: string;
	answerKey?: string;
	explanation: string;
	rubric?: string[];
};

export type AcceptedQuestion = {
	id: string;
	status: "accepted";
	prompt: string;
	type: QuestionType;
	sourceRef: string;
	sourceTitle?: string;
	answerKey?: string;
	rubric?: string[];
	explanation: string;
	options?: string[];
	generatedFrom?: string;
};

export type RejectedQuestion = {
	id: string;
	status: "rejected";
	prompt: string;
	type: QuestionType;
	sourceRef?: string;
	reason: string;
};

export type StudentPublishedQuestion = {
	id: string;
	prompt: string;
	type: QuestionType;
	sourceRef: string;
	sourceTitle?: string;
	options?: string[];
};

export type QuestionBankDatabase = {
	prepare: (query: string) => {
		bind: (...values: unknown[]) => {
			run: () => Promise<{ success: boolean; meta?: Record<string, unknown> }>;
			all: () => Promise<{ results?: Record<string, unknown>[] }>;
		};
	};
};

export type AIQuestionRunner = {
	run: (
		model: string,
		input: {
			messages: Array<{ role: "system" | "user"; content: string }>;
		},
	) => Promise<unknown>;
};

const GeneratedQuestionSchema = z.object({
	evidence: z.string().min(1),
	prompt: z.string().min(1),
	type: z.enum(["multiple-choice", "short-text"]),
	options: z.array(z.string()).optional(),
	answerKey: z.string().optional(),
	rubric: z.array(z.string()).optional(),
	explanation: z.string().min(1),
});

const QuestionVerificationSchema = z.object({
	verified: z.boolean(),
	evidence: z.string().min(1),
});

export const DEFAULT_APPROVED_CAPS_SOURCES: ApprovedSource[] = [
	{
		id: "dbe-caps-grade-7-mathematics",
		title: "Department of Basic Education CAPS curriculum policy statements",
		subject: "Mathematics",
		grade: 7,
		curriculum: "CAPS",
		url: "https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS).aspx",
		sourceText:
			"Grade 7 Mathematics in the South African CAPS curriculum covers numbers and operations, patterns and algebra, space and shape, measurement, data handling, and probability. Questions must assess these Grade 7 learning areas and use age-appropriate calculations and terminology.",
	},
];

export function assertApprovedSources(
	sources: ApprovedSource[] | null | undefined,
): ApprovedSource[] {
	const approved =
		sources && sources.length > 0 ? sources : DEFAULT_APPROVED_CAPS_SOURCES;

	if (!approved.length) {
		throw new Error(
			"Approved CAPS source set is unavailable. The project requires explicit Grade 7 CAPS source approval before publishing questions.",
		);
	}

	return approved;
}

export function isApprovedSourceReference(
	sourceRef: string | null | undefined,
	approvedSources:
		| ApprovedSource[]
		| null
		| undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): boolean {
	if (!sourceRef || !sourceRef.trim()) {
		return false;
	}

	const approved = assertApprovedSources(approvedSources);
	const normalized = sourceRef.trim();

	return approved.some((source) => {
		const sourceValues = [
			source.id,
			source.title,
			source.url,
			source.sourceText,
		].filter(Boolean) as string[];
		return sourceValues.some(
			(value) => value === normalized || value.startsWith(normalized),
		);
	});
}

export function normalizeQuestionType(type: string): QuestionType {
	const normalized = type.trim().toLowerCase().replace(/[_-]+/g, " ");

	if (
		normalized === "multiple choice" ||
		normalized === "multiple-choice" ||
		normalized === "mcq" ||
		normalized === "multiple choice question"
	) {
		return "multiple-choice";
	}

	if (
		normalized === "short text" ||
		normalized === "short-text" ||
		normalized === "constructed response" ||
		normalized === "free response" ||
		normalized === "short answer"
	) {
		return "short-text";
	}

	throw new Error(`Unsupported question type: ${type}`);
}

export function toStudentPublishedQuestion(
	question: AcceptedQuestion,
): StudentPublishedQuestion {
	return {
		id: question.id,
		prompt: question.prompt,
		type: question.type,
		sourceRef: question.sourceRef,
		sourceTitle: question.sourceTitle,
		options: question.options,
	};
}

export function validateGeneratedQuestion(
	input: {
		id?: string;
		type?: string;
		sourceRef?: string;
		sourceTitle?: string;
		prompt?: string;
		explanation?: string;
		options?: string[];
		answerKey?: string;
		rubric?: string[];
		generatedFrom?: string;
	},
	approvedSources:
		| ApprovedSource[]
		| null
		| undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): AcceptedQuestion | RejectedQuestion {
	const questionId =
		input.id ?? crypto?.randomUUID?.() ?? `question-${Date.now()}`;

	if (!input.prompt || !input.prompt.trim()) {
		return {
			id: questionId,
			status: "rejected",
			prompt: input.prompt ?? "",
			type: normalizeQuestionType(input.type ?? "multiple-choice"),
			sourceRef: input.sourceRef,
			reason: "Question prompt is required.",
		};
	}

	if (
		!input.sourceRef ||
		!isApprovedSourceReference(input.sourceRef, approvedSources)
	) {
		return {
			id: questionId,
			status: "rejected",
			prompt: input.prompt,
			type: normalizeQuestionType(input.type ?? "multiple-choice"),
			sourceRef: input.sourceRef,
			reason: "Question source is not an approved Grade 7 CAPS reference.",
		};
	}

	const type = normalizeQuestionType(input.type ?? "multiple-choice");

	if (!input.explanation || !input.explanation.trim()) {
		return {
			id: questionId,
			status: "rejected",
			prompt: input.prompt,
			type,
			sourceRef: input.sourceRef,
			reason: "Questions must include an explanation for teacher validation.",
		};
	}

	if (type === "multiple-choice") {
		if (!Array.isArray(input.options) || input.options.length < 2) {
			return {
				id: questionId,
				status: "rejected",
				prompt: input.prompt,
				type,
				sourceRef: input.sourceRef,
				reason: "Multiple-choice questions require at least two options.",
			};
		}

		if (!input.answerKey || !input.answerKey.trim()) {
			return {
				id: questionId,
				status: "rejected",
				prompt: input.prompt,
				type,
				sourceRef: input.sourceRef,
				reason: "Multiple-choice questions require an answer key.",
			};
		}

		if (!input.options.includes(input.answerKey.trim())) {
			return {
				id: questionId,
				status: "rejected",
				prompt: input.prompt,
				type,
				sourceRef: input.sourceRef,
				reason: "The multiple-choice answer key must match one of the options.",
			};
		}

		return {
			id: questionId,
			status: "accepted",
			prompt: input.prompt,
			type,
			sourceRef: input.sourceRef,
			sourceTitle: input.sourceTitle,
			answerKey: input.answerKey.trim(),
			explanation: input.explanation.trim(),
			options: input.options,
			rubric: input.rubric,
			generatedFrom: input.generatedFrom,
		};
	}

	if (!input.answerKey && (!input.rubric || input.rubric.length === 0)) {
		return {
			id: questionId,
			status: "rejected",
			prompt: input.prompt,
			type,
			sourceRef: input.sourceRef,
			reason: "Short-text questions require an answer key or a rubric.",
		};
	}

	return {
		id: questionId,
		status: "accepted",
		prompt: input.prompt,
		type,
		sourceRef: input.sourceRef,
		sourceTitle: input.sourceTitle,
		answerKey: input.answerKey?.trim(),
		explanation: input.explanation.trim(),
		rubric: input.rubric,
		generatedFrom: input.generatedFrom,
	};
}

export async function persistAcceptedQuestion(
	db: QuestionBankDatabase,
	question: AcceptedQuestion,
): Promise<AcceptedQuestion> {
	if (question.status !== "accepted") {
		throw new Error(
			"Only accepted questions may be stored in the D1 question bank.",
		);
	}

	const type =
		question.type === "multiple-choice" ? "multiple_choice" : "short_text";
	const answerKey = JSON.stringify(
		type === "multiple_choice"
			? { type, correctAnswer: question.answerKey }
			: {
					type,
					acceptedAnswers: question.answerKey ? [question.answerKey] : [],
					requiredTerms: question.rubric ?? [],
				},
	);

	const sql = `
    INSERT INTO questions (
      id,
      subject,
      type,
      prompt,
      answer_key,
      correct_answer,
      explanation,
      source_ref,
      source_title,
      rubric,
      options,
      generated_from,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

	const statement = db.prepare(sql);
	await statement
		.bind(
			question.id,
			"Mathematics",
			type,
			question.prompt,
			answerKey,
			question.answerKey ?? question.rubric?.join(", ") ?? "",
			question.explanation,
			question.sourceRef,
			question.sourceTitle ?? null,
			question.rubric ? JSON.stringify(question.rubric) : null,
			question.options ? JSON.stringify(question.options) : null,
			question.generatedFrom ?? null,
			question.status,
		)
		.run();

	return question;
}

export async function getPublishedStudentQuestions(
	db: QuestionBankDatabase,
): Promise<StudentPublishedQuestion[]> {
	const statement = db.prepare(
		`SELECT id, prompt, type, source_ref, source_title, options
     FROM questions
     WHERE status = ?
     ORDER BY id`,
	);
	const result = await statement.bind("accepted").all();

	const rows = Array.isArray(result.results) ? result.results : [];

	return rows.map((row) => {
		const stored = row as Record<string, unknown>;
		const options =
			typeof stored.options === "string"
				? JSON.parse(stored.options)
				: undefined;

		if (
			options !== undefined &&
			(!Array.isArray(options) ||
				!options.every((option) => typeof option === "string"))
		) {
			throw new Error(
				`Question ${String(stored.id)} has invalid stored options.`,
			);
		}

		return {
			id: String(stored.id ?? ""),
			prompt: String(stored.prompt ?? ""),
			type: normalizeQuestionType(String(stored.type ?? "multiple-choice")),
			sourceRef: String(stored.source_ref ?? ""),
			sourceTitle:
				typeof stored.source_title === "string"
					? stored.source_title
					: undefined,
			options,
		};
	});
}

export function choosePublishedQuestion(
	questions: StudentPublishedQuestion[],
	type: QuestionType,
	excludedQuestionIds: string[],
): StudentPublishedQuestion | undefined {
	const matching = questions.filter((question) => question.type === type);
	const unseen = matching.filter(
		(question) => !excludedQuestionIds.includes(question.id),
	);
	const candidates = unseen.length > 0 ? unseen : matching;

	return candidates[Math.floor(Math.random() * candidates.length)];
}

function getAIResponseText(result: unknown): string {
	if (typeof result === "string") return result;
	if (
		typeof result === "object" &&
		result !== null &&
		"response" in result &&
		typeof result.response === "string"
	) {
		return result.response;
	}
	throw new Error("Workers AI returned an invalid question response.");
}

export async function generateQuestionFromApprovedSource(
	ai: AIQuestionRunner,
	sourceId: string,
	type: QuestionType,
	approvedSources: ApprovedSource[] = DEFAULT_APPROVED_CAPS_SOURCES,
): Promise<AcceptedQuestion | RejectedQuestion> {
	const source = assertApprovedSources(approvedSources).find(
		(approved) => approved.id === sourceId,
	);
	if (!source || !source.sourceText) {
		throw new Error(`Approved CAPS source is unavailable: ${sourceId}`);
	}

	const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
			{
				role: "system",
				content:
					"Generate one Grade 7 South African CAPS Mathematics question using only the supplied source text. Return one JSON object with fields: evidence (an exact quote from source text supporting the skill), prompt, type, options (string array for multiple-choice, omitted for short-text), answerKey (string), rubric (string array for short-text), and explanation. Do not include markdown.",
			},
			{
				role: "user",
				content: JSON.stringify({
					sourceTitle: source.title,
					sourceText: source.sourceText,
					questionType: type,
				}),
			},
		],
	});

	const generated = GeneratedQuestionSchema.safeParse(
		JSON.parse(getAIResponseText(response)),
	);
	if (!generated.success) {
		throw new Error("Workers AI returned an invalid question structure.");
	}
	const candidate = generated.data;

	if (
		candidate.type !== type ||
		!source.sourceText.includes(candidate.evidence)
	) {
		return {
			id: crypto.randomUUID(),
			status: "rejected",
			prompt: candidate.prompt,
			type,
			sourceRef: source.id,
			reason:
				"Workers AI could not verify the question against the approved CAPS source.",
		};
	}

	const verificationResponse = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
			{
				role: "system",
				content:
					"Verify that the question, answer key or rubric, and explanation are supported by the source text and correct for Grade 7 Mathematics. Return one JSON object with verified (boolean) and evidence (an exact quote from the source text that supports the answer). Set verified false if uncertain. Do not include markdown.",
			},
			{
				role: "user",
				content: JSON.stringify({
					sourceText: source.sourceText,
					question: candidate,
				}),
			},
		],
	});
	const verification = QuestionVerificationSchema.safeParse(
		JSON.parse(getAIResponseText(verificationResponse)),
	);
	if (
		!verification.success ||
		!verification.data.verified ||
		!source.sourceText.includes(verification.data.evidence)
	) {
		return {
			id: crypto.randomUUID(),
			status: "rejected",
			prompt: candidate.prompt,
			type,
			sourceRef: source.id,
			reason:
				"Workers AI could not verify the question and answer against the approved CAPS source.",
		};
	}

	return validateGeneratedQuestion(
		{
			id: crypto.randomUUID(),
			prompt: candidate.prompt,
			type: candidate.type,
			options: candidate.options,
			answerKey: candidate.answerKey,
			rubric: candidate.rubric,
			explanation: candidate.explanation,
			sourceRef: source.url ?? source.id,
			sourceTitle: source.title,
			generatedFrom: verification.data.evidence,
		},
		approvedSources,
	);
}

export type QuestionGeneratorInput = {
	id?: string;
	prompt: string;
	type: string;
	sourceRef: string;
	sourceTitle?: string;
	options?: string[];
	answerKey?: string;
	explanation?: string;
	rubric?: string[];
	generatedFrom?: string;
	approvedSources?: ApprovedSource[];
};

export async function generateQuestionRecord(
	input: QuestionGeneratorInput,
	ai?: AIQuestionRunner,
	approvedSources:
		| ApprovedSource[]
		| null
		| undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): Promise<AcceptedQuestion | RejectedQuestion> {
	const sourceSet = approvedSources ?? DEFAULT_APPROVED_CAPS_SOURCES;

	if (!input.prompt || !input.prompt.trim()) {
		throw new Error("Question generation requires a prompt.");
	}

	if (
		!input.sourceRef ||
		!isApprovedSourceReference(input.sourceRef, sourceSet)
	) {
		return {
			id: input.id ?? `rejected-${Date.now()}`,
			status: "rejected",
			prompt: input.prompt,
			type: normalizeQuestionType(input.type ?? "multiple-choice"),
			sourceRef: input.sourceRef,
			reason: "Unsupported or unapproved CAPS source reference.",
		};
	}

	if (ai) {
		const result = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
			messages: [
				{
					role: "system",
					content:
						"Verify all generated question content against the approved Grade 7 CAPS source set before returning it.",
				},
				{
					role: "user",
					content: JSON.stringify({
						type: input.type,
						prompt: input.prompt,
						sourceRef: input.sourceRef,
						approvedSources: sourceSet.map((source) => source.id),
					}),
				},
			],
		});

		const payload = typeof result === "string" ? JSON.parse(result) : result;

		return validateGeneratedQuestion(
			{
				...input,
				...payload,
				sourceRef: input.sourceRef,
			},
			sourceSet,
		);
	}

	return validateGeneratedQuestion(input, sourceSet);
}

export async function buildQuestionBankWorkflow(
	params: {
		approvedSources?: ApprovedSource[];
		db?: QuestionBankDatabase;
		ai?: AIQuestionRunner;
	} = {},
): Promise<{
	approve: (
		question: QuestionGeneratorInput,
	) => Promise<AcceptedQuestion | RejectedQuestion>;
	persist: (question: AcceptedQuestion) => Promise<AcceptedQuestion>;
	studentView: (question: AcceptedQuestion) => StudentPublishedQuestion;
}> {
	const approved = assertApprovedSources(params.approvedSources);

	return {
		approve: async (question) =>
			generateQuestionRecord(question, params.ai, approved),
		persist: async (question) => {
			if (!params.db) {
				throw new Error(
					"A D1 database binding is required to persist questions.",
				);
			}
			return persistAcceptedQuestion(params.db, question);
		},
		studentView: (question) => toStudentPublishedQuestion(question),
	};
}

export const createQuestionBank = buildQuestionBankWorkflow;
export const approveQuestion = generateQuestionRecord;
export const persistQuestion = persistAcceptedQuestion;
export const publishQuestionForStudent = toStudentPublishedQuestion;
export const validateQuestion = validateGeneratedQuestion;
export const ensureApprovedSources = assertApprovedSources;
export const generateQuestion = generateQuestionRecord;
export const studentSafeQuestion = toStudentPublishedQuestion;
