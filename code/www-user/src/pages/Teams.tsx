import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";

interface Team {
	id: string;
	name: string;
	createdAt: string;
}

export default function Teams() {
	const [teams, setTeams] = useState<Team[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [newName, setNewName] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		loadTeams();
	}, []);

	async function loadTeams() {
		const data = await apiFetch<Team[]>("/teams");
		setTeams(data);
	}

	async function createTeam(e: React.FormEvent) {
		e.preventDefault();
		if (!newName.trim()) return;
		setLoading(true);
		try {
			await apiFetch("/teams", {
				method: "POST",
				body: JSON.stringify({ name: newName.trim() }),
			});
			setNewName("");
			setShowForm(false);
			await loadTeams();
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Mes équipes</h1>
				<button
					type="button"
					onClick={() => setShowForm(!showForm)}
					className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
				>
					{showForm ? (
						"Annuler"
					) : (
						<>
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
									d="M12 4.5v15m7.5-7.5h-15"
								/>
							</svg>
							Nouvelle équipe
						</>
					)}
				</button>
			</div>

			{showForm && (
				<form
					onSubmit={createTeam}
					className="bg-surface-card border border-border rounded-xl p-4 mb-6 flex gap-3"
				>
					<input
						type="text"
						placeholder="Nom de l'équipe"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						className="flex-1 px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
						required
					/>
					<button
						type="submit"
						disabled={loading}
						className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
					>
						{loading ? "Creation..." : "Créer"}
					</button>
				</form>
			)}

			{teams.length === 0 ? (
				<div className="bg-surface-card rounded-xl p-8 border border-border text-center">
					<svg
						className="w-12 h-12 text-neutral-700 mx-auto mb-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={1}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
						/>
					</svg>
					<p className="text-muted">
						Aucune équipe. Cliquez sur "Nouvelle équipe" pour commencer.
					</p>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{teams.map((team) => (
						<Link
							key={team.id}
							to={`/teams/${team.id}`}
							className="bg-surface-card p-5 rounded-xl border border-border hover:border-accent transition-colors group"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold shrink-0">
									{team.name[0].toUpperCase()}
								</div>
								<h3 className="font-medium text-lg group-hover:text-accent transition-colors truncate">
									{team.name}
								</h3>
							</div>
							<p className="text-sm text-muted">
								Créée le {new Date(team.createdAt).toLocaleDateString("fr-FR")}
							</p>
							<div className="flex items-center gap-1 text-xs text-accent mt-3">
								Voir l'équipe
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
									/>
								</svg>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
