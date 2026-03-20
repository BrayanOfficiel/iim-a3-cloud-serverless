# Launchpad

Plateforme collaborative de gestion de projets (Kanban) deployee sur AWS avec une architecture serverless.

---

## Sommaire

1. [Prerequis](#1-prerequis)
2. [Structure du projet](#2-structure-du-projet)
3. [Installation locale avec Docker](#3-installation-locale-avec-docker)
4. [Installation locale sans Docker](#4-installation-locale-sans-docker)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [Créer un administrateur](#6-Créer-un-administrateur)
7. [Architecture AWS](#7-architecture-aws)
8. [Deploiement](#8-deploiement)
9. [CI/CD GitHub Actions](#9-cicd-github-actions)
10. [API -- Reference des endpoints](#10-api----reference-des-endpoints)

---

## 1. Prerequis

| Outil                                                     | Installation                                |
|-----------------------------------------------------------|---------------------------------------------|
| [Docker](https://www.docker.com/products/docker-desktop/) | Docker Desktop                              |
| [Bun](https://bun.sh)                                     | `curl -fsSL https://bun.sh/install \| bash` |
| [AWS CLI](https://aws.amazon.com/cli/)                    | `brew install awscli`                       |
| [GitHub CLI](https://cli.github.com/)                     | `brew install gh`                           |

---

## 2. Structure du projet

```
code/
  api/          -- API REST Hono deployee sur AWS Lambda
  www-user/     -- SPA React pour les utilisateurs
  www-admin/    -- SPA React pour les administrateurs
  domain/       -- Services partages (Cognito, SES, types)
  crons/        -- Lambda cron (backup DB horaire)
  emails/       -- Templates HTML d'emails
  www-assets/   -- Assets statiques (images)
infrastructure/
  scripts/      -- Scripts de deploiement et migration
```

### Technologies

- **API** : Hono 4.7 + Zod + raw SQL (postgres) + aws-jwt-verify
- **Frontend** : React 19 + React Router 7 + Tailwind CSS 4
- **Base de donnees** : PostgreSQL 16
- **Auth** : Amazon Cognito
- **Runtime** : Bun (dev), Node.js 22.x (Lambda)

---

## 3. Installation locale avec Docker

```bash
cp .env.example .env
# Remplir les valeurs Cognito/AWS dans .env

docker compose up -d
```

| Service              | URL                   |
|----------------------|-----------------------|
| API                  | http://localhost:3000 |
| Frontend utilisateur | http://localhost:5173 |
| Frontend admin       | http://localhost:5174 |

Verifier que l'API repond :

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Arreter :

```bash
docker compose down       # Arrete tout
docker compose down -v    # Arrete + supprime les donnees
```

---

## 4. Installation locale sans Docker

```bash
# Lancer PostgreSQL
docker run -d --name launchpad-db \
  -e POSTGRES_USER=launchpad -e POSTGRES_PASSWORD=launchpad -e POSTGRES_DB=launchpad \
  -p 5432:5432 postgres:16

# Migrer la base
export DATABASE_URL=postgres://launchpad:launchpad@localhost:5432/launchpad
bash infrastructure/scripts/migrate.sh

# Installer les dependances
bun install
cd code/www-user && bun install && cd ../..
cd code/www-admin && bun install && cd ../..

# Lancer (3 terminaux separes)
cd code/api && bun run dev       # Port 3000
cd code/www-user && bun run dev  # Port 5173
cd code/www-admin && bun run dev # Port 5174
```

---

## 5. Variables d'environnement

### API (code/api)

| Variable               | Description                    |
|------------------------|--------------------------------|
| `DATABASE_URL`         | URL PostgreSQL                 |
| `COGNITO_USER_POOL_ID` | ID du User Pool Cognito        |
| `COGNITO_CLIENT_ID`    | ID du client Cognito           |
| `ASSETS_BUCKET`        | Bucket S3 pour les fichiers    |
| `SES_FROM_EMAIL`       | Email expediteur (verifie SES) |
| `APP_URL`              | URL du frontend utilisateur    |

### Frontend (code/www-user, code/www-admin)

| Variable       | Description  |
|----------------|--------------|
| `VITE_API_URL` | URL de l'API |

---

## 6. Créer un administrateur

S'inscrire via le frontend utilisateur, puis passer le role en admin :

```bash
# Trouver le sub Cognito
aws cognito-idp list-users \
  --user-pool-id eu-west-3_XXXX \
  --filter "email=\"ton@email.com\""

# Mettre a jour en base
docker exec -it launchpad-db psql -U launchpad -d launchpad \
  -c "UPDATE users SET role = 'admin' WHERE id = 'LE_SUB_COGNITO';"
```

---

## 7. Architecture AWS

```
Utilisateur --> CloudFront --> S3 (frontend statique)
                    |
             API Gateway --> Lambda (Hono) --> RDS PostgreSQL
                                           --> S3 (assets)
                                           --> Cognito (auth)
                                           --> SES (emails)

EventBridge (cron 1h) --> Lambda (backup) --> S3 (backups)
```

### Services utilises

| Service                   | Usage                                  |
|---------------------------|----------------------------------------|
| Amazon Cognito            | Gestion des utilisateurs               |
| AWS Lambda (Node.js 22.x) | API + Cron backup                      |
| API Gateway HTTP          | Expose la Lambda API                   |
| Amazon RDS PostgreSQL 16  | Base de donnees                        |
| Amazon S3                 | 8 buckets (assets, frontends, backups) |
| Amazon CloudFront         | CDN pour les frontends                 |
| Amazon SES                | Envoi d'emails d'invitation            |
| Amazon EventBridge        | Cron horaire pour les backups          |
| CloudWatch                | Logs                                   |

### Base de donnees

Tables : `users`, `teams`, `team_members`, `invitations`, `projects`, `tasks`, `assets`, `backups`

- `users.id` = sub Cognito (varchar, pas d'email/name/password en DB)
- Enums : `role` (user/admin), `invitation_status` (pending/accepted/refused), `task_status` (todo/in_progress/done)

---

## 8. Deploiement

### Scripts manuels

```bash
bash infrastructure/scripts/deploy-api.sh stg|prd
bash infrastructure/scripts/deploy-crons.sh stg|prd
bash infrastructure/scripts/deploy-frontend.sh stg|prd user|admin
bash infrastructure/scripts/deploy-assets.sh stg|prd
bash infrastructure/scripts/migrate.sh
```

### Environnements

| Environnement    | Branche | Deploiement         |
|------------------|---------|---------------------|
| Staging (STG)    | `stg`   | Automatique au push |
| Production (PRD) | `prd`   | Approbation requise |

---

## 9. CI/CD GitHub Actions

Le workflow `.github/workflows/ci-cd.yml` execute :

1. **Lint** -- Verifie le code avec Biome
2. **Build** -- Compile API, crons et frontends
3. **Deploy STG** -- Deploie sur staging (push sur `stg`)
4. **Deploy PRD** -- Deploie sur production (push sur `prd`, approbation requise)

### Secrets GitHub a configurer

| Secret                                                          | Description           |
|-----------------------------------------------------------------|-----------------------|
| `AWS_ACCESS_KEY_ID`                                             | Cle d'acces IAM       |
| `AWS_SECRET_ACCESS_KEY`                                         | Cle secrete IAM       |
| `STG_DATABASE_URL` / `PRD_DATABASE_URL`                         | URL PostgreSQL RDS    |
| `STG_API_LAMBDA_NAME` / `PRD_API_LAMBDA_NAME`                   | Nom Lambda API        |
| `STG_CRON_LAMBDA_NAME` / `PRD_CRON_LAMBDA_NAME`                 | Nom Lambda Cron       |
| `STG_USER_S3_BUCKET` / `PRD_USER_S3_BUCKET`                     | Bucket frontend user  |
| `STG_ADMIN_S3_BUCKET` / `PRD_ADMIN_S3_BUCKET`                   | Bucket frontend admin |
| `STG_USER_CF_DISTRIBUTION_ID` / `PRD_USER_CF_DISTRIBUTION_ID`   | ID CloudFront user    |
| `STG_ADMIN_CF_DISTRIBUTION_ID` / `PRD_ADMIN_CF_DISTRIBUTION_ID` | ID CloudFront admin   |
| `STG_API_URL` / `PRD_API_URL`                                   | URL API Gateway       |

---

## 10. API -- Reference des endpoints

### Auth

| Methode | Endpoint      | Auth | Description |
|---------|---------------|------|-------------|
| POST    | `/users`      | --   | Inscription |
| POST    | `/auth/login` | --   | Connexion   |

### Utilisateur

| Methode | Endpoint | Auth | Description     |
|---------|----------|------|-----------------|
| GET     | `/me`    | JWT  | Profil courant  |
| PATCH   | `/me`    | JWT  | Modifier profil |

### Équipes

| Methode | Endpoint                           | Auth | Description               |
|---------|------------------------------------|------|---------------------------|
| POST    | `/teams`                           | JWT  | Créer une équipe          |
| GET     | `/teams`                           | JWT  | Mes équipes               |
| GET     | `/teams/:teamId`                   | JWT  | Detail équipe             |
| GET     | `/teams/:teamId/members`           | JWT  | Membres (enrichi Cognito) |
| DELETE  | `/teams/:teamId/members/:memberId` | JWT  | Retirer membre (createur) |

### Invitations

| Methode | Endpoint                     | Auth | Description               |
|---------|------------------------------|------|---------------------------|
| POST    | `/teams/:teamId/invitations` | JWT  | Inviter par email (+ SES) |
| GET     | `/invitations`               | JWT  | Invitations recues        |
| POST    | `/invitations/:id/accept`    | JWT  | Accepter                  |
| POST    | `/invitations/:id/reject`    | JWT  | Refuser                   |

### Projets

| Methode | Endpoint                  | Auth | Description         |
|---------|---------------------------|------|---------------------|
| POST    | `/teams/:teamId/projects` | JWT  | Créer projet        |
| GET     | `/teams/:teamId/projects` | JWT  | Projets de l'équipe |
| GET     | `/projects/:projectId`    | JWT  | Detail projet       |
| PATCH   | `/projects/:projectId`    | JWT  | Modifier projet     |
| DELETE  | `/projects/:projectId`    | JWT  | Supprimer projet    |

### Taches

| Methode | Endpoint                     | Auth | Description      |
|---------|------------------------------|------|------------------|
| POST    | `/projects/:projectId/tasks` | JWT  | Créer tache      |
| GET     | `/projects/:projectId/tasks` | JWT  | Taches du projet |
| GET     | `/tasks/:taskId`             | JWT  | Detail tache     |
| PATCH   | `/tasks/:taskId`             | JWT  | Modifier tache   |
| PATCH   | `/tasks/:taskId/assign`      | JWT  | Assigner tache   |
| PATCH   | `/tasks/:taskId/status`      | JWT  | Changer statut   |
| DELETE  | `/tasks/:taskId`             | JWT  | Supprimer tache  |

### Assets

| Methode | Endpoint                | Auth | Description             |
|---------|-------------------------|------|-------------------------|
| POST    | `/tasks/:taskId/assets` | JWT  | Presigned URL upload S3 |
| GET     | `/tasks/:taskId/assets` | JWT  | Assets de la tache      |
| DELETE  | `/assets/:assetId`      | JWT  | Supprimer asset         |

### Admin

| Methode | Endpoint                               | Auth  | Description                  |
|---------|----------------------------------------|-------|------------------------------|
| GET     | `/admin/stats`                         | Admin | Compteurs globaux            |
| GET     | `/admin/users`                         | Admin | Liste utilisateurs (Cognito) |
| DELETE  | `/admin/users/:id`                     | Admin | Supprimer utilisateur        |
| GET     | `/admin/teams`                         | Admin | Toutes les équipes           |
| GET     | `/admin/teams/:teamId`                 | Admin | Detail équipe                |
| PATCH   | `/admin/teams/:teamId`                 | Admin | Modifier équipe              |
| DELETE  | `/admin/teams/:teamId`                 | Admin | Supprimer équipe             |
| GET     | `/admin/teams/:teamId/members`         | Admin | Membres (Cognito)            |
| POST    | `/admin/teams/:teamId/members`         | Admin | Ajouter membre par email     |
| DELETE  | `/admin/teams/:teamId/members/:userId` | Admin | Retirer membre               |
| GET     | `/admin/teams/:teamId/projects`        | Admin | Projets de l'équipe          |
| DELETE  | `/admin/projects/:id`                  | Admin | Supprimer projet             |
| GET     | `/admin/backups`                       | Admin | Liste des sauvegardes        |
