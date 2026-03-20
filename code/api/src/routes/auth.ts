import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  authenticateUser,
  createUser,
  getUserBySub,
} from "launchpad-domain/cognito";
import { z } from "zod";
import sql from "../db";

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /users -- Inscription
auth.post("/users", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");

  try {
    const sub = await createUser(email, password, name);

    await sql`INSERT INTO users (id, role) VALUES (${sub}, 'user')`;

    return c.json({ id: sub, email, name, role: "user" }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "UsernameExistsException") {
      return c.json({ error: "Cet email est deja utilise" }, 409);
    }
    if (err instanceof Error && err.name === "InvalidPasswordException") {
      return c.json(
        {
          error:
            "Mot de passe invalide (min 8 caracteres, majuscule, minuscule, chiffre, caractere special)",
        },
        400,
      );
    }
    throw err;
  }
});

// POST /auth/login -- Connexion
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const tokens = await authenticateUser(email, password);

    // Decoder le sub depuis le token d'acces
    const payload = JSON.parse(
      Buffer.from(tokens.accessToken.split(".")[1], "base64").toString(),
    );
    const sub = payload.sub;

    const [user] = await sql`SELECT role FROM users WHERE id = ${sub}`;
    if (!user) {
      return c.json({ error: "Utilisateur introuvable en base" }, 404);
    }

    const cognitoUser = await getUserBySub(sub);

    return c.json({
      token: tokens.accessToken,
      user: {
        id: sub,
        email: cognitoUser?.email ?? email,
        name: cognitoUser?.name ?? "",
        role: user.role,
      },
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === "NotAuthorizedException" ||
        err.name === "UserNotFoundException")
    ) {
      return c.json({ error: "Email ou mot de passe incorrect" }, 401);
    }
    throw err;
  }
});

export default auth;
