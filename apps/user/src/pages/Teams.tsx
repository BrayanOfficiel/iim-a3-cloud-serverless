import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";

interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    const data = await apiFetch<Team[]>("/teams");
    setTeams(data);
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/teams", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      setShowForm(false);
      await loadTeams();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes equipes</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Annuler" : "Nouvelle equipe"}
        </button>
      </div>

      {/* Formulaire creation */}
      {showForm && (
        <form
          onSubmit={createTeam}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex gap-3"
        >
          <input
            type="text"
            placeholder="Nom de l'equipe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Creation..." : "Creer"}
          </button>
        </form>
      )}

      {/* Liste */}
      {teams.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <p className="text-slate-400">
            Aucune equipe. Cliquez sur "Nouvelle equipe" pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors group"
            >
              <h3 className="font-medium text-lg group-hover:text-indigo-400 transition-colors">
                {team.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Creee le{" "}
                {new Date(team.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-xs text-indigo-400 mt-3">
                Voir l'equipe &rarr;
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
