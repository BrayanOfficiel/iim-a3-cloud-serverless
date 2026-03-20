import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../lib/api";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isRegister, setIsRegister] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);
		try {
			if (isRegister) {
				await apiFetch("/users", {
					method: "POST",
					body: JSON.stringify({ email, password, name }),
				});
				setIsRegister(false);
				setPassword("");
				setSuccess("Compte créé avec succes. Vous pouvez vous connecter.");
				return;
			}
			const data = await apiFetch<{ token: string }>("/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			});
			localStorage.setItem("token", data.token);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-surface flex items-center justify-center px-4">
			<div className="bg-surface-card border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md">
				<div className="flex items-center gap-3 mb-2">
					<div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
						<svg
							className="w-6 h-6 text-white"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 8.82l6 3.33v7.03l-6-3.33V8.82zm8 10.36V12.15l6-3.33v7.03l-6 3.33z" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-white">Hive</h1>
				</div>
				<p className="text-muted mb-6">
					{isRegister ? "Créer votre compte" : "Connectez-vous a votre espace"}
				</p>

				{error && (
					<div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg mb-4 text-sm">
						<svg
							className="w-4 h-4 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
							/>
						</svg>
						{error}
					</div>
				)}
				{success && (
					<div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-3 rounded-lg mb-4 text-sm">
						<svg
							className="w-4 h-4 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
						{success}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{isRegister && (
						<div>
							<label
								htmlFor="login-name"
								className="block text-sm text-neutral-300 mb-1"
							>
								Nom
							</label>
							<input
								id="login-name"
								type="text"
								placeholder="Jean Dupont"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full p-3 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none transition-colors"
								required
							/>
						</div>
					)}
					<div>
						<label
							htmlFor="login-email"
							className="block text-sm text-neutral-300 mb-1"
						>
							Adresse e-mail
						</label>
						<input
							id="login-email"
							type="email"
							placeholder="vous@exemple.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-3 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none transition-colors"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="login-password"
							className="block text-sm text-neutral-300 mb-1"
						>
							Mot de passe
						</label>
						<input
							id="login-password"
							type="password"
							placeholder="Min. 8 car., majuscule, minuscule, chiffre, special"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full p-3 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none transition-colors"
							required
							minLength={8}
						/>
						{isRegister && (
							<p className="text-neutral-500 text-xs mt-1">
								Minimum 8 caracteres, une majuscule, une minuscule, un chiffre
								et un caractere special
							</p>
						)}
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full p-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
					>
						{loading
							? "Chargement..."
							: isRegister
								? "Créer le compte"
								: "Se connecter"}
					</button>
				</form>
				<button
					type="button"
					onClick={() => {
						setIsRegister(!isRegister);
						setError("");
						setSuccess("");
					}}
					className="mt-4 text-accent hover:text-accent-hover text-sm transition-colors"
				>
					{isRegister
						? "Deja un compte ? Se connecter"
						: "Pas encore de compte ? S'inscrire"}
				</button>
			</div>
		</div>
	);
}
