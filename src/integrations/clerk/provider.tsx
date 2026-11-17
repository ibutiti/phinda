import { ClerkProvider } from "@clerk/tanstack-react-start";

export default function AppClerkProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
		return (
			<main className="auth-setup">
				<div className="brand">
					<span className="brand-mark" aria-hidden="true">
						p
					</span>
					<span>
						phinda<span className="brand-period">.</span>
					</span>
				</div>
				<section className="auth-setup-card">
					<p className="island-kicker">One quick setup step</p>
					<h1 className="display-title">Sign-in is not configured yet.</h1>
					<p>
						Add the Clerk publishable key and secret key to your environment to
						enable student accounts.
					</p>
					<code>VITE_CLERK_PUBLISHABLE_KEY · CLERK_SECRET_KEY</code>
				</section>
			</main>
		);
	}

	return <ClerkProvider>{children}</ClerkProvider>;
}
