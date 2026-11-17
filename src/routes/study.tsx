import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import HeaderUser from "../integrations/clerk/header-user";
import type { StudentPublishedQuestion } from "../lib/caps-question-bank";
import { getStudentProgress, submitStudentAnswer } from "../server/answer-api";
import type {
	AnswerHistoryEntry,
	SubjectProgress,
} from "../server/answer-checking";
import { checkStudentSession } from "../server/student-auth";
import { getNextStudyQuestion } from "../server/study-api";

type QuestionType = "multiple-choice" | "short-text";
type AnswerResult = Awaited<ReturnType<typeof submitStudentAnswer>>;

export const Route = createFileRoute("/study")({
	beforeLoad: async () => {
		if (!(await checkStudentSession())) throw redirect({ to: "/" });
	},
	component: Study,
});

function Study() {
	const [question, setQuestion] = useState<StudentPublishedQuestion | null>(
		null,
	);
	const seenQuestionIds = useRef<string[]>([]);
	const [selectedChoice, setSelectedChoice] = useState("");
	const [shortAnswer, setShortAnswer] = useState("");
	const [result, setResult] = useState<AnswerResult | null>(null);
	const [questionError, setQuestionError] = useState("");
	const [answerError, setAnswerError] = useState("");
	const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [progress, setProgress] = useState<SubjectProgress[]>([]);
	const [history, setHistory] = useState<AnswerHistoryEntry[]>([]);
	const [progressError, setProgressError] = useState("");

	const loadNextQuestion = useCallback(async () => {
		setIsLoadingQuestion(true);
		setQuestionError("");
		setAnswerError("");
		setQuestion(null);
		setResult(null);
		setSelectedChoice("");
		setShortAnswer("");

		const types: QuestionType[] = ["multiple-choice", "short-text"];
		const type = types[Math.floor(Math.random() * types.length)];
		if (!type) {
			setQuestionError("No supported question type is available.");
			setIsLoadingQuestion(false);
			return;
		}

		try {
			const next = await getNextStudyQuestion({
				data: {
					type,
					excludedQuestionIds: seenQuestionIds.current.slice(-100),
				},
			});
			setQuestion(next);
			seenQuestionIds.current = [...seenQuestionIds.current, next.id];
		} catch (error) {
			console.error("Study question request failed", error);
			setQuestionError(
				"Could not load a question from the study server. Check your connection and try again.",
			);
		} finally {
			setIsLoadingQuestion(false);
		}
	}, []);

	const refreshProgress = useCallback(async () => {
		setProgressError("");
		try {
			const data = await getStudentProgress();
			setProgress(data.progress);
			setHistory(data.history);
		} catch (error) {
			console.error("Could not load student progress", error);
			setProgressError(
				"Progress and review history could not be loaded from the server.",
			);
		}
	}, []);

	useEffect(() => {
		void loadNextQuestion();
		void refreshProgress();
	}, [loadNextQuestion, refreshProgress]);

	async function submitAnswer(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!question) return;

		const answer =
			question.type === "multiple-choice" ? selectedChoice : shortAnswer.trim();
		if (!answer) return;

		setIsSubmitting(true);
		setAnswerError("");
		setResult(null);

		try {
			const savedResult = await submitStudentAnswer({
				data: { questionId: question.id, answer },
			});
			setResult(savedResult);
			await refreshProgress();
		} catch (error) {
			console.error("Answer submission was not confirmed", error);
			setAnswerError(
				"The server did not confirm your answer. We cannot confirm whether it was saved or graded.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	const canSubmit =
		question?.type === "multiple-choice"
			? selectedChoice.length > 0
			: shortAnswer.trim().length > 0;

	return (
		<main className="min-h-screen px-6 py-8 text-slate-900">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8 flex items-center justify-between gap-4">
					<Link
						to="/"
						className="text-xl font-black tracking-tight text-slate-900"
					>
						phinda<span className="text-emerald-700">.</span>
					</Link>
					<HeaderUser />
				</header>

				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">
							Grade 7 CAPS Mathematics
						</p>
						<h1 className="mt-2 text-3xl font-black">Study session</h1>
					</div>
					<Link
						to="/subjects/grade-7-mathematics"
						className="text-sm font-semibold text-slate-600 hover:text-slate-900"
					>
						Back to Mathematics
					</Link>
				</div>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
					<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-sm font-semibold text-slate-500">
									Questions come from the live study server.
								</p>
								{question && (
									<p className="mt-1 text-xs text-slate-500">
										Source:{" "}
										{question.sourceRef ? (
											<a
												href={question.sourceRef}
												target="_blank"
												rel="noreferrer"
												className="underline underline-offset-2"
											>
												{question.sourceTitle ?? question.sourceRef}
											</a>
										) : (
											"Reference unavailable"
										)}
									</p>
								)}
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() => void loadNextQuestion()}
								disabled={isLoadingQuestion || isSubmitting}
							>
								{isLoadingQuestion ? "Loading…" : "Next question"}
							</Button>
						</div>

						{questionError ? (
							<div
								role="alert"
								className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900"
							>
								<p>{questionError}</p>
								<Button
									type="button"
									className="mt-4"
									onClick={() => void loadNextQuestion()}
									disabled={isLoadingQuestion}
								>
									Retry
								</Button>
							</div>
						) : question ? (
							<form className="mt-6 space-y-5" onSubmit={submitAnswer}>
								<div className="rounded-2xl bg-slate-50 p-5">
									<p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
										{question.type === "multiple-choice"
											? "Multiple choice"
											: "Short answer"}
									</p>
									<h2 className="mt-3 text-xl font-bold leading-8">
										{question.prompt}
									</h2>
								</div>

								{question.type === "multiple-choice" && question.options ? (
									<fieldset className="grid gap-3">
										<legend className="sr-only">Choose your answer</legend>
										{question.options.map((option) => (
											<label
												key={option}
												className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${
													selectedChoice === option
														? "border-emerald-600 bg-emerald-50"
														: "border-slate-200 hover:bg-slate-50"
												}`}
											>
												<input
													type="radio"
													name="answer"
													value={option}
													checked={selectedChoice === option}
													onChange={() => setSelectedChoice(option)}
													disabled={isSubmitting || result !== null}
												/>
												<span>{option}</span>
											</label>
										))}
									</fieldset>
								) : (
									<label className="block" htmlFor="study-answer">
										<span className="mb-2 block text-sm font-semibold text-slate-700">
											Your answer
										</span>
										<Textarea
											id="study-answer"
											value={shortAnswer}
											onChange={(event) => setShortAnswer(event.target.value)}
											disabled={isSubmitting || result !== null}
											placeholder="Type your answer"
											className="min-h-28"
										/>
									</label>
								)}

								{answerError && (
									<p
										role="alert"
										className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900"
									>
										{answerError}
									</p>
								)}

								{result && (
									<output
										className={`rounded-2xl p-5 ${
											result.correct
												? "bg-emerald-50 text-emerald-950"
												: "bg-amber-50 text-amber-950"
										}`}
									>
										<p className="font-bold">
											{result.correct
												? "Correct — your answer was saved."
												: "Review this answer"}
										</p>
										{!result.correct && (
											<>
												<p className="mt-2">
													Correct answer: {result.correctAnswer}
												</p>
												<p className="mt-1 text-sm leading-6">
													{result.explanation}
												</p>
											</>
										)}
									</output>
								)}

								<div className="flex flex-wrap gap-3">
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting || result !== null}
									>
										{isSubmitting ? "Checking…" : "Check answer"}
									</Button>
									{result && (
										<Button
											type="button"
											variant="secondary"
											onClick={() => void loadNextQuestion()}
											disabled={isLoadingQuestion}
										>
											Continue
										</Button>
									)}
								</div>
							</form>
						) : (
							<p className="mt-6 rounded-2xl bg-slate-50 p-5 text-slate-600">
								Connecting to the study server…
							</p>
						)}
					</section>

					<aside className="space-y-6">
						<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
							<h2 className="text-lg font-bold">Your progress</h2>
							{progressError ? (
								<p role="alert" className="mt-3 text-sm text-rose-800">
									{progressError}
								</p>
							) : progress.length === 0 ? (
								<p className="mt-3 text-sm text-slate-600">
									No saved attempts yet.
								</p>
							) : (
								<ul className="mt-4 space-y-4">
									{progress.map((item) => (
										<li key={item.subject}>
											<div className="flex justify-between gap-3 text-sm">
												<span className="font-semibold">{item.subject}</span>
												<span>{item.completionPercentage}%</span>
											</div>
											<div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
												<div
													className="h-full rounded-full bg-emerald-600"
													style={{
														width: `${Math.min(item.completionPercentage, 100)}%`,
													}}
												/>
											</div>
											<p className="mt-1 text-xs text-slate-500">
												{item.questionsAttempted}/{item.questionCount} unique
												questions · {item.correct} correct attempts
											</p>
										</li>
									))}
								</ul>
							)}
						</section>

						<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
							<h2 className="text-lg font-bold">Review history</h2>
							{history.length === 0 ? (
								<p className="mt-3 text-sm text-slate-600">
									No saved answers to review yet.
								</p>
							) : (
								<ol className="mt-4 space-y-3">
									{history.slice(0, 5).map((attempt) => (
										<li
											key={attempt.id}
											className="rounded-2xl bg-slate-50 p-3"
										>
											<p className="text-sm font-semibold">{attempt.prompt}</p>
											<p
												className={`mt-1 text-xs font-bold ${
													attempt.correct
														? "text-emerald-700"
														: "text-amber-700"
												}`}
											>
												{attempt.correct ? "Correct" : "Needs review"}
											</p>
										</li>
									))}
								</ol>
							)}
						</section>
					</aside>
				</div>
			</div>
		</main>
	);
}
