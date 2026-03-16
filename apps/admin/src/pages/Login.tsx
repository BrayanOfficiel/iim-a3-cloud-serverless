import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{
        token: string;
        user: { role: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role !== "admin") {
        setError("Accès réservé aux administrateurs");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Launchpad Admin
        </h1>
        <p className="text-slate-400 text-center mb-8">Centre de contrôle</p>

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
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg py-2 transition-colors"
          >
            Connexion
          </button>
        </form>
      </div>
    </div>
  );
}
