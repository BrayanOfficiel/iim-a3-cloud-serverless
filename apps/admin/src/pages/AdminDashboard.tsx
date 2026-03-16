import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";

interface Stats {
  users: number;
  teams: number;
  projects: number;
  tasks: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api<Stats>("/admin/stats").then(setStats).catch(console.error);
    api<User[]>("/admin/users").then(setUsers).catch(console.error);
  }, []);

  function logout() {
    localStorage.removeItem("admin_token");
    navigate("/login");
  }

  const statCards = stats
    ? [
        { label: "Utilisateurs", value: stats.users },
        { label: "Équipes", value: stats.teams },
        { label: "Projets", value: stats.projects },
        { label: "Tâches", value: stats.tasks },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <span className="text-amber-500">Launchpad</span> Admin
        </h1>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Déconnexion
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">Vue d'ensemble</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-900 rounded-xl p-5 text-center"
            >
              <p className="text-3xl font-bold text-amber-500">{card.value}</p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Utilisateurs</h2>
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-amber-900 text-amber-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
