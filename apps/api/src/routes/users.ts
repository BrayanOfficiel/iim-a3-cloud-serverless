import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const usersRouter = new Hono();
usersRouter.use("*", authMiddleware);

usersRouter.get("/me", async (c) => {
  const userId = c.get("userId");
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

usersRouter.patch("/me", zValidator("json", updateSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return c.json(updated);
});

export default usersRouter;
