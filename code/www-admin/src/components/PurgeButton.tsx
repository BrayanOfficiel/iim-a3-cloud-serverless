import { useState } from "react";
import { api } from "../lib/api";

export default function PurgeButton() {
  const [loading, setLoading] = useState(false);

  async function purge() {
    if (
      !confirm(
        "ATTENTION : Cette action supprime TOUTES les donnees (utilisateurs, equipes, projets, taches). Continuer ?",
      )
    )
      return;
    setLoading(true);
    try {
      await api("/admin/purge", { method: "POST" });
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la purge");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={purge}
      disabled={loading}
      className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs rounded-lg shadow-lg transition-colors"
    >
      {loading ? "Purge..." : "Purger BDD"}
    </button>
  );
}
