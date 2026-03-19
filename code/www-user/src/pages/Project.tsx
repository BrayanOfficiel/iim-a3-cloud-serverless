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

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "A faire", color: "border-slate-500" },
  { key: "in_progress", label: "En cours", color: "border-amber-500" },
  { key: "done", label: "Termine", color: "border-green-500" },
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
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      await loadData(); // Rollback
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
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          &larr; Retour a l'equipe
        </Link>
      )}

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project?.name ?? "..."}</h1>
          {project?.description && (
            <p className="text-slate-400 text-sm mt-1">{project.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Annuler" : "Nouvelle tache"}
        </button>
      </div>

      {/* Formulaire creation tache */}
      {showForm && (
        <form
          onSubmit={createTask}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 space-y-3"
        >
          <input
            type="text"
            placeholder="Nom de la tache"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
            required
          />
          <input
            type="text"
            placeholder="Description (optionnel)"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            Ajouter la tache
          </button>
        </form>
      )}

      {/* Modal edition tache */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Modifier la tache</h3>
            <form onSubmit={updateTask} className="space-y-3">
              <input
                type="text"
                value={editingTask.name}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
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
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm resize-none"
              />
              <div className="flex gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => deleteTask(editingTask.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
                >
                  Supprimer
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className={`bg-slate-800/50 rounded-xl border-t-2 ${col.color} min-h-[200px]`}
          >
            <div className="p-3 border-b border-slate-700">
              <h3 className="font-medium text-sm flex items-center justify-between">
                {col.label}
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
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
                  className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-slate-500 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <p className="text-sm font-medium">{task.name}</p>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Boutons de deplacement rapide sur mobile */}
      <div className="md:hidden mt-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-xs text-slate-400 mb-2">
          Astuce : sur ordinateur, glissez-deposez les taches entre les
          colonnes. Sur mobile, cliquez sur une tache pour la modifier.
        </p>
      </div>
    </div>
  );
}
