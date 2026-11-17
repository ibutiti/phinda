import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	type AIQuestionRunner,
	choosePublishedQuestion,
	DEFAULT_APPROVED_CAPS_SOURCES,
	generateQuestionFromApprovedSource,
	getPublishedStudentQuestions,
	persistAcceptedQuestion,
	toStudentPublishedQuestion,
} from "../lib/caps-question-bank";
import { getAuthenticatedStudentId } from "./student-auth";

const NextQuestionSchema = z.object({
	type: z.enum(["multiple-choice", "short-text"]),
	excludedQuestionIds: z.array(z.string().min(1).max(128)).max(100),
});

export const getNextStudyQuestion = createServerFn({ method: "POST" })
	.validator(NextQuestionSchema)
	.handler(async ({ data }) => {
		const userId = await getAuthenticatedStudentId();
		if (!userId) throw new Error("Unauthorized");

		const questions = await getPublishedStudentQuestions(env.DB);
		const existing = choosePublishedQuestion(
			questions,
			data.type,
			data.excludedQuestionIds,
		);
		if (existing) return existing;

		const source = DEFAULT_APPROVED_CAPS_SOURCES[0];
		if (!source) throw new Error("No approved CAPS source is configured.");

		const ai: AIQuestionRunner = {
			run: (model, input) => env.AI.run(model, input),
		};
		const generated = await generateQuestionFromApprovedSource(
			ai,
			source.id,
			data.type,
		);

		if (generated.status !== "accepted") {
			throw new Error(generated.reason);
		}

		await persistAcceptedQuestion(env.DB, generated);
		return toStudentPublishedQuestion(generated);
	});
