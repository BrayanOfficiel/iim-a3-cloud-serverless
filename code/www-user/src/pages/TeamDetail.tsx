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
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        &larr; Retour aux equipes
      </Link>

      <h1 className="text-2xl font-bold mt-3 mb-6">{team?.name ?? "Equipe"}</h1>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Colonne gauche : Membres */}
        <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Membres ({members.length})</h2>
            <button
              type="button"
              onClick={() => setShowInvite(!showInvite)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              {showInvite ? "Annuler" : "Inviter"}
            </button>
          </div>

          {showInvite && (
            <form
              onSubmit={invite}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4 space-y-3"
            >
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
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

          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-slate-700/50 p-4 rounded-lg border border-slate-600"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium shrink-0">
                  {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {m.name ?? "Membre"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
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

        {/* Colonne droite : Projets */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Projets ({projects.length})</h2>
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
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Nom du projet"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                required
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
            <p className="text-slate-400 text-sm text-center py-6">
              Aucun projet dans cette equipe. Creez-en un pour commencer.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-indigo-500 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <span className="text-xs text-indigo-400">
                      Ouvrir &rarr;
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
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
