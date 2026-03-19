import { Hono } from "hono";
import { cors } from "hono/cors";
import adminRouter from "./routes/admin";
import assetsRouter from "./routes/assets";
import auth from "./routes/auth";
import invitationsRouter from "./routes/invitations";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import teamsRouter from "./routes/teams";
import usersRouter from "./routes/users";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth: POST /users, POST /auth/login
app.route("/", auth);
app.route("/auth", auth);

// Users: GET/PATCH /me
app.route("/", usersRouter);

// Teams: GET/POST /teams, GET /teams/:teamId, GET /teams/:teamId/members, DELETE /teams/:teamId/members/:memberId
app.route("/", teamsRouter);

// Invitations: POST /teams/:teamId/invitations, GET /invitations, POST /invitations/:id/accept|reject
app.route("/", invitationsRouter);

// Projects: POST/GET /teams/:teamId/projects, GET/PATCH/DELETE /projects/:projectId
app.route("/", projectsRouter);

// Tasks: POST/GET /projects/:projectId/tasks, GET/PATCH/DELETE /tasks/:taskId, PATCH /tasks/:taskId/assign|status
app.route("/", tasksRouter);

// Assets: POST/GET /tasks/:taskId/assets, DELETE /assets/:assetId
app.route("/", assetsRouter);

// Admin: /admin/*
app.route("/admin", adminRouter);

export default app;
