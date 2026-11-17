import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export async function getAuthenticatedStudentId() {
	if (
		!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
		!process.env.CLERK_SECRET_KEY
	) {
		return null;
	}

	const { userId } = await auth();
	return userId;
}

export const checkStudentSession = createServerFn({ method: "GET" }).handler(
	async () => Boolean(await getAuthenticatedStudentId()),
);
