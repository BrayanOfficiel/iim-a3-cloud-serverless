import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { tasks } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const tasksRouter = new Hono();
tasksRouter.use("*", authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

tasksRouter.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const [task] = await db.insert(tasks).values(data).returning();
  return c.json(task, 201);
});

tasksRouter.get("/project/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));
  return c.json(result);
});

tasksRouter.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const [updated] = await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(tasks).where(eq(tasks.id, id));
  return c.json({ success: true });
});

export default tasksRouter;
