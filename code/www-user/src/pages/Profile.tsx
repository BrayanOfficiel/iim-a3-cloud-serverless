import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { apiFetch } from "../lib/api";

export default function Profile() {
  const { user, refreshUser } = useUser();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await refreshUser();
      setMessage({ type: "success", text: "Profil mis a jour" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
        <p className="text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      <div className="max-w-lg">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm text-slate-300 mb-1"
              >
                Nom
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm text-slate-300 mb-1"
              >
                Adresse e-mail
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 bg-slate-700/50 text-slate-400 rounded-lg border border-slate-600 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">
                L'adresse e-mail ne peut pas etre modifiee.
              </p>
            </div>
            <div>
              <span className="block text-sm text-slate-300 mb-1">Role</span>
              <p className="text-sm text-slate-400">
                {user.role === "admin" ? "Administrateur" : "Utilisateur"}
              </p>
            </div>
            <div>
              <span className="block text-sm text-slate-300 mb-1">
                Membre depuis
              </span>
              <p className="text-sm text-slate-400">
                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {message && (
              <p
                className={`text-sm p-3 rounded-lg ${
                  message.type === "success"
                    ? "text-green-400 bg-green-400/10"
                    : "text-red-400 bg-red-400/10"
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || name === user.name}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
