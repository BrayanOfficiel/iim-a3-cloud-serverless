import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { apiFetch } from "../lib/api";

interface Member {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function TeamDetail() {
  const { teamId } = useParams();
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
    const [m, p] = await Promise.all([
      apiFetch<Member[]>(`/teams/${teamId}/members`),
      apiFetch<Project[]>(`/projects/team/${teamId}`),
    ]);
    setMembers(m);
    setProjects(p);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus(null);
    try {
      await apiFetch("/invitations", {
        method: "POST",
        body: JSON.stringify({ teamId, email: inviteEmail }),
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
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
          description: projectDesc || null,
          teamId,
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
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        &larr; Retour aux equipes
      </Link>

      <h1 className="text-2xl font-bold mt-3 mb-6">Equipe</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche : Membres */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Membres ({members.length})</h2>
              <button
                type="button"
                onClick={() => setShowInvite(!showInvite)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                {showInvite ? "Fermer" : "+ Inviter"}
              </button>
            </div>

            {showInvite && (
              <form onSubmit={invite} className="mb-4 space-y-2">
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Envoyer l'invitation
                </button>
                {inviteStatus && (
                  <p
                    className={`text-xs p-2 rounded ${
                      inviteStatus.type === "success"
                        ? "text-green-400 bg-green-400/10"
                        : "text-red-400 bg-red-400/10"
                    }`}
                  >
                    {inviteStatus.msg}
                  </p>
                )}
              </form>
            )}

            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
                    {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.name ?? "Membre"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colonne droite : Projets */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              Projets ({projects.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowNewProject(!showNewProject)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              {showNewProject ? "Annuler" : "Nouveau projet"}
            </button>
          </div>

          {showNewProject && (
            <form
              onSubmit={createProject}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Nom du projet"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                Creer le projet
              </button>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
              <p className="text-slate-400">
                Aucun projet dans cette equipe. Creez-en un pour commencer a
                gerer vos taches.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors group"
                >
                  <h3 className="font-medium group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-indigo-400 mt-3">
                    Ouvrir le kanban &rarr;
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
