import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUserBySub, updateUserBySub } from "launchpad-domain/cognito";
import { z } from "zod";
import sql from "../db";
import { authMiddleware } from "../middleware/auth";

const usersRouter = new Hono();
usersRouter.use("*", authMiddleware);

// GET /me
usersRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const [dbUser] =
    await sql`SELECT id, role, created_at FROM users WHERE id = ${userId}`;
  if (!dbUser) return c.json({ error: "Utilisateur introuvable" }, 404);

  const cognitoUser = await getUserBySub(userId);
  if (!cognitoUser)
    return c.json({ error: "Utilisateur introuvable dans Cognito" }, 404);

  return c.json({
    id: dbUser.id,
    email: cognitoUser.email,
    name: cognitoUser.name,
    role: dbUser.role,
    createdAt: dbUser.created_at,
  });
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// PATCH /me
usersRouter.patch("/", zValidator("json", updateSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  await updateUserBySub(userId, data);

  const cognitoUser = await getUserBySub(userId);
  const [dbUser] = await sql`SELECT role FROM users WHERE id = ${userId}`;

  return c.json({
    id: userId,
    email: cognitoUser?.email ?? "",
    name: cognitoUser?.name ?? "",
    role: dbUser?.role ?? "user",
  });
});

export default usersRouter;
