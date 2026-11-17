import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

const csrfMiddleware = createCsrfMiddleware({
	filter: (context) => context.handlerType === "serverFn",
});

const clerkConfigured =
	Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) &&
	Boolean(process.env.CLERK_SECRET_KEY);

export const startInstance = createStart(() => ({
	requestMiddleware: [
		csrfMiddleware,
		...(clerkConfigured ? [clerkMiddleware()] : []),
	],
}));
