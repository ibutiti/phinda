import { createFileRoute, Link } from "@tanstack/react-router";

import HeaderUser from "../integrations/clerk/header-user";
import { getStudentDashboard } from "../server/answer-api";

export const Route = createFileRoute("/")({
	loader: () => getStudentDashboard(),
	component: Home,
});

function Home() {
	const dashboard = Route.useLoaderData();

	return (
		<main className="min-h-screen px-6 py-8 text-slate-900">
			<div className="mx-auto max-w-6xl">
				<header className="mb-12 flex items-center justify-between gap-4">
					<Link
						to="/"
						className="text-xl font-black tracking-tight text-slate-900"
					>
						phinda<span className="text-emerald-700">.</span>
					</Link>
					<HeaderUser />
				</header>

				<section className="rounded-[2rem] bg-gradient-to-br from-emerald-100 via-white to-teal-100 p-8 md:p-12">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
						Grade 7 · South African CAPS
					</p>
					<h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
						Learn it. Practise it. Phinda.
					</h1>
					<p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
						Build confidence in Mathematics with curriculum-aligned practice and
						progress saved to your account.
					</p>
					{dashboard.isSignedIn ? (
						<div className="mt-8 flex flex-wrap gap-3">
							<Link
								to="/subjects/grade-7-mathematics"
								className="rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
							>
								Explore Mathematics
							</Link>
							<Link
								to="/study"
								className="rounded-full border border-emerald-800 px-6 py-3 font-semibold text-emerald-950 transition hover:bg-white/70"
							>
								Start studying
							</Link>
						</div>
					) : (
						<p className="mt-8 rounded-2xl border border-emerald-200 bg-white/70 p-4 text-sm text-slate-700">
							Sign in or create an account to open Mathematics and save your
							progress.
						</p>
					)}
				</section>

				{dashboard.isSignedIn && (
					<section className="mt-12" aria-labelledby="progress-heading">
						<div className="flex flex-wrap items-end justify-between gap-3">
							<div>
								<p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
									Your account
								</p>
								<h2 id="progress-heading" className="mt-2 text-3xl font-bold">
									Study progress
								</h2>
							</div>
							<p className="text-sm text-slate-600">
								Based on published questions and your saved answer attempts.
							</p>
						</div>

						{dashboard.progress.length === 0 ? (
							<p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
								No published questions or saved attempts yet. Start a study
								session to begin.
							</p>
						) : (
							<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{dashboard.progress.map((subject) => (
									<article
										key={subject.subject}
										className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
									>
										<div className="flex items-start justify-between gap-4">
											<h3 className="text-xl font-bold">{subject.subject}</h3>
											<span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
												{subject.completionPercentage}%
											</span>
										</div>
										<div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
											<div
												className="h-full rounded-full bg-emerald-600"
												style={{
													width: `${Math.min(subject.completionPercentage, 100)}%`,
												}}
											/>
										</div>
										<dl className="mt-5 space-y-2 text-sm text-slate-600">
											<div className="flex justify-between gap-3">
												<dt>Unique questions attempted</dt>
												<dd className="font-semibold text-slate-900">
													{subject.questionsAttempted}/{subject.questionCount}
												</dd>
											</div>
											<div className="flex justify-between gap-3">
												<dt>Correct attempts</dt>
												<dd className="font-semibold text-slate-900">
													{subject.correct}
												</dd>
											</div>
											<div className="flex justify-between gap-3">
												<dt>Total attempts</dt>
												<dd className="font-semibold text-slate-900">
													{subject.attempts}
												</dd>
											</div>
										</dl>
									</article>
								))}
							</div>
						)}

						<div className="mt-10">
							<h2 className="text-2xl font-bold">Recent review history</h2>
							{dashboard.history.length === 0 ? (
								<p className="mt-4 text-slate-600">No answers saved yet.</p>
							) : (
								<ol className="mt-4 space-y-3">
									{dashboard.history.slice(0, 5).map((attempt) => (
										<li
											key={attempt.id}
											className="rounded-2xl border border-slate-200 bg-white p-4"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<p className="font-semibold">{attempt.prompt}</p>
												<span
													className={
														attempt.correct
															? "text-sm font-bold text-emerald-700"
															: "text-sm font-bold text-amber-700"
													}
												>
													{attempt.correct ? "Correct" : "Review"}
												</span>
											</div>
											<p className="mt-2 text-sm text-slate-600">
												Your answer: {attempt.answer}
											</p>
										</li>
									))}
								</ol>
							)}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
