import {
	Show,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/tanstack-react-start";

export default function HeaderUser() {
	return (
		<div className="header-account">
			<Show when="signed-in">
				<span className="account-label">Your account</span>
				<UserButton />
			</Show>
			<Show when="signed-out">
				<SignInButton
					mode="modal"
					fallbackRedirectUrl="/subjects/grade-7-mathematics"
				>
					<button type="button" className="header-sign-in">
						Sign in
					</button>
				</SignInButton>
				<SignUpButton
					mode="modal"
					fallbackRedirectUrl="/subjects/grade-7-mathematics"
				>
					<button type="button" className="header-sign-up">
						Get started
					</button>
				</SignUpButton>
			</Show>
		</div>
	);
}
