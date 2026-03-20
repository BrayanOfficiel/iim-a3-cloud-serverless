import {useState} from "react";
import {apiFetch} from "../lib/api";

export default function PurgeButton() {
    const [loading, setLoading] = useState(false);

    async function purge() {
        if (
            !confirm(
                "ATTENTION : Cette action supprime TOUTES les donnees (utilisateurs, équipes, projets, tâches). Continuer ?",
            )
        )
            return;
        setLoading(true);
        try {
            await apiFetch("/admin/purge", {method: "POST"});
            localStorage.removeItem("token");
            window.location.href = "/login";
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de la purge (admin requis)",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={purge}
            disabled={loading}
            className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 rounded-full flex items-center justify-center shadow-lg transition-colors"
            title="Purger la base de donnees"
        >
            <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
            </svg>
        </button>
    );
}
