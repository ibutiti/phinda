import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	ArrowLeft,
	ArrowUpRight,
	BookOpen,
	Calculator,
	LockKeyhole,
	Ruler,
	Shapes,
	Sigma,
	Table2,
} from "lucide-react";

import HeaderUser from "../integrations/clerk/header-user";

const learningAreas = [
	{
		number: "01",
		title: "Numbers, operations and relationships",
		description:
			"Work with whole numbers, integers, fractions, decimals and percentages.",
		icon: Calculator,
		tone: "mint",
	},
	{
		number: "02",
		title: "Patterns, functions and algebra",
		description:
			"Spot number patterns and use variables, expressions and equations.",
		icon: Sigma,
		tone: "peach",
	},
	{
		number: "03",
		title: "Space and shape",
		description:
			"Explore 2D shapes, 3D objects, angles and geometric constructions.",
		icon: Shapes,
		tone: "lavender",
	},
	{
		number: "04",
		title: "Measurement",
		description:
			"Use units, conversions, perimeter, area, volume and surface area.",
		icon: Ruler,
		tone: "yellow",
	},
	{
		number: "05",
		title: "Data handling",
		description: "Collect, organise, represent and interpret data.",
		icon: Table2,
		tone: "blue",
	},
	{
		number: "06",
		title: "Probability",
		description: "Describe and compare the chance of everyday events.",
		icon: BookOpen,
		tone: "rose",
	},
];

const checkStudentSession = createServerFn({ method: "GET" }).handler(
	async () => {
		if (!process.env.CLERK_SECRET_KEY) {
			return false;
		}

		const { userId } = await auth();
		return Boolean(userId);
	},
);

export const Route = createFileRoute("/subjects/grade-7-mathematics")({
	beforeLoad: async () => {
		const isSignedIn = await checkStudentSession();
		if (!isSignedIn) {
			throw redirect({ to: "/" });
		}
	},
	component: Grade7Mathematics,
});

function Grade7Mathematics() {
	return (
		<div className="app-shell">
			<header className="site-header page-wrap">
				<Link to="/" className="brand" aria-label="Phinda home">
					<span className="brand-mark" aria-hidden="true">
						<BookOpen size={20} strokeWidth={2.2} />
					</span>
					<span>
						phinda<span className="brand-period">.</span>
					</span>
				</Link>
				<nav className="site-nav" aria-label="Main navigation">
					<Link to="/" className="nav-link">
						All subjects
					</Link>
					<span className="nav-link is-active" aria-current="page">
						Grade 7 Maths
					</span>
				</nav>
				<HeaderUser />
			</header>

			<main className="course-page page-wrap">
				<Link to="/" className="back-link">
					<ArrowLeft size={16} /> All subjects
				</Link>
				<section className="course-hero">
					<div className="course-hero-copy">
						<div className="subject-tags">
							<span>GRADE 7</span>
							<span>SOUTH AFRICAN CAPS</span>
						</div>
						<h1 className="display-title">Mathematics</h1>
						<p>
							Strong foundations start with good questions. Explore the learning
							areas in your Grade 7 Mathematics curriculum.
						</p>
						<div className="course-facts">
							<span>
								<BookOpen size={16} /> 6 learning areas
							</span>
							<span>
								<LockKeyhole size={16} /> Private to your account
							</span>
						</div>
					</div>
					<div className="course-illustration" aria-hidden="true">
						<div className="course-circle">
							<Calculator size={49} strokeWidth={1.5} />
						</div>
						<span className="course-symbol symbol-one">π</span>
						<span className="course-symbol symbol-two">+</span>
						<span className="course-symbol symbol-three">÷</span>
						<span className="course-spark">✳</span>
					</div>
				</section>

				<section
					className="learning-areas"
					aria-labelledby="learning-areas-heading"
				>
					<div className="section-heading course-section-heading">
						<div>
							<p className="island-kicker">The curriculum</p>
							<h2 className="display-title" id="learning-areas-heading">
								Six learning areas to explore.
							</h2>
						</div>
						<p>Take your time. You can come back whenever you like.</p>
					</div>
					<div className="learning-grid">
						{learningAreas.map((area) => {
							const Icon = area.icon;
							return (
								<article
									className="learning-card feature-card"
									key={area.number}
								>
									<div className={`learning-icon ${area.tone}`}>
										<Icon size={22} strokeWidth={1.8} />
									</div>
									<span className="learning-number">
										LEARNING AREA {area.number}
									</span>
									<h3>{area.title}</h3>
									<p>{area.description}</p>
									<span className="learning-open">CAPS learning area</span>
								</article>
							);
						})}
					</div>
				</section>

				<aside className="course-note">
					<span className="note-check">
						<span>✓</span>
					</span>
					<div>
						<strong>Your space, your pace.</strong>
						<p>
							Your account is personal. Other students cannot access your
							account.
						</p>
					</div>
					<Link to="/" className="note-link">
						Back to subjects <ArrowUpRight size={15} />
					</Link>
				</aside>
			</main>

			<footer className="site-footer">
				<div className="page-wrap footer-content">
					<span>
						phinda<span className="brand-period">.</span>
					</span>
					<span>Grade 7 · Mathematics · South African CAPS</span>
				</div>
			</footer>
		</div>
	);
}
