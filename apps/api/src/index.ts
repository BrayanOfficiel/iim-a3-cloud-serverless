import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import usersRouter from "./routes/users";
import teamsRouter from "./routes/teams";
import invitationsRouter from "./routes/invitations";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import assetsRouter from "./routes/assets";
import adminRouter from "./routes/admin";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/auth", auth);
app.route("/users", usersRouter);
app.route("/teams", teamsRouter);
app.route("/invitations", invitationsRouter);
app.route("/projects", projectsRouter);
app.route("/tasks", tasksRouter);
app.route("/assets", assetsRouter);
app.route("/admin", adminRouter);

export default app;
