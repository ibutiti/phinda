import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";

import {
	AnswerSubmissionSchema,
	getStudentAnswerHistory,
	submitAnswer as submitAnswerForStudent,
} from "./answer-checking";
import { createD1AnswerRepository } from "./d1-answer-repository";
import { getAuthenticatedStudentId } from "./student-auth";

export const getStudentDashboard = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = await getAuthenticatedStudentId();
		if (!userId) {
			return { isSignedIn: false, progress: [], history: [] };
		}

		return {
			isSignedIn: true,
			...(await getStudentAnswerHistory(
				createD1AnswerRepository(env.DB),
				userId,
			)),
		};
	},
);

export const submitStudentAnswer = createServerFn({ method: "POST" })
	.validator(AnswerSubmissionSchema)
	.handler(async ({ data }) => {
		const userId = await getAuthenticatedStudentId();
		if (!userId) throw new Error("Unauthorized");

		return submitAnswerForStudent(
			createD1AnswerRepository(env.DB),
			userId,
			data,
		);
	});

export const getStudentProgress = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = await getAuthenticatedStudentId();
		if (!userId) throw new Error("Unauthorized");

		return getStudentAnswerHistory(createD1AnswerRepository(env.DB), userId);
	},
);
