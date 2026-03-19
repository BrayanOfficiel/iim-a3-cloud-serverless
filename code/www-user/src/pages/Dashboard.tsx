import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../lib/api";

interface Team {
  id: string;
  name: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  teamId: string;
  invitedEmail: string;
  status: string;
}

export default function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    apiFetch<Team[]>("/teams").then(setTeams).catch(console.error);
    apiFetch<Invitation[]>("/invitations").then(setInvitations).catch(console.error);
  }, []);

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <p className="text-3xl font-bold text-indigo-400">{teams.length}</p>
          <p className="text-sm text-slate-400 mt-1">
            {teams.length > 1 ? "Equipes" : "Equipe"}
          </p>
        </div>
        <Link
          to="/invitations"
          className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-indigo-500 transition-colors"
        >
          <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-sm text-slate-400 mt-1">
            {pendingCount > 1
              ? "Invitations en attente"
              : "Invitation en attente"}
          </p>
        </Link>
        <Link
          to="/teams"
          className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-indigo-500 transition-colors flex items-center justify-center"
        >
          <span className="text-indigo-400 font-medium">
            + Creer une equipe
          </span>
        </Link>
      </div>

      {/* Liste des equipes recentes */}
      <h2 className="text-lg font-semibold mb-3">Mes equipes</h2>
      {teams.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <p className="text-slate-400 mb-4">
            Vous n'appartenez a aucune equipe pour le moment.
          </p>
          <Link
            to="/teams"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            Creer ma premiere equipe
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors"
            >
              <h3 className="font-medium">{team.name}</h3>
              <p className="text-sm text-slate-400 mt-1">
                Creee le{" "}
                {new Date(team.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
