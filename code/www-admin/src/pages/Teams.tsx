import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";

interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    const data = await api<Team[]>("/admin/teams");
    setTeams(data);
  }

  async function deleteTeam(id: string, name: string) {
    if (!confirm(`Supprimer l'equipe "${name}" et tous ses projets/taches ? Cette action est irreversible.`)) return;
    try {
      await api(`/admin/teams/${id}`, { method: "DELETE" });
      await loadTeams();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Equipes ({teams.length})</h1>

      {teams.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
          <p className="text-slate-400">Aucune equipe.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Creee le</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <Link
                      to={`/teams/${team.id}`}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(team.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      to={`/teams/${team.id}`}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Gerer
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteTeam(team.id, team.name)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
