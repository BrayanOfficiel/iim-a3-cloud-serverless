import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { teams, teamMembers, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const teamsRouter = new Hono();
teamsRouter.use("*", authMiddleware);

teamsRouter.post(
  "/",
  zValidator("json", z.object({ name: z.string().min(1) })),
  async (c) => {
    const userId = c.get("userId");
    const { name } = c.req.valid("json");

    const [team] = await db
      .insert(teams)
      .values({ name, createdBy: userId })
      .returning();

    await db.insert(teamMembers).values({ teamId: team.id, userId });

    return c.json(team, 201);
  }
);

teamsRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const result = await db
    .select({ id: teams.id, name: teams.name, createdAt: teams.createdAt })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId));

  return c.json(result);
});

teamsRouter.get("/:teamId/members", async (c) => {
  const teamId = c.req.param("teamId");

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

  return c.json(members);
});

export default teamsRouter;
