import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUserByEmail, getUserBySub } from "launchpad-domain/cognito";
import { sendInvitationEmail } from "launchpad-domain/ses";
import { z } from "zod";
import sql from "../db";
import { authMiddleware } from "../middleware/auth";

const invitationsRouter = new Hono();
invitationsRouter.use("*", authMiddleware);

function formatInvitation(row: Record<string, unknown>) {
  return {
    id: row.id,
    teamId: row.team_id,
    teamName: row.team_name ?? null,
    invitedEmail: row.invited_email,
    invitedBy: row.invited_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

// POST /teams/:teamId/invitations
invitationsRouter.post(
  "/teams/:teamId/invitations",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const userId = c.get("userId");
    const teamId = c.req.param("teamId");
    const { email } = c.req.valid("json");

    // Recuperer le nom de l'inviteur et de l'equipe
    const [team] = await sql`SELECT name FROM teams WHERE id = ${teamId}`;
    if (!team) return c.json({ error: "Equipe introuvable" }, 404);

    const inviter = await getUserBySub(userId);
    const inviterName = inviter?.name ?? "Un membre";

    const [invitation] = await sql`
      INSERT INTO invitations (team_id, invited_email, invited_by)
      VALUES (${teamId}, ${email}, ${userId})
      RETURNING id, team_id, invited_email, invited_by, status, created_at
    `;

    // Envoyer l'email d'invitation via SES
    try {
      await sendInvitationEmail(email, inviterName, team.name);
    } catch (err) {
      console.error("Erreur envoi email SES:", err);
    }

    return c.json(formatInvitation(invitation), 201);
  },
);

// GET /invitations (invitations recues par l'utilisateur connecte)
invitationsRouter.get("/invitations", async (c) => {
  const userId = c.get("userId");

  const cognitoUser = await getUserBySub(userId);
  if (!cognitoUser) return c.json({ error: "Utilisateur introuvable" }, 404);

  const result = await sql`
    SELECT i.id, i.team_id, i.invited_email, i.invited_by, i.status, i.created_at,
           t.name as team_name
    FROM invitations i
    LEFT JOIN teams t ON i.team_id = t.id
    WHERE i.invited_email = ${cognitoUser.email}
  `;

  return c.json(result.map(formatInvitation));
});

// POST /invitations/:id/accept
invitationsRouter.post("/invitations/:id/accept", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [invitation] = await sql`
    UPDATE invitations SET status = 'accepted'
    WHERE id = ${id}
    RETURNING id, team_id, invited_email, invited_by, status, created_at
  `;

  if (!invitation) return c.json({ error: "Invitation introuvable" }, 404);

  await sql`
    INSERT INTO team_members (team_id, user_id)
    VALUES (${invitation.team_id}, ${userId})
  `;

  return c.json(formatInvitation(invitation));
});

// POST /invitations/:id/reject
invitationsRouter.post("/invitations/:id/reject", async (c) => {
  const id = c.req.param("id");

  const [invitation] = await sql`
    UPDATE invitations SET status = 'refused'
    WHERE id = ${id}
    RETURNING id, team_id, invited_email, invited_by, status, created_at
  `;

  if (!invitation) return c.json({ error: "Invitation introuvable" }, 404);
  return c.json(formatInvitation(invitation));
});

export default invitationsRouter;
