import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUserByEmail, getUserBySub } from "launchpad-domain/cognito";
import { z } from "zod";
import sql from "../db";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";

const adminRouter = new Hono();
adminRouter.use("*", authMiddleware);
adminRouter.use("*", adminMiddleware);

// GET /admin/stats
adminRouter.get("/stats", async (c) => {
  const [[usersCount], [teamsCount], [projectsCount], [tasksCount]] =
    await Promise.all([
      sql`SELECT count(*)::int as count FROM users`,
      sql`SELECT count(*) ::int as count
                FROM teams`,
      sql`SELECT count(*)::int as count FROM projects`,
      sql`SELECT count(*)::int as count FROM tasks`,
    ]);

  return c.json({
    users: usersCount.count,
    teams: teamsCount.count,
    projects: projectsCount.count,
    tasks: tasksCount.count,
  });
});

// GET /admin/users (enrichi Cognito)
adminRouter.get("/users", async (c) => {
  const rows = await sql`SELECT id, role, created_at FROM users`;

  const users = await Promise.all(
    rows.map(async (row) => {
      const cognitoUser = await getUserBySub(row.id);
      return {
        id: row.id,
        email: cognitoUser?.email ?? "",
        name: cognitoUser?.name ?? "",
        role: row.role,
        createdAt: row.created_at,
      };
    }),
  );

  return c.json(users);
});

// PATCH /admin/users/:id/role -- Changer le role d'un utilisateur
adminRouter.patch(
  "/users/:id/role",
  zValidator("json", z.object({ role: z.enum(["user", "admin"]) })),
  async (c) => {
    const id = c.req.param("id");
    const { role } = c.req.valid("json");
    const [updated] = await sql`
      UPDATE users SET role = ${role} WHERE id = ${id} RETURNING id, role
    `;
    if (!updated) return c.json({ error: "Utilisateur introuvable" }, 404);
    return c.json(updated);
  },
);

// DELETE /admin/users/:id
adminRouter.delete("/users/:id", async (c) => {
  const id = c.req.param("id");

  // Supprimer de Cognito
  const cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION ?? "eu-west-3",
  });
  try {
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: id,
      }),
    );
  } catch (err) {
    console.error(`Erreur suppression Cognito ${id}:`, err);
  }

  await sql`DELETE FROM users WHERE id = ${id}`;
  return c.json({ success: true });
});

// GET /admin/teams (toutes les équipes)
adminRouter.get("/teams", async (c) => {
  const result = await sql`
        SELECT id, name, created_by, created_at
        FROM teams
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

// GET /admin/teams/:teamId
adminRouter.get("/teams/:teamId", async (c) => {
  const teamId = c.req.param("teamId");
  const [team] = await sql`
        SELECT id, name, created_by, created_at
        FROM teams
        WHERE id = ${teamId}
    `;
  if (!team) return c.json({ error: "Équipe introuvable" }, 404);
  return c.json({
    id: team.id,
    name: team.name,
    createdBy: team.created_by,
    createdAt: team.created_at,
  });
});

// PATCH /admin/teams/:teamId
adminRouter.patch(
  "/teams/:teamId",
  zValidator("json", z.object({ name: z.string().min(1) })),
  async (c) => {
    const teamId = c.req.param("teamId");
    const { name } = c.req.valid("json");
    const [updated] = await sql`
            UPDATE teams
            SET name = ${name}
            WHERE id = ${teamId} RETURNING id, name, created_by, created_at
        `;
    if (!updated) return c.json({ error: "Équipe introuvable" }, 404);
    return c.json({
      id: updated.id,
      name: updated.name,
      createdBy: updated.created_by,
      createdAt: updated.created_at,
    });
  },
);

// DELETE /admin/teams/:teamId
adminRouter.delete("/teams/:teamId", async (c) => {
  const teamId = c.req.param("teamId");
  await sql`DELETE
              FROM teams
              WHERE id = ${teamId}`;
  return c.json({ success: true });
});

// GET /admin/teams/:teamId/members (enrichi Cognito)
adminRouter.get("/teams/:teamId/members", async (c) => {
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

// POST /admin/teams/:teamId/members (ajouter par email)
adminRouter.post(
  "/teams/:teamId/members",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const teamId = c.req.param("teamId");
    const { email } = c.req.valid("json");

    const cognitoUser = await getUserByEmail(email);
    if (!cognitoUser) {
      return c.json({ error: "Utilisateur introuvable avec cet email" }, 404);
    }

    // Verifier s'il est deja membre
    const [existing] = await sql`
      SELECT 1 FROM team_members WHERE team_id = ${teamId} AND user_id = ${cognitoUser.sub}
    `;
    if (existing) {
      return c.json(
        { error: "Cet utilisateur est deja membre de l'équipe" },
        409,
      );
    }

    await sql`
      INSERT INTO team_members (team_id, user_id) VALUES (${teamId}, ${cognitoUser.sub})
    `;

    return c.json({ success: true }, 201);
  },
);

// DELETE /admin/teams/:teamId/members/:userId
adminRouter.delete("/teams/:teamId/members/:userId", async (c) => {
  const teamId = c.req.param("teamId");
  const userId = c.req.param("userId");
  await sql`
    DELETE FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `;
  return c.json({ success: true });
});

// GET /admin/teams/:teamId/projects
adminRouter.get("/teams/:teamId/projects", async (c) => {
  const teamId = c.req.param("teamId");
  const result = await sql`
    SELECT id, name, description, team_id, created_at
    FROM projects WHERE team_id = ${teamId}
  `;
  return c.json(
    result.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      teamId: p.team_id,
      createdAt: p.created_at,
    })),
  );
});

// DELETE /admin/projects/:id
adminRouter.delete("/projects/:id", async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return c.json({ success: true });
});

// GET /admin/backups
adminRouter.get("/backups", async (c) => {
  const result = await sql`
    SELECT id, filename, s3_key, created_at
    FROM backups ORDER BY created_at DESC
  `;
  return c.json(
    result.map((b) => ({
      id: b.id,
      filename: b.filename,
      s3Key: b.s3_key,
      createdAt: b.created_at,
    })),
  );
});

// POST /admin/purge -- Purge toute la BDD + Cognito (sauf admin connecte)
adminRouter.post("/purge", async (c) => {
  const currentUserId = c.get("userId");

  // Recuperer tous les user IDs sauf l'admin connecte
  const users = await sql`SELECT id FROM users WHERE id != ${currentUserId}`;

  // Supprimer chaque utilisateur de Cognito
  const cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION ?? "eu-west-3",
  });
  const userPoolId = process.env.COGNITO_USER_POOL_ID ?? "";

  for (const user of users) {
    try {
      await cognito.send(
        new AdminDeleteUserCommand({
          UserPoolId: userPoolId,
          Username: user.id,
        }),
      );
    } catch (err) {
      console.error(`Erreur suppression Cognito ${user.id}:`, err);
    }
  }

  // Purge BDD (cascade supprime les donnees liees, puis re-insere l'admin)
  await sql`TRUNCATE assets, tasks, projects, invitations, team_members, teams, backups, users CASCADE`;
  await sql`INSERT INTO users (id, role) VALUES (${currentUserId}, 'admin')`;

  return c.json({
    success: true,
    message: "Base de donnees et Cognito purges (admin conserve)",
  });
});

export default adminRouter;
