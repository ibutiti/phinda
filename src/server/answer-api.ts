import { env } from "cloudflare:workers";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

import {
	AnswerSubmissionSchema,
	getStudentAnswerHistory,
	submitAnswer as submitAnswerForStudent,
} from "./answer-checking";
import { createD1AnswerRepository } from "./d1-answer-repository";

export const submitStudentAnswer = createServerFn({ method: "POST" })
	.validator(AnswerSubmissionSchema)
	.handler(async ({ data }) => {
		const { userId } = await auth();
		if (!userId) throw new Error("Unauthorized");

		return submitAnswerForStudent(
			createD1AnswerRepository(env.DB),
			userId,
			data,
		);
	});

export const getStudentProgress = createServerFn({ method: "GET" }).handler(
	async () => {
		const { userId } = await auth();
		if (!userId) throw new Error("Unauthorized");

		return getStudentAnswerHistory(createD1AnswerRepository(env.DB), userId);
	},
);
