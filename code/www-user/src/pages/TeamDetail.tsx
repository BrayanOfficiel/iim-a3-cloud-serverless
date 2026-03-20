import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useUser } from "../context/UserContext";
import { apiFetch } from "../lib/api";

interface Member {
	id: string;
	name?: string;
	email?: string;
	joinedAt: string;
}

interface Team {
	id: string;
	name: string;
	createdBy: string;
}

interface Project {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
}

export default function TeamDetail() {
	const { teamId } = useParams();
	const { user } = useUser();
	const [team, setTeam] = useState<Team | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteStatus, setInviteStatus] = useState<{
		type: "success" | "error";
		msg: string;
	} | null>(null);
	const [showInvite, setShowInvite] = useState(false);
	const [showNewProject, setShowNewProject] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [projectDesc, setProjectDesc] = useState("");

	useEffect(() => {
		if (!teamId) return;
		loadData();
	}, [teamId]);

	async function loadData() {
		const [t, m, p] = await Promise.all([
			apiFetch<Team>(`/teams/${teamId}`),
			apiFetch<Member[]>(`/teams/${teamId}/members`),
			apiFetch<Project[]>(`/teams/${teamId}/projects`),
		]);
		setTeam(t);
		setMembers(m);
		setProjects(p);
	}

	const isCreator = user && team && user.id === team.createdBy;

	async function removeMember(memberId: string) {
		try {
			await apiFetch(`/teams/${teamId}/members/${memberId}`, {
				method: "DELETE",
			});
			await loadData();
		} catch (err) {
			console.error(err);
		}
	}

	async function invite(e: React.FormEvent) {
		e.preventDefault();
		setInviteStatus(null);
		try {
			await apiFetch(`/teams/${teamId}/invitations`, {
				method: "POST",
				body: JSON.stringify({ email: inviteEmail }),
			});
			setInviteStatus({ type: "success", msg: "Invitation envoyee" });
			setInviteEmail("");
		} catch (err) {
			setInviteStatus({
				type: "error",
				msg: err instanceof Error ? err.message : "Erreur",
			});
		}
	}

	async function createProject(e: React.FormEvent) {
		e.preventDefault();
		try {
			await apiFetch(`/teams/${teamId}/projects`, {
				method: "POST",
				body: JSON.stringify({
					name: projectName,
					description: projectDesc || null,
				}),
			});
			setProjectName("");
			setProjectDesc("");
			setShowNewProject(false);
			await loadData();
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div>
			<Link
				to="/teams"
				className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors"
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
						d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
					/>
				</svg>
				Retour aux equipes
			</Link>

			<h1 className="text-2xl font-bold mt-3 mb-6">{team?.name ?? "Equipe"}</h1>

			<div className="grid gap-6 lg:grid-cols-3 items-start">
				<div className="lg:col-span-1 bg-surface-card rounded-xl border border-border p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold flex items-center gap-2">
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
									d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
								/>
							</svg>
							Membres ({members.length})
						</h2>
						<button
							type="button"
							onClick={() => setShowInvite(!showInvite)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
						>
							{showInvite ? (
								"Annuler"
							) : (
								<>
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
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
									Inviter
								</>
							)}
						</button>
					</div>

					{showInvite && (
						<form
							onSubmit={invite}
							className="bg-surface-elevated border border-border rounded-lg p-4 mb-4 space-y-3"
						>
							<input
								type="email"
								placeholder="email@exemple.com"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
								className="w-full px-3 py-2 bg-surface text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
								required
							/>
							<button
								type="submit"
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
										d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
									/>
								</svg>
								Envoyer l'invitation
							</button>
							{inviteStatus && (
								<p
									className={`text-xs p-2 rounded ${inviteStatus.type === "success" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}
								>
									{inviteStatus.msg}
								</p>
							)}
						</form>
					)}

					<div className="space-y-2">
						{members.map((m) => (
							<div
								key={m.id}
								className="flex items-center gap-3 bg-surface-elevated p-3 rounded-lg border border-border"
							>
								<div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium shrink-0">
									{(m.name ?? m.email ?? "?")[0].toUpperCase()}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">
										{m.name ?? "Membre"}
									</p>
									<p className="text-xs text-muted truncate">{m.email}</p>
								</div>
								{isCreator && m.id !== user?.id && (
									<button
										type="button"
										onClick={() => removeMember(m.id)}
										className="text-xs text-red-400 hover:text-red-300 shrink-0"
									>
										Retirer
									</button>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="lg:col-span-2 bg-surface-card rounded-xl border border-border p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold flex items-center gap-2">
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
									d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
								/>
							</svg>
							Projets ({projects.length})
						</h2>
						<button
							type="button"
							onClick={() => setShowNewProject(!showNewProject)}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
						>
							{showNewProject ? (
								"Annuler"
							) : (
								<>
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
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
									Nouveau projet
								</>
							)}
						</button>
					</div>

					{showNewProject && (
						<form
							onSubmit={createProject}
							className="bg-surface-elevated border border-border rounded-lg p-4 mb-4 space-y-3"
						>
							<input
								type="text"
								placeholder="Nom du projet"
								value={projectName}
								onChange={(e) => setProjectName(e.target.value)}
								className="w-full px-3 py-2 bg-surface text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
								required
							/>
							<input
								type="text"
								placeholder="Description (optionnel)"
								value={projectDesc}
								onChange={(e) => setProjectDesc(e.target.value)}
								className="w-full px-3 py-2 bg-surface text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
							/>
							<button
								type="submit"
								className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
							>
								Creer le projet
							</button>
						</form>
					)}

					{projects.length === 0 ? (
						<div className="text-center py-8">
							<svg
								className="w-12 h-12 text-neutral-700 mx-auto mb-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
								/>
							</svg>
							<p className="text-muted text-sm">
								Aucun projet. Creez-en un pour commencer.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{projects.map((project) => (
								<Link
									key={project.id}
									to={`/projects/${project.id}`}
									className="block bg-surface-elevated p-4 rounded-lg border border-border hover:border-accent transition-colors group"
								>
									<div className="flex items-center justify-between">
										<h3 className="font-medium group-hover:text-accent transition-colors">
											{project.name}
										</h3>
										<svg
											className="w-4 h-4 text-muted group-hover:text-accent transition-colors"
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
									{project.description && (
										<p className="text-sm text-muted mt-1 line-clamp-2">
											{project.description}
										</p>
									)}
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
