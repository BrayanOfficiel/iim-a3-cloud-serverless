import type { Context, Next } from "hono";

export async function adminMiddleware(c: Context, next: Next) {
  const role = c.get("userRole");
  if (role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
}
