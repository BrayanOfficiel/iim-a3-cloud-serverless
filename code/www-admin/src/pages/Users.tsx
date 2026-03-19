import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const data = await api<User[]>("/admin/users");
    setUsers(data);
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irreversible.`)) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Utilisateurs ({users.length})</h1>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Inscrit le</th>
              <th className="text-right px-4 py-3">Actions</th>
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
                        ? "bg-amber-900/50 text-amber-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Utilisateur"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => deleteUser(user.id, user.name)}
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
    </div>
  );
}
