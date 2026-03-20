import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import sql from "../db";
import { authMiddleware } from "../middleware/auth";

const projectsRouter = new Hono();
projectsRouter.use("*", authMiddleware);

function formatProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    teamId: row.team_id,
    createdAt: row.created_at,
  };
}

// POST /teams/:teamId/projects
projectsRouter.post(
  "/teams/:teamId/projects",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().nullable().optional(),
    }),
  ),
  async (c) => {
    const teamId = c.req.param("teamId");
    const { name, description } = c.req.valid("json");

    const [project] = await sql`
      INSERT INTO projects (name, description, team_id)
      VALUES (${name}, ${description ?? null}, ${teamId})
      RETURNING id, name, description, team_id, created_at
    `;

    return c.json(formatProject(project), 201);
  },
);

// GET /teams/:teamId/projects
projectsRouter.get("/teams/:teamId/projects", async (c) => {
  const teamId = c.req.param("teamId");

  const result = await sql`
    SELECT id, name, description, team_id, created_at
    FROM projects WHERE team_id = ${teamId}
  `;

  return c.json(result.map(formatProject));
});

// GET /projects/:projectId
projectsRouter.get("/projects/:projectId", async (c) => {
  const projectId = c.req.param("projectId");

  const [project] = await sql`
    SELECT id, name, description, team_id, created_at
    FROM projects WHERE id = ${projectId}
  `;

  if (!project) return c.json({ error: "Projet introuvable" }, 404);
  return c.json(formatProject(project));
});

// PATCH /projects/:projectId
projectsRouter.patch(
  "/projects/:projectId",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
    }),
  ),
  async (c) => {
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");

    const [updated] = await sql`
      UPDATE projects SET
        name = COALESCE(${data.name ?? null}, name),
        description = ${data.description !== undefined ? (data.description ?? null) : sql`description`}
      WHERE id = ${projectId}
      RETURNING id, name, description, team_id, created_at
    `;

    if (!updated) return c.json({ error: "Projet introuvable" }, 404);
    return c.json(formatProject(updated));
  },
);

// DELETE /projects/:projectId
projectsRouter.delete("/projects/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  await sql`DELETE FROM projects WHERE id = ${projectId}`;
  return c.json({ success: true });
});

export default projectsRouter;
