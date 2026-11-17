import { ClerkProvider } from "@clerk/tanstack-react-start";

export default function AppClerkProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
		return (
			<main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
				<section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
						Phinda setup
					</p>
					<h1 className="mt-3 text-3xl font-bold text-slate-900">
						Student sign-in is not configured.
					</h1>
					<p className="mt-4 leading-7 text-slate-600">
						Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> and{" "}
						<code>CLERK_SECRET_KEY</code> to enable student accounts.
					</p>
				</section>
			</main>
		);
	}

	return <ClerkProvider>{children}</ClerkProvider>;
}
