import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { invitations, teamMembers, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const invitationsRouter = new Hono();
invitationsRouter.use("*", authMiddleware);

invitationsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({ teamId: z.string().uuid(), email: z.string().email() })
  ),
  async (c) => {
    const userId = c.get("userId");
    const { teamId, email } = c.req.valid("json");

    const [invitation] = await db
      .insert(invitations)
      .values({ teamId, invitedEmail: email, invitedBy: userId })
      .returning();

    return c.json(invitation, 201);
  }
);

invitationsRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const result = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.invitedEmail, user.email),
        eq(invitations.status, "pending")
      )
    );

  return c.json(result);
});

invitationsRouter.patch(
  "/:id/accept",
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const [invitation] = await db
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, id))
      .returning();

    if (!invitation) return c.json({ error: "Not found" }, 404);

    await db
      .insert(teamMembers)
      .values({ teamId: invitation.teamId, userId });

    return c.json(invitation);
  }
);

invitationsRouter.patch(
  "/:id/refuse",
  async (c) => {
    const id = c.req.param("id");

    const [invitation] = await db
      .update(invitations)
      .set({ status: "refused" })
      .where(eq(invitations.id, id))
      .returning();

    if (!invitation) return c.json({ error: "Not found" }, 404);
    return c.json(invitation);
  }
);

export default invitationsRouter;
