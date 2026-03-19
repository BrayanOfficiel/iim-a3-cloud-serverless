import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
  InitiateAuthCommand,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? "eu-west-3",
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

function extractAttribute(
  attrs: AttributeType[] | undefined,
  name: string
): string {
  return attrs?.find((a) => a.Name === name)?.Value ?? "";
}

// Récupérer un utilisateur par son sub (identifiant Cognito)
export async function getUserBySub(
  sub: string
): Promise<{ email: string; name: string } | null> {
  try {
    const res = await client.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: sub,
      })
    );
    return {
      email: extractAttribute(res.UserAttributes, "email"),
      name: extractAttribute(res.UserAttributes, "name"),
    };
  } catch {
    return null;
  }
}

// Récupérer un utilisateur par son email
export async function getUserByEmail(
  email: string
): Promise<{ sub: string; name: string; email: string } | null> {
  const res = await client.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    })
  );

  const user = res.Users?.[0];
  if (!user) return null;

  return {
    sub: extractAttribute(user.Attributes, "sub"),
    name: extractAttribute(user.Attributes, "name"),
    email: extractAttribute(user.Attributes, "email"),
  };
}

// Mettre à jour les attributs d'un utilisateur
export async function updateUserBySub(
  sub: string,
  attributes: { name?: string; email?: string }
): Promise<void> {
  const attrs: AttributeType[] = [];
  if (attributes.name) attrs.push({ Name: "name", Value: attributes.name });
  if (attributes.email) attrs.push({ Name: "email", Value: attributes.email });

  if (attrs.length === 0) return;

  await client.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: sub,
      UserAttributes: attrs,
    })
  );
}

// Créer un utilisateur dans Cognito
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<string> {
  const res = await client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "true" },
      ],
      MessageAction: "SUPPRESS",
    })
  );

  const sub = extractAttribute(res.User?.Attributes, "sub");

  // Définir le mot de passe permanent
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );

  return sub;
}

// Authentifier un utilisateur (retourne les tokens Cognito)
export async function authenticateUser(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken: string;
}> {
  const res = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })
  );

  const result = res.AuthenticationResult;
  if (!result) throw new Error("Échec de l'authentification");

  return {
    accessToken: result.AccessToken!,
    idToken: result.IdToken!,
    refreshToken: result.RefreshToken!,
  };
}
