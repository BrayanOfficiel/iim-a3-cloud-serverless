import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { Context, Next } from "hono";
import sql from "../db";

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      tokenUse: "access",
      clientId: process.env.COGNITO_CLIENT_ID ?? "",
    });
  }
  return verifier;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Token manquant ou invalide" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await getVerifier().verify(token);
    const sub = payload.sub;

    const [user] = await sql`SELECT role FROM users WHERE id = ${sub}`;
    if (!user) {
      return c.json({ error: "Utilisateur introuvable" }, 401);
    }

    c.set("userId", sub);
    c.set("userRole", user.role);
    await next();
  } catch {
    return c.json({ error: "Token invalide ou expire" }, 401);
  }
}
