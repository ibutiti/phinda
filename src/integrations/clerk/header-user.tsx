import {
	Show,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/tanstack-react-start";

export default function HeaderUser() {
	return (
		<div className="flex items-center gap-3">
			<Show when="signed-in">
				<UserButton />
			</Show>
			<Show when="signed-out">
				<SignInButton
					mode="modal"
					fallbackRedirectUrl="/subjects/grade-7-mathematics"
				>
					<button
						type="button"
						className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
					>
						Sign in
					</button>
				</SignInButton>
				<SignUpButton
					mode="modal"
					fallbackRedirectUrl="/subjects/grade-7-mathematics"
				>
					<button
						type="button"
						className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
					>
						Get started
					</button>
				</SignUpButton>
			</Show>
		</div>
	);
}
