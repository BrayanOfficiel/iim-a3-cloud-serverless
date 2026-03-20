import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";

interface Team {
	id: string;
	name: string;
	createdAt: string;
}

interface Invitation {
	id: string;
	teamId: string;
	invitedEmail: string;
	status: string;
}

export default function Dashboard() {
	const [teams, setTeams] = useState<Team[]>([]);
	const [invitations, setInvitations] = useState<Invitation[]>([]);

	useEffect(() => {
		apiFetch<Team[]>("/teams").then(setTeams).catch(console.error);
		apiFetch<Invitation[]>("/invitations")
			.then(setInvitations)
			.catch(console.error);
	}, []);

	const pendingCount = invitations.filter((i) => i.status === "pending").length;

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
				<div className="bg-surface-card rounded-xl p-5 border border-border">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
							<svg
								className="w-5 h-5 text-accent"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
								/>
							</svg>
						</div>
					</div>
					<p className="text-3xl font-bold text-white">{teams.length}</p>
					<p className="text-sm text-muted mt-1">
						{teams.length > 1 ? "Equipes" : "Equipe"}
					</p>
				</div>

				<Link
					to="/invitations"
					className="bg-surface-card rounded-xl p-5 border border-border hover:border-accent transition-colors group"
				>
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
							<svg
								className="w-5 h-5 text-amber-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
								/>
							</svg>
						</div>
					</div>
					<p className="text-3xl font-bold text-white">{pendingCount}</p>
					<p className="text-sm text-muted mt-1">
						{pendingCount > 1
							? "Invitations en attente"
							: "Invitation en attente"}
					</p>
				</Link>

				<Link
					to="/teams"
					className="bg-surface-card rounded-xl p-5 border border-border hover:border-accent transition-colors flex flex-col items-center justify-center gap-2 group"
				>
					<div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
						<svg
							className="w-6 h-6 text-accent"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 4.5v15m7.5-7.5h-15"
							/>
						</svg>
					</div>
					<span className="text-accent font-medium text-sm">
						Creer une equipe
					</span>
				</Link>
			</div>

			<h2 className="text-lg font-semibold mb-3">Mes equipes</h2>
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
					<p className="text-muted mb-4">
						Vous n'appartenez a aucune equipe pour le moment.
					</p>
					<Link
						to="/teams"
						className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
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
								d="M12 4.5v15m7.5-7.5h-15"
							/>
						</svg>
						Creer ma premiere equipe
					</Link>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{teams.map((team) => (
						<Link
							key={team.id}
							to={`/teams/${team.id}`}
							className="bg-surface-card p-4 rounded-xl border border-border hover:border-accent transition-colors group"
						>
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-sm font-bold shrink-0">
									{team.name[0].toUpperCase()}
								</div>
								<div className="min-w-0">
									<h3 className="font-medium truncate group-hover:text-accent transition-colors">
										{team.name}
									</h3>
									<p className="text-xs text-muted mt-0.5">
										{new Date(team.createdAt).toLocaleDateString("fr-FR")}
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
