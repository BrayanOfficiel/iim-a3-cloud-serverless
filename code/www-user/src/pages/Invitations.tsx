import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Invitation {
	id: string;
	teamId: string;
	teamName: string | null;
	invitedEmail: string;
	invitedBy: string;
	status: "pending" | "accepted" | "refused";
	createdAt: string;
}

export default function Invitations() {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadInvitations();
	}, []);

	async function loadInvitations() {
		try {
			const data = await apiFetch<Invitation[]>("/invitations");
			setInvitations(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function respond(id: string, action: "accept" | "reject") {
		try {
			await apiFetch(`/invitations/${id}/${action}`, { method: "POST" });
			await loadInvitations();
		} catch (err) {
			console.error(err);
		}
	}

	const pending = invitations.filter((i) => i.status === "pending");
	const past = invitations.filter((i) => i.status !== "pending");

	if (loading) {
		return (
			<div>
				<h1 className="text-2xl font-bold mb-6">Invitations</h1>
				<p className="text-muted">Chargement...</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Invitations</h1>

			<h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
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
						d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					/>
				</svg>
				En attente ({pending.length})
			</h2>
			{pending.length === 0 ? (
				<div className="bg-surface-card rounded-xl p-6 border border-border mb-8">
					<p className="text-muted text-sm">Aucune invitation en attente.</p>
				</div>
			) : (
				<div className="space-y-3 mb-8">
					{pending.map((inv) => (
						<div
							key={inv.id}
							className="bg-surface-card rounded-xl border border-border p-4 flex items-center justify-between gap-4"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
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
								<div>
									<p className="text-sm font-medium">
										{inv.teamName ?? "Equipe"}
									</p>
									<p className="text-xs text-muted mt-0.5">
										Recue le{" "}
										{new Date(inv.createdAt).toLocaleDateString("fr-FR")}
									</p>
								</div>
							</div>
							<div className="flex gap-2 shrink-0">
								<button
									type="button"
									onClick={() => respond(inv.id, "accept")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
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
									Accepter
								</button>
								<button
									type="button"
									onClick={() => respond(inv.id, "reject")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-neutral-800 border border-border rounded-lg text-sm transition-colors"
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
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
									Refuser
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{past.length > 0 && (
				<>
					<h2 className="text-lg font-semibold mb-3">Historique</h2>
					<div className="space-y-2">
						{past.map((inv) => (
							<div
								key={inv.id}
								className="bg-surface-card/50 rounded-xl border border-border p-4 flex items-center justify-between"
							>
								<div>
									<p className="text-sm">{inv.teamName ?? "Equipe"}</p>
									<p className="text-xs text-muted mt-0.5">
										{new Date(inv.createdAt).toLocaleDateString("fr-FR")}
									</p>
								</div>
								<span
									className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
										inv.status === "accepted"
											? "bg-emerald-900/50 text-emerald-400"
											: "bg-red-900/50 text-red-400"
									}`}
								>
									{inv.status === "accepted" ? (
										<>
											<svg
												className="w-3 h-3"
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
											Acceptee
										</>
									) : (
										<>
											<svg
												className="w-3 h-3"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6 18 18 6M6 6l12 12"
												/>
											</svg>
											Refusee
										</>
									)}
								</span>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
