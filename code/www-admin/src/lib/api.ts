// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (!window.location.pathname.startsWith("/login")) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Email ou mot de passe incorrect");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    let message = "Erreur de requete";
    if (body) {
      if (typeof body.error === "string") {
        message = body.error;
      } else if (typeof body === "object") {
        message = JSON.stringify(body);
      }
    }
    throw new Error(message);
  }

  return res.json();
}
