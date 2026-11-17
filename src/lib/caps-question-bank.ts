import { z } from "zod";

export type QuestionType = "multiple-choice" | "short-text";

export type ApprovedSource = {
	id: string;
	title: string;
	subject: "Mathematics";
	grade: 7;
	curriculum: "CAPS";
	url: string;
	sourceText: string;
	evidenceQuotes: string[];
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
	sourceTitle: string;
	answerKey?: string;
	rubric?: string[];
	explanation: string;
	options?: string[];
	generatedFrom: string;
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
	sourceTitle: string;
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
		title:
			"Mathematics Grades 7-9 CAPS, Grade 7 Term 4, Topic 1.3: Integers (p. 68)",
		subject: "Mathematics",
		grade: 7,
		curriculum: "CAPS",
		url: "https://www.education.gov.za/LinkClick.aspx?fileticket=uCNqOwfGbmc%3d&tabid=573&portalid=0&mid=1629&forcedownload=true#page=68",
		evidenceQuotes: [
			"Add and subtract with integers",
			"Solve problems in contexts involving addition and subtraction of integers",
			"Start calculations using integers in small number ranges.",
			"Subtracting an integer is the same as adding its additive inverse.",
			"7 – 4 = 7 + (– 4) = 3 or –7 – 4 = –7 + (– 4) = –11",
			"7 – (– 4) = 7 + (+4) = 11 or –7 – (– 4) = –7 + (+4) = –3",
		],
		sourceText: [
			"Grade 7 Term 4, Topic 1.3: Integers.",
			"Add and subtract with integers",
			"Solve problems in contexts involving addition and subtraction of integers",
			"Start calculations using integers in small number ranges.",
			"Subtracting an integer is the same as adding its additive inverse.",
			"7 – 4 = 7 + (– 4) = 3 or –7 – 4 = –7 + (– 4) = –11",
			"7 – (– 4) = 7 + (+4) = 11 or –7 – (– 4) = –7 + (+4) = –3",
		].join("\n"),
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
	for (const source of approved) {
		if (
			!source.url ||
			!source.sourceText ||
			source.evidenceQuotes.length === 0 ||
			source.evidenceQuotes.some((quote) => !source.sourceText.includes(quote))
		) {
			throw new Error(
				`Approved CAPS source is missing source text or exact evidence: ${source.id}`,
			);
		}
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

	return findApprovedSource(sourceRef, approvedSources) !== undefined;
}

function findApprovedSource(
	sourceRef: string,
	approvedSources:
		| ApprovedSource[]
		| null
		| undefined = DEFAULT_APPROVED_CAPS_SOURCES,
): ApprovedSource | undefined {
	const normalized = sourceRef.trim();
	return assertApprovedSources(approvedSources).find((source) =>
		[source.id, source.title, source.url].some(
			(value) => value === normalized,
		),
	);
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

	const source = findApprovedSource(input.sourceRef, approvedSources);
	if (
		!source ||
		input.sourceTitle !== source.title ||
		!input.generatedFrom ||
		!source.evidenceQuotes.includes(input.generatedFrom)
	) {
		return {
			id: questionId,
			status: "rejected",
			prompt: input.prompt,
			type: normalizeQuestionType(input.type ?? "multiple-choice"),
			sourceRef: input.sourceRef,
			reason:
				"Questions must include exact supporting evidence and provenance from an approved CAPS source.",
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
       AND source_ref IS NOT NULL AND TRIM(source_ref) != ''
       AND source_title IS NOT NULL AND TRIM(source_title) != ''
       AND generated_from IS NOT NULL AND TRIM(generated_from) != ''
     ORDER BY id`,
	);
	const result = await statement.bind("accepted").all();

	const rows = Array.isArray(result.results) ? result.results : [];

	return rows.flatMap((row) => {
		const stored = row as Record<string, unknown>;
		const sourceRef = String(stored.source_ref ?? "");
		const sourceTitle = String(stored.source_title ?? "");
		if (findApprovedSource(sourceRef)?.title !== sourceTitle) return [];

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

		return [
			{
				id: String(stored.id ?? ""),
				prompt: String(stored.prompt ?? ""),
				type: normalizeQuestionType(
					String(stored.type ?? "multiple-choice"),
				),
				sourceRef,
				sourceTitle,
				options,
			},
		];
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
	if (!source) {
		throw new Error(`Approved CAPS source is unavailable: ${sourceId}`);
	}

	const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
			{
				role: "system",
				content:
					"Generate one Grade 7 South African CAPS Mathematics question using only the supplied source text and evidence quotes. It must assess the specified grade-level skill, not merely name the topic. Use small integer values. Return one JSON object with fields: evidence (exactly one supplied evidence quote that supports the skill), prompt, type, options (string array for multiple-choice, omitted for short-text), answerKey (string), rubric (string array for short-text), and explanation. Do not include markdown.",
			},
			{
				role: "user",
				content: JSON.stringify({
					sourceTitle: source.title,
					sourceText: source.sourceText,
					evidenceQuotes: source.evidenceQuotes,
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
		!source.evidenceQuotes.includes(candidate.evidence)
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
					"Verify that the question, answer key or rubric, and explanation are mathematically correct and supported by the supplied CAPS source text. Evidence must be exactly one supplied evidence quote that supports the specific operation or method, not just the topic name. Set verified false if uncertain. Return one JSON object with verified (boolean) and evidence (the exact quote). Do not include markdown.",
			},
			{
				role: "user",
				content: JSON.stringify({
					sourceText: source.sourceText,
					evidenceQuotes: source.evidenceQuotes,
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
		!source.evidenceQuotes.includes(verification.data.evidence)
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
			sourceRef: source.url,
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

	const source = input.sourceRef
		? findApprovedSource(input.sourceRef, sourceSet)
		: undefined;
	if (!source) {
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
						"Verify the question, answer key or rubric, and explanation against the supplied Grade 7 CAPS source text. Check mathematical correctness. Return JSON with verified (boolean) and evidence (exactly one supplied evidence quote supporting the specific skill). Set verified false if uncertain. Do not include markdown.",
				},
				{
					role: "user",
					content: JSON.stringify({
						sourceText: source.sourceText,
						evidenceQuotes: source.evidenceQuotes,
						question: input,
					}),
				},
			],
		});

		const verification = QuestionVerificationSchema.safeParse(
			JSON.parse(getAIResponseText(result)),
		);
		if (
			!verification.success ||
			!verification.data.verified ||
			!source.evidenceQuotes.includes(verification.data.evidence)
		) {
			return {
				id: input.id ?? `rejected-${Date.now()}`,
				status: "rejected",
				prompt: input.prompt,
				type: normalizeQuestionType(input.type),
				sourceRef: input.sourceRef,
				reason:
					"Workers AI could not verify the question and answer against the approved CAPS source.",
			};
		}

		return validateGeneratedQuestion(
			{
				...input,
				sourceTitle: source.title,
				generatedFrom: verification.data.evidence,
			},
			sourceSet,
		);
	}

	return validateGeneratedQuestion(
		{
			...input,
			sourceTitle: source.title,
		},
		sourceSet,
	);
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
