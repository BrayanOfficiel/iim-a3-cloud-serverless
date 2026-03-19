import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const client = new SESClient({
  region: process.env.AWS_REGION ?? "eu-west-3",
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "noreply@launchpad.app";

function loadTemplate(
  templateName: string,
  variables: Record<string, string>
): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templatePath = resolve(__dirname, "../../emails", `${templateName}.html`);
  let html = readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}

// Envoyer un email d'invitation à rejoindre une équipe
export async function sendInvitationEmail(
  toEmail: string,
  inviterName: string,
  teamName: string
): Promise<void> {
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";

  const html = loadTemplate("invitation", {
    inviterName,
    teamName,
    appUrl,
  });

  await client.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: `${inviterName} vous invite à rejoindre l'équipe "${teamName}" sur Launchpad`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
        },
      },
    })
  );
}
