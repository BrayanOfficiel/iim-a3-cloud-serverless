import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (isRegister) {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });
        setIsRegister(false);
        setPassword("");
        setSuccess("Compte cree avec succes. Vous pouvez vous connecter.");
        return;
      }
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">Launchpad</h1>
        <p className="text-slate-400 mb-6">
          {isRegister ? "Creer votre compte" : "Connectez-vous a votre espace"}
        </p>
        {error && (
          <p className="text-red-400 bg-red-400/10 p-3 rounded-lg mb-4 text-sm">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-400 bg-green-400/10 p-3 rounded-lg mb-4 text-sm">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label
                htmlFor="login-name"
                className="block text-sm text-slate-300 mb-1"
              >
                Nom
              </label>
              <input
                id="login-name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          )}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm text-slate-300 mb-1"
            >
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm text-slate-300 mb-1"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Min. 8 car., majuscule, minuscule, chiffre, special"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
              required
              minLength={8}
            />
            {isRegister && (
              <p className="text-slate-500 text-xs mt-1">
                Minimum 8 caracteres, une majuscule, une minuscule, un chiffre
                et un caractere special
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading
              ? "Chargement..."
              : isRegister
                ? "Creer le compte"
                : "Se connecter"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
            setSuccess("");
          }}
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          {isRegister
            ? "Deja un compte ? Se connecter"
            : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  );
}
