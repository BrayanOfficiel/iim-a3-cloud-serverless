import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Invitation {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedBy: string;
  status: "pending" | "accepted" | "refused";
  createdAt: string;
}

export default function Invitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      const data = await apiFetch<Invitation[]>("/invitations");
      setInvitations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, action: "accept" | "reject") {
    try {
      await apiFetch(`/invitations/${id}/${action}`, { method: "POST" });
      await loadInvitations();
    } catch (err) {
      console.error(err);
    }
  }

  const pending = invitations.filter((i) => i.status === "pending");
  const past = invitations.filter((i) => i.status !== "pending");

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Invitations</h1>
        <p className="text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>

      {/* Invitations en attente */}
      <h2 className="text-lg font-semibold mb-3">
        En attente ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <p className="text-slate-400 text-sm">
            Aucune invitation en attente.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((inv) => (
            <div
              key={inv.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium">
                  Invitation a rejoindre une equipe
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Recue le {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => respond(inv.id, "accept")}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => respond(inv.id, "reject")}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {past.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">Historique</h2>
          <div className="space-y-2">
            {past.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm">Invitation a une equipe</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    inv.status === "accepted"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {inv.status === "accepted" ? "Acceptee" : "Refusee"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
