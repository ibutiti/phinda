import { Show, SignInButton, SignUpButton } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpRight,
	BookOpen,
	Calculator,
	Compass,
	LockKeyhole,
	Sparkles,
} from "lucide-react";

import HeaderUser from "../integrations/clerk/header-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
					<a className="nav-link is-active" href="#subjects">
						Subjects
					</a>
					<a className="nav-link" href="#how-it-works">
						How it works
					</a>
				</nav>
				<HeaderUser />
			</header>

			<main>
				<section className="hero page-wrap">
					<div className="hero-copy rise-in">
						<div className="eyebrow">
							<span className="eyebrow-dot" /> Learning that moves with you
						</div>
						<h1 className="display-title">
							Your next big idea starts with <em>one small step.</em>
						</h1>
						<p className="hero-description">
							A calm place to practise, explore and grow. Start with the South
							African CAPS Mathematics curriculum for Grade 7.
						</p>
						<div className="hero-actions">
							<Show when="signed-out">
								<SignUpButton
									mode="modal"
									fallbackRedirectUrl="/subjects/grade-7-mathematics"
								>
									<button className="button-primary" type="button">
										Create your free account <ArrowUpRight size={17} />
									</button>
								</SignUpButton>
								<SignInButton
									mode="modal"
									fallbackRedirectUrl="/subjects/grade-7-mathematics"
								>
									<button className="button-secondary" type="button">
										I already have an account
									</button>
								</SignInButton>
							</Show>
							<Show when="signed-in">
								<Link
									to="/subjects/grade-7-mathematics"
									className="button-primary"
								>
									Continue to Grade 7 Maths <ArrowUpRight size={17} />
								</Link>
							</Show>
						</div>
						<div className="trust-note">
							<LockKeyhole size={15} />
							<span>Your learning space is private to you.</span>
						</div>
					</div>

					<div className="hero-art rise-in" aria-hidden="true">
						<div className="orbit orbit-one" />
						<div className="orbit orbit-two" />
						<div className="math-card math-card-main">
							<div className="math-card-top">
								<span className="math-card-icon">
									<Calculator size={19} />
								</span>
								<span className="math-card-label">YOUR FIRST SUBJECT</span>
							</div>
							<div className="math-equation" aria-hidden="true">
								x + 7 = 19
							</div>
							<div className="math-answer">
								<span className="answer-check">✓</span> x = 12
							</div>
							<div className="math-card-footer">
								<span>Algebra basics</span>
								<span>GRADE 7 · CAPS</span>
							</div>
						</div>
						<div className="floating-note note-top">
							<span className="note-spark">✳</span> Made for curious minds
						</div>
						<div className="floating-note note-bottom">
							<span className="note-dot" /> Grade 7 · CAPS
						</div>
						<div className="hero-sun" aria-hidden="true">
							<Sparkles size={25} />
						</div>
					</div>
				</section>

				<section className="subject-section page-wrap" id="subjects">
					<div className="section-heading">
						<div>
							<p className="island-kicker">Your learning path</p>
							<h2 className="display-title">A good place to begin.</h2>
						</div>
						<p>One subject. A whole year of new ways to think.</p>
					</div>

					<div className="subject-card feature-card">
						<div className="subject-icon" aria-hidden="true">
							<Calculator size={27} />
						</div>
						<div className="subject-content">
							<div className="subject-tags">
								<span>GRADE 7</span>
								<span>SOUTH AFRICAN CAPS</span>
							</div>
							<h3>Mathematics</h3>
							<p>
								Build confidence with numbers, patterns, shapes, measurement and
								data.
							</p>
							<div className="subject-meta">
								<span>
									<BookOpen size={15} /> 6 learning areas
								</span>
								<span>
									<LockKeyhole size={15} /> Private learning space
								</span>
							</div>
						</div>
						<div className="subject-action">
							<Show when="signed-out">
								<SignUpButton
									mode="modal"
									fallbackRedirectUrl="/subjects/grade-7-mathematics"
								>
									<button type="button" className="subject-open">
										Open subject <ArrowUpRight size={17} />
									</button>
								</SignUpButton>
								<span className="subject-hint">
									Create an account to get started
								</span>
							</Show>
							<Show when="signed-in">
								<Link
									to="/subjects/grade-7-mathematics"
									className="subject-open"
								>
									Open subject <ArrowUpRight size={17} />
								</Link>
								<span className="subject-hint">Ready when you are</span>
							</Show>
						</div>
					</div>
				</section>

				<section className="how-section page-wrap" id="how-it-works">
					<div className="how-intro">
						<span className="how-icon">
							<Compass size={21} />
						</span>
						<div>
							<p className="island-kicker">Simple by design</p>
							<h2 className="display-title">Learn at your own pace.</h2>
						</div>
					</div>
					<div className="how-steps">
						<article>
							<span>01</span>
							<h3>Make it yours</h3>
							<p>Create a private account with your email.</p>
						</article>
						<article>
							<span>02</span>
							<h3>Pick a subject</h3>
							<p>
								Open Grade 7 Mathematics and explore the CAPS learning areas.
							</p>
						</article>
						<article>
							<span>03</span>
							<h3>Keep discovering</h3>
							<p>Move through concepts at a pace that feels right for you.</p>
						</article>
					</div>
				</section>
			</main>

			<footer className="site-footer">
				<div className="page-wrap footer-content">
					<Link to="/" className="brand footer-brand">
						<span className="brand-mark" aria-hidden="true">
							<BookOpen size={17} />
						</span>
						<span>
							phinda<span className="brand-period">.</span>
						</span>
					</Link>
					<span>Small steps. Strong foundations.</span>
				</div>
			</footer>
		</div>
	);
}
