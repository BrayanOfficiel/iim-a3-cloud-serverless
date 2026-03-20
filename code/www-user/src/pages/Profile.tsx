import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { apiFetch } from "../lib/api";

export default function Profile() {
	const { user, refreshUser } = useUser();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		if (user) {
			setName(user.name);
		}
	}, [user]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setMessage(null);
		try {
			await apiFetch("/me", {
				method: "PATCH",
				body: JSON.stringify({ name }),
			});
			await refreshUser();
			setMessage({ type: "success", text: "Profil mis a jour" });
		} catch (err) {
			setMessage({
				type: "error",
				text: err instanceof Error ? err.message : "Erreur",
			});
		} finally {
			setSaving(false);
		}
	}

	if (!user) {
		return (
			<div>
				<h1 className="text-2xl font-bold mb-6">Mon profil</h1>
				<p className="text-muted">Chargement...</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Mon profil</h1>

			<div className="max-w-lg">
				<div className="bg-surface-card rounded-xl border border-border p-6">
					<div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
						<div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xl font-bold">
							{user.name[0].toUpperCase()}
						</div>
						<div>
							<p className="font-semibold text-lg">{user.name}</p>
							<p className="text-sm text-muted">{user.email}</p>
						</div>
					</div>

					<form onSubmit={handleSave} className="space-y-4">
						<div>
							<label
								htmlFor="profile-name"
								className="block text-sm text-neutral-300 mb-1"
							>
								Nom
							</label>
							<input
								id="profile-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="profile-email"
								className="block text-sm text-neutral-300 mb-1"
							>
								Adresse e-mail
							</label>
							<input
								id="profile-email"
								type="email"
								value={user.email}
								disabled
								className="w-full px-3 py-2 bg-surface/50 text-neutral-500 rounded-lg border border-border text-sm cursor-not-allowed"
							/>
							<p className="text-xs text-neutral-600 mt-1">
								L'adresse e-mail ne peut pas etre modifiee.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="block text-sm text-neutral-300 mb-1">
									Role
								</span>
								<div className="flex items-center gap-2">
									<svg
										className="w-4 h-4 text-muted"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
										/>
									</svg>
									<p className="text-sm text-muted">
										{user.role === "admin" ? "Administrateur" : "Utilisateur"}
									</p>
								</div>
							</div>
							<div>
								<span className="block text-sm text-neutral-300 mb-1">
									Membre depuis
								</span>
								<div className="flex items-center gap-2">
									<svg
										className="w-4 h-4 text-muted"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
										/>
									</svg>
									<p className="text-sm text-muted">
										{new Date(user.createdAt).toLocaleDateString("fr-FR", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
						</div>

						{message && (
							<div
								className={`flex items-center gap-2 text-sm p-3 rounded-lg ${message.type === "success" ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}
							>
								{message.type === "success" ? (
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
								) : (
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
								)}
								{message.text}
							</div>
						)}

						<button
							type="submit"
							disabled={saving || name === user.name}
							className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m4.5 12.75 6 6 9-13.5"
								/>
							</svg>
							{saving ? "Enregistrement..." : "Enregistrer"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
