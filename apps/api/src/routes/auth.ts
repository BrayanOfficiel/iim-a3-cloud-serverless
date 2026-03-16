import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "../db";
import { users } from "../db/schema";

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Email already exists" }, 409);
  }

  const hashedPassword = await hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, password: hashedPassword, name })
    .returning({ id: users.id, email: users.email, name: users.name });

  return c.json(user, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await compare(password, user.password))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(getSecret());

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export default auth;
