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
  email: z.string().email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[^A-Za-z0-9]/,
      "Le mot de passe doit contenir au moins un caractere special",
    ),
  name: z.string().min(1, "Le nom est requis"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /users -- Inscription
auth.post("/users", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");

  try {
    const sub = await createUser(email, password, name);

    try {
      await sql`INSERT INTO users (id, role) VALUES (${sub}, 'user')`;
    } catch (dbErr) {
      // Si l'insertion en BDD echoue, on ne laisse pas un orphelin
      // L'utilisateur existe dans Cognito mais pas en BDD
      // Au prochain login il aura une erreur "Utilisateur introuvable en base"
      // C'est mieux que de crash silencieusement
      console.error("Erreur insertion BDD apres creation Cognito:", dbErr);
      return c.json(
        {
          error:
            "Compte cree mais erreur interne. Contactez un administrateur.",
        },
        500,
      );
    }

    return c.json({ id: sub, email, name, role: "user" }, 201);
  } catch (err: unknown) {
    if (err instanceof Error) {
      switch (err.name) {
        case "UsernameExistsException":
          return c.json({ error: "Cet email est deja utilise" }, 409);
        case "InvalidPasswordException":
          return c.json(
            {
              error:
                "Mot de passe invalide : minimum 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special",
            },
            400,
          );
        case "InvalidParameterException":
          return c.json(
            {
              error:
                "Parametres invalides. Verifiez votre email et mot de passe.",
            },
            400,
          );
      }
    }
    console.error("Erreur inscription:", err);
    return c.json({ error: "Erreur lors de la creation du compte" }, 500);
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
    if (err instanceof Error) {
      switch (err.name) {
        case "NotAuthorizedException":
        case "UserNotFoundException":
          return c.json({ error: "Email ou mot de passe incorrect" }, 401);
        case "UserNotConfirmedException":
          return c.json({ error: "Compte non confirme" }, 403);
        case "PasswordResetRequiredException":
          return c.json(
            { error: "Reinitialisation du mot de passe requise" },
            403,
          );
      }
    }
    console.error("Erreur connexion:", err);
    return c.json({ error: "Erreur lors de la connexion" }, 500);
  }
});

export default auth;
