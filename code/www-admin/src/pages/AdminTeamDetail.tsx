import {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {api} from "../lib/api";

interface Team {
    id: string;
    name: string;
    createdBy: string;
    createdAt: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

export default function AdminTeamDetail() {
    const {teamId} = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [addNewMember, setAddNewMember] = useState(false);
    const [addNewMemberStatus, setAddNewMemberStatus] = useState<{
        type: "success" | "error";
        msg: string;
    } | null>(null);

    useEffect(() => {
        if (!teamId) return;
        loadData();
    }, [teamId]);

    async function loadData() {
        const [t, m, p] = await Promise.all([
            api<Team>(`/admin/teams/${teamId}`),
            api<Member[]>(`/admin/teams/${teamId}/members`),
            api<Project[]>(`/admin/teams/${teamId}/projects`),
        ]);
        setTeam(t);
        setEditName(t.name);
        setMembers(m);
        setProjects(p);
    }

    async function saveTeamName(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api(`/admin/teams/${teamId}`, {
                method: "PATCH",
                body: JSON.stringify({name: editName}),
            });
            setEditing(false);
            await loadData();
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteTeam() {
        if (!confirm("Supprimer cette équipe et tous ses projets/tâches ?")) return;
        try {
            await api(`/admin/teams/${teamId}`, {method: "DELETE"});
            navigate("/teams");
        } catch (err) {
            console.error(err);
        }
    }

    async function addMember(email: string) {
        try {
            await api(`/admin/teams/${teamId}/members`, {
                method: "POST",
                body: JSON.stringify({email}),
            });
            await loadData();
        } catch (err) {
            console.error(err);
        }
    }

    async function removeMember(userId: string) {
        try {
            await api(`/admin/teams/${teamId}/members/${userId}`, {
                method: "DELETE",
            });
            await loadData();
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteProject(projectId: string, name: string) {
        if (!confirm(`Supprimer le projet "${name}" et toutes ses tâches ?`))
            return;
        try {
            await api(`/admin/projects/${projectId}`, {method: "DELETE"});
            await loadData();
        } catch (err) {
            console.error(err);
        }
    }

    if (!team) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Chargement...</h1>
            </div>
        );
    }
    return (
        <div>
            <Link
                to="/teams"
                className="text-sm text-slate-400 hover:text-white transition-colors"
            >
                &larr; Retour aux équipes
            </Link>

            {/* Header équipe */}
            <div className="flex items-center justify-between mt-3 mb-6">
                {editing ? (
                    <form onSubmit={saveTeamName} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-amber-500 focus:outline-none text-lg font-bold"
                            required
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(false);
                                setEditName(team.name);
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                        >
                            Annuler
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{team.name}</h1>
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="text-xs text-slate-400 hover:text-white"
                        >
                            Modifier
                        </button>
                    </div>
                )}
                <button
                    type="button"
                    onClick={deleteTeam}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
                >
                    Supprimer l'équipe
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
                {/* Membres */}
                <div className="lg:col-span-1 bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Membres ({members.length})</h2>
                        <button
                            type="button"
                            onClick={() => setAddNewMember(!addNewMember)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 cursor-pointer rounded-lg text-sm font-medium transition-colors"
                        >
                            {addNewMember ? "Annuler" : "Ajouter"}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {members.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                            >
                                <div
                                    className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-sm font-medium shrink-0">
                                    {m.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{m.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMember(m.id)}
                                    className="text-xs text-red-400 hover:text-red-300 shrink-0"
                                >
                                    Retirer
                                </button>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">
                                Aucun membre.
                            </p>
                        )}
                    </div>
                </div>

                {/* Projets */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h2 className="font-semibold mb-4">Projets ({projects.length})</h2>
                    {projects.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">
                            Aucun projet dans cette équipe.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                                >
                                    <div>
                                        <p className="font-medium">{project.name}</p>
                                        {project.description && (
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                                                {project.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => deleteProject(project.id, project.name)}
                                        className="text-xs text-red-400 hover:text-red-300 shrink-0 ml-3"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
