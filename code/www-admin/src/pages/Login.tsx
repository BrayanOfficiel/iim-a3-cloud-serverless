import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<{
        token: string;
        user: { role: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role !== "admin") {
        setError("Acces reserve aux administrateurs");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Launchpad Admin
        </h1>
        <p className="text-slate-400 text-center mb-8">Centre de controle</p>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 rounded-xl p-6 space-y-4"
        >
          {error && (
            <p className="text-red-400 text-sm bg-red-950 rounded-lg p-3">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-slate-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-slate-300 mb-1"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="Min. 8 car., majuscule, minuscule, chiffre, special"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 transition-colors"
          >
            {loading ? "Chargement..." : "Connexion"}
          </button>
        </form>
      </div>
    </div>
  );
}
