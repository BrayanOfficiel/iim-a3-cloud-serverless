import { Hono } from "hono";
import { count } from "drizzle-orm";
import { db } from "../db";
import { users, teams, projects, tasks } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const adminRouter = new Hono();
adminRouter.use("*", authMiddleware);
adminRouter.use("*", adminMiddleware);

adminRouter.get("/stats", async (c) => {
  const [[usersCount], [teamsCount], [projectsCount], [tasksCount]] =
    await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(teams),
      db.select({ count: count() }).from(projects),
      db.select({ count: count() }).from(tasks),
    ]);

  return c.json({
    users: usersCount.count,
    teams: teamsCount.count,
    projects: projectsCount.count,
    tasks: tasksCount.count,
  });
});

adminRouter.get("/users", async (c) => {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json(result);
});

export default adminRouter;
