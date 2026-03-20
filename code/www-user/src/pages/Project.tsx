import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiFetch } from "../lib/api";

interface Task {
	id: string;
	name: string;
	description: string | null;
	status: "todo" | "in_progress" | "done";
	assigneeId: string | null;
	createdAt: string;
}

interface ProjectInfo {
	id: string;
	name: string;
	description: string | null;
	teamId: string;
}

const COLUMNS: {
	key: Task["status"];
	label: string;
	color: string;
	icon: JSX.Element;
}[] = [
	{
		key: "todo",
		label: "A faire",
		color: "border-t-neutral-500",
		icon: (
			<svg
				className="w-4 h-4 text-neutral-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				/>
			</svg>
		),
	},
	{
		key: "in_progress",
		label: "En cours",
		color: "border-t-amber-500",
		icon: (
			<svg
				className="w-4 h-4 text-amber-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
				/>
			</svg>
		),
	},
	{
		key: "done",
		label: "Termine",
		color: "border-t-emerald-500",
		icon: (
			<svg
				className="w-4 h-4 text-emerald-400"
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
		),
	},
];

export default function Project() {
	const { projectId } = useParams();
	const [project, setProject] = useState<ProjectInfo | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [newTaskName, setNewTaskName] = useState("");
	const [newTaskDesc, setNewTaskDesc] = useState("");
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [editingTask, setEditingTask] = useState<Task | null>(null);

	useEffect(() => {
		if (!projectId) return;
		loadData();
	}, [projectId]);

	async function loadData() {
		const [p, t] = await Promise.all([
			apiFetch<ProjectInfo>(`/projects/${projectId}`),
			apiFetch<Task[]>(`/projects/${projectId}/tasks`),
		]);
		setProject(p);
		setTasks(t);
	}

	async function createTask(e: React.FormEvent) {
		e.preventDefault();
		try {
			await apiFetch(`/projects/${projectId}/tasks`, {
				method: "POST",
				body: JSON.stringify({
					name: newTaskName,
					description: newTaskDesc || null,
				}),
			});
			setNewTaskName("");
			setNewTaskDesc("");
			setShowForm(false);
			await loadData();
		} catch (err) {
			console.error(err);
		}
	}

	async function moveTask(taskId: string, newStatus: Task["status"]) {
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
		);
		try {
			await apiFetch(`/tasks/${taskId}`, {
				method: "PATCH",
				body: JSON.stringify({ status: newStatus }),
			});
		} catch {
			await loadData();
		}
	}

	async function deleteTask(taskId: string) {
		try {
			await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
			setTasks((prev) => prev.filter((t) => t.id !== taskId));
			setEditingTask(null);
		} catch (err) {
			console.error(err);
		}
	}

	async function updateTask(e: React.FormEvent) {
		e.preventDefault();
		if (!editingTask) return;
		try {
			await apiFetch(`/tasks/${editingTask.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					name: editingTask.name,
					description: editingTask.description,
				}),
			});
			setEditingTask(null);
			await loadData();
		} catch (err) {
			console.error(err);
		}
	}

	function handleDragStart(taskId: string) {
		setDraggedId(taskId);
	}

	function handleDrop(status: Task["status"]) {
		if (draggedId) {
			moveTask(draggedId, status);
			setDraggedId(null);
		}
	}

	const tasksByStatus = (status: Task["status"]) =>
		tasks.filter((t) => t.status === status);

	return (
		<div>
			{project && (
				<Link
					to={`/teams/${project.teamId}`}
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
					Retour a l'équipe
				</Link>
			)}

			<div className="flex items-center justify-between mt-3 mb-6">
				<div>
					<h1 className="text-2xl font-bold">{project?.name ?? "..."}</h1>
					{project?.description && (
						<p className="text-muted text-sm mt-1">{project.description}</p>
					)}
				</div>
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
							Nouvelle tâche
						</>
					)}
				</button>
			</div>

			{showForm && (
				<form
					onSubmit={createTask}
					className="bg-surface-card border border-border rounded-xl p-4 mb-6 space-y-3"
				>
					<input
						type="text"
						placeholder="Nom de la tâche"
						value={newTaskName}
						onChange={(e) => setNewTaskName(e.target.value)}
						className="w-full px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
						required
					/>
					<input
						type="text"
						placeholder="Description (optionnel)"
						value={newTaskDesc}
						onChange={(e) => setNewTaskDesc(e.target.value)}
						className="w-full px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
					>
						Ajouter la tâche
					</button>
				</form>
			)}

			{editingTask && (
				<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
					<div className="bg-surface-card rounded-xl border border-border p-6 w-full max-w-md">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<svg
								className="w-5 h-5 text-muted"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
								/>
							</svg>
							Modifier la tâche
						</h3>
						<form onSubmit={updateTask} className="space-y-3">
							<input
								type="text"
								value={editingTask.name}
								onChange={(e) =>
									setEditingTask({ ...editingTask, name: e.target.value })
								}
								className="w-full px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm transition-colors"
								required
							/>
							<textarea
								value={editingTask.description ?? ""}
								onChange={(e) =>
									setEditingTask({
										...editingTask,
										description: e.target.value || null,
									})
								}
								placeholder="Description"
								rows={3}
								className="w-full px-3 py-2 bg-surface-elevated text-white rounded-lg border border-border focus:border-accent focus:outline-none text-sm resize-none transition-colors"
							/>
							<div className="flex gap-2 justify-between">
								<button
									type="button"
									onClick={() => deleteTask(editingTask.id)}
									className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
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
											d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
										/>
									</svg>
									Supprimer
								</button>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setEditingTask(null)}
										className="px-3 py-2 bg-surface-elevated hover:bg-neutral-800 border border-border rounded-lg text-sm transition-colors"
									>
										Annuler
									</button>
									<button
										type="submit"
										className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
									>
										Enregistrer
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{COLUMNS.map((col) => (
					<div
						key={col.key}
						onDragOver={(e) => e.preventDefault()}
						onDrop={() => handleDrop(col.key)}
						className={`bg-surface-card rounded-xl border border-border border-t-2 ${col.color} min-h-[200px]`}
					>
						<div className="p-3 border-b border-border">
							<h3 className="font-medium text-sm flex items-center justify-between">
								<span className="flex items-center gap-2">
									{col.icon}
									{col.label}
								</span>
								<span className="text-xs text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
									{tasksByStatus(col.key).length}
								</span>
							</h3>
						</div>
						<div className="p-2 space-y-2">
							{tasksByStatus(col.key).map((task) => (
								<div
									key={task.id}
									draggable
									onDragStart={() => handleDragStart(task.id)}
									onClick={() => setEditingTask(task)}
									onKeyDown={() => {}}
									className="bg-surface-elevated p-3 rounded-lg border border-border hover:border-neutral-600 cursor-grab active:cursor-grabbing transition-colors"
								>
									<p className="text-sm font-medium">{task.name}</p>
									{task.description && (
										<p className="text-xs text-muted mt-1 line-clamp-2">
											{task.description}
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
