import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowLeft,
	BookOpen,
	Calculator,
	Shapes,
	Sigma,
	Table2,
} from "lucide-react";

import HeaderUser from "../integrations/clerk/header-user";
import { checkStudentSession } from "../server/student-auth";

const learningAreas = [
	{
		title: "Numbers and operations",
		description:
			"Work with whole numbers, integers, fractions, decimals, and percentages.",
		icon: Calculator,
	},
	{
		title: "Patterns and algebra",
		description: "Explore sequences, expressions, and mathematical rules.",
		icon: Sigma,
	},
	{
		title: "Space and shape",
		description: "Study shapes, angles, and geometric properties.",
		icon: Shapes,
	},
	{
		title: "Measurement",
		description: "Use units, conversions, perimeter, area, and volume.",
		icon: BookOpen,
	},
	{
		title: "Data handling and probability",
		description: "Organise data and compare the chance of events.",
		icon: Table2,
	},
];

export const Route = createFileRoute("/subjects/grade-7-mathematics")({
	beforeLoad: async () => {
		if (!(await checkStudentSession())) throw redirect({ to: "/" });
	},
	component: Grade7Mathematics,
});

function Grade7Mathematics() {
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

				<Link
					to="/"
					className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
				>
					<ArrowLeft size={16} /> All subjects
				</Link>

				<section className="mt-6 rounded-[2rem] bg-gradient-to-br from-emerald-100 via-white to-teal-100 p-8 md:p-12">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
						Grade 7 · South African CAPS
					</p>
					<h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
						Mathematics
					</h1>
					<p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
						Explore your curriculum, practise with questions, and review your
						progress.
					</p>
					<Link
						to="/study"
						className="mt-8 inline-flex rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
					>
						Start studying
					</Link>
				</section>

				<section className="mt-12" aria-labelledby="learning-areas">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
						The curriculum
					</p>
					<h2 id="learning-areas" className="mt-2 text-3xl font-bold">
						Learning areas
					</h2>
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{learningAreas.map(({ title, description, icon: Icon }) => (
							<article
								key={title}
								className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
							>
								<Icon
									className="text-emerald-700"
									size={24}
									aria-hidden="true"
								/>
								<h3 className="mt-5 text-lg font-bold">{title}</h3>
								<p className="mt-2 leading-6 text-slate-600">{description}</p>
							</article>
						))}
					</div>
				</section>

				<p className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
					Your account and study progress are private to you.
				</p>
			</div>
		</main>
	);
}
