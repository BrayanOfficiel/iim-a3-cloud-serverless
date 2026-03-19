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
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
        throw new Error("Unauthorized");
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
