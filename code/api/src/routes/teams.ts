import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUserBySub } from "launchpad-domain/cognito";
import { z } from "zod";
import sql from "../db";
import { authMiddleware } from "../middleware/auth";

const teamsRouter = new Hono();
teamsRouter.use("*", authMiddleware);

// GET /teams
teamsRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const result = await sql`
    SELECT t.id, t.name, t.created_by, t.created_at
    FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ${userId}
  `;

  return c.json(
    result.map((t) => ({
      id: t.id,
      name: t.name,
      createdBy: t.created_by,
      createdAt: t.created_at,
    })),
  );
});

// POST /teams
teamsRouter.post(
  "/",
  zValidator("json", z.object({ name: z.string().min(1) })),
  async (c) => {
    const userId = c.get("userId");
    const { name } = c.req.valid("json");

    const [team] = await sql`
      INSERT INTO teams (name, created_by)
      VALUES (${name}, ${userId})
      RETURNING id, name, created_by, created_at
    `;

    await sql`
      INSERT INTO team_members (team_id, user_id)
      VALUES (${team.id}, ${userId})
    `;

    return c.json(
      {
        id: team.id,
        name: team.name,
        createdBy: team.created_by,
        createdAt: team.created_at,
      },
      201,
    );
  },
);

// GET /teams/:teamId
teamsRouter.get("/:teamId", async (c) => {
  const teamId = c.req.param("teamId");
  const [team] = await sql`
    SELECT id, name, created_by, created_at
    FROM teams WHERE id = ${teamId}
  `;
  if (!team) return c.json({ error: "Equipe introuvable" }, 404);
  return c.json({
    id: team.id,
    name: team.name,
    createdBy: team.created_by,
    createdAt: team.created_at,
  });
});

// GET /teams/:teamId/members (enrichi Cognito)
teamsRouter.get("/:teamId/members", async (c) => {
  const teamId = c.req.param("teamId");

  const rows = await sql`
    SELECT tm.user_id, tm.joined_at
    FROM team_members tm
    WHERE tm.team_id = ${teamId}
  `;

  const members = await Promise.all(
    rows.map(async (row) => {
      const cognitoUser = await getUserBySub(row.user_id);
      return {
        id: row.user_id,
        email: cognitoUser?.email ?? "",
        name: cognitoUser?.name ?? "",
        joinedAt: row.joined_at,
      };
    }),
  );

  return c.json(members);
});

// DELETE /teams/:teamId/members/:memberId (createur only)
teamsRouter.delete("/:teamId/members/:memberId", async (c) => {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");
  const memberId = c.req.param("memberId");

  const [team] = await sql`
    SELECT created_by FROM teams WHERE id = ${teamId}
  `;

  if (!team) return c.json({ error: "Equipe introuvable" }, 404);
  if (team.created_by !== userId) {
    return c.json({ error: "Seul le createur peut retirer un membre" }, 403);
  }
  if (memberId === userId) {
    return c.json({ error: "Vous ne pouvez pas vous retirer vous-meme" }, 400);
  }

  await sql`
    DELETE FROM team_members
    WHERE team_id = ${teamId} AND user_id = ${memberId}
  `;

  return c.json({ success: true });
});

export default teamsRouter;
