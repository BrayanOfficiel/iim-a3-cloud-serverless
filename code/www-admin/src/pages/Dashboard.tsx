import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Stats {
	users: number;
	teams: number;
	projects: number;
	tasks: number;
}

export default function Dashboard() {
	const [stats, setStats] = useState<Stats | null>(null);

	useEffect(() => {
		api<Stats>("/admin/stats").then(setStats).catch(console.error);
	}, []);

	const statCards = stats
		? [
				{ label: "Utilisateurs", value: stats.users },
				{ label: "Équipes", value: stats.teams },
				{ label: "Projets", value: stats.projects },
				{ label: "Tâches", value: stats.tasks },
			]
		: [];

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{statCards.map((card) => (
					<div
						key={card.label}
						className="bg-slate-900 rounded-xl border border-slate-800 p-5 text-center"
					>
						<p className="text-3xl font-bold text-amber-500">{card.value}</p>
						<p className="text-sm text-slate-400 mt-1">{card.label}</p>
					</div>
				))}
			</div>
		</div>
	);
}
