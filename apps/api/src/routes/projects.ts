import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { projects } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const projectsRouter = new Hono();
projectsRouter.use("*", authMiddleware);

projectsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      teamId: z.string().uuid(),
    })
  ),
  async (c) => {
    const { name, description, teamId } = c.req.valid("json");
    const [project] = await db
      .insert(projects)
      .values({ name, description, teamId })
      .returning();
    return c.json(project, 201);
  }
);

projectsRouter.get("/team/:teamId", async (c) => {
  const teamId = c.req.param("teamId");
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId));
  return c.json(result);
});

projectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json(project);
});

projectsRouter.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [updated] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  }
);

projectsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(projects).where(eq(projects.id, id));
  return c.json({ success: true });
});

export default projectsRouter;
