# Launchpad

Plateforme collaborative de gestion de projets déployée sur AWS avec une architecture serverless.
Deux interfaces : une pour les utilisateurs, une pour les administrateurs.

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Structure du projet](#2-structure-du-projet)
3. [Installation](#3-installation)
4. [Configuration des variables d'environnement](#4-configuration-des-variables-denvironnement)
5. [Base de données](#5-base-de-données)
6. [Lancer le projet en local](#6-lancer-le-projet-en-local)
7. [Créer un compte et se connecter](#7-créer-un-compte-et-se-connecter)
8. [Fonctionnalités utilisateur](#8-fonctionnalités-utilisateur)
9. [Fonctionnalités admin](#9-fonctionnalités-admin)
10. [API — Référence des endpoints](#10-api--référence-des-endpoints)
11. [Déploiement AWS](#11-déploiement-aws)
12. [CI/CD GitLab](#12-cicd-gitlab)

---

## 1. Prérequis

| Outil | Version minimale | Installation |
|-------|-----------------|--------------|
| [Bun](https://bun.sh) | 1.0+ | `curl -fsSL https://bun.sh/install \| bash` |
| [PostgreSQL](https://www.postgresql.org/) | 14+ | Via Docker ou installation locale |
| [AWS CLI](https://aws.amazon.com/cli/) | v2 | Requis uniquement pour le déploiement |

> Pour PostgreSQL en local avec Docker :
> ```bash
> docker run -d \
>   --name launchpad-db \
>   -e POSTGRES_USER=launchpad \
>   -e POSTGRES_PASSWORD=launchpad \
>   -e POSTGRES_DB=launchpad \
>   -p 5432:5432 \
>   postgres:16
> ```

---

## 2. Structure du projet

```
iim-a3-cloud-serverless/
├── .gitlab-ci.yml          # Pipeline CI/CD
├── biome.json              # Config linter (Biome)
├── scripts/
│   ├── deploy-api.sh       # Script déploiement Lambda
│   └── deploy-frontend.sh  # Script déploiement S3 + CloudFront
├── packages/
│   └── shared/
│       └── src/types.ts    # Types TypeScript partagés
└── apps/
    ├── api/                # Backend Hono (tourne sur Lambda en prod)
    ├── user/               # Frontend utilisateur (port 5173)
    └── admin/              # Frontend administrateur (port 5174)
```

---

## 3. Installation

Cloner le repo puis installer les dépendances de chaque app :

```bash
git clone <url-du-repo>
cd iim-a3-cloud-serverless
```

```bash
cd apps/api && bun install
```

```bash
cd apps/user && bun install
```

```bash
cd apps/admin && bun install
```

---

## 4. Configuration des variables d'environnement

Chaque app possède un fichier `.env.example` à copier :

### API (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

```env
DATABASE_URL=postgresql://launchpad:launchpad@localhost:5432/launchpad
JWT_SECRET=une-cle-secrete-longue-et-aleatoire
AWS_REGION=eu-west-3
S3_BUCKET=launchpad-assets-dev
```

> `JWT_SECRET` : générer une clé sécurisée avec `openssl rand -base64 32`

### Frontend utilisateur (`apps/user/.env`)

```bash
cp apps/user/.env.example apps/user/.env
```

```env
VITE_API_URL=http://localhost:3000
```

### Frontend admin (`apps/admin/.env`)

```bash
cp apps/admin/.env.example apps/admin/.env
```

```env
VITE_API_URL=http://localhost:3000
```

---

## 5. Base de données

### Générer et appliquer les migrations

Depuis le dossier `apps/api` :

```bash
cd apps/api

# Générer les fichiers de migration depuis le schema Drizzle
bun drizzle-kit generate

# Appliquer les migrations sur la base de données
bun drizzle-kit migrate
```

### Créer un compte administrateur manuellement

Après avoir lancé l'API, créer d'abord un compte via `POST /auth/register`, puis passer le rôle en `admin` directement en base :

```sql
UPDATE users SET role = 'admin' WHERE email = 'ton-email@example.com';
```

Ou via psql :

```bash
psql postgresql://launchpad:launchpad@localhost:5432/launchpad \
  -c "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
```

---

## 6. Lancer le projet en local

Ouvrir **3 terminaux** :

**Terminal 1 — API (port 3000)**
```bash
cd apps/api && bun run dev
```

**Terminal 2 — Frontend utilisateur (port 5173)**
```bash
cd apps/user && bun run dev
```

**Terminal 3 — Frontend admin (port 5174)**
```bash
cd apps/admin && bun run dev
```

| Interface | URL |
|-----------|-----|
| API | http://localhost:3000 |
| Frontend utilisateur | http://localhost:5173 |
| Frontend admin | http://localhost:5174 |

Vérifier que l'API répond :
```bash
curl http://localhost:3000/health
# → {"status":"ok"}
```

---

## 7. Créer un compte et se connecter

### Via le frontend utilisateur

1. Ouvrir **http://localhost:5173**
2. Cliquer sur **"Créer un compte"**
3. Renseigner : nom, email, mot de passe (6 caractères min.)
4. Valider — la session démarre automatiquement

### Via l'API directement

```bash
# Inscription
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"motdepasse","name":"Alice"}'

# Connexion
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"motdepasse"}'
```

La réponse contient un `token` JWT à inclure dans les appels suivants :
```json
{
  "token": "eyJ...",
  "user": { "id": "...", "email": "user@example.com", "name": "Alice", "role": "user" }
}
```

---

## 8. Fonctionnalités utilisateur

### Équipes

**Créer une équipe**
```bash
curl -X POST http://localhost:3000/teams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon équipe"}'
```
Le créateur est automatiquement ajouté comme membre de l'équipe.

**Lister ses équipes**
```bash
curl http://localhost:3000/teams \
  -H "Authorization: Bearer <token>"
```

**Voir les membres d'une équipe**
```bash
curl http://localhost:3000/teams/<teamId>/members \
  -H "Authorization: Bearer <token>"
```

---

### Invitations

**Inviter quelqu'un par email**
```bash
curl -X POST http://localhost:3000/invitations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"teamId":"<teamId>","invitedEmail":"bob@example.com"}'
```

**Voir ses invitations reçues** (en attente)
```bash
curl http://localhost:3000/invitations \
  -H "Authorization: Bearer <token>"
```

**Accepter une invitation**
```bash
curl -X PATCH http://localhost:3000/invitations/<invitationId>/accept \
  -H "Authorization: Bearer <token>"
```

**Refuser une invitation**
```bash
curl -X PATCH http://localhost:3000/invitations/<invitationId>/refuse \
  -H "Authorization: Bearer <token>"
```

---

### Projets

**Créer un projet** (dans une équipe)
```bash
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau projet","description":"Description optionnelle","teamId":"<teamId>"}'
```

**Lister les projets d'une équipe**
```bash
curl http://localhost:3000/projects/team/<teamId> \
  -H "Authorization: Bearer <token>"
```

**Modifier un projet**
```bash
curl -X PATCH http://localhost:3000/projects/<projectId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau nom"}'
```

**Supprimer un projet**
```bash
curl -X DELETE http://localhost:3000/projects/<projectId> \
  -H "Authorization: Bearer <token>"
```

---

### Tâches (Kanban)

Les tâches ont 3 statuts : `todo` → `in_progress` → `done`

**Créer une tâche**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ma tâche",
    "description": "Détails...",
    "projectId": "<projectId>",
    "assigneeId": "<userId>"
  }'
```

**Lister les tâches d'un projet**
```bash
curl http://localhost:3000/tasks/project/<projectId> \
  -H "Authorization: Bearer <token>"
```

**Changer le statut d'une tâche**
```bash
curl -X PATCH http://localhost:3000/tasks/<taskId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

**Supprimer une tâche**
```bash
curl -X DELETE http://localhost:3000/tasks/<taskId> \
  -H "Authorization: Bearer <token>"
```

---

### Pièces jointes (Assets S3)

**Obtenir une URL de téléversement (presigned URL)**
```bash
curl -X POST http://localhost:3000/assets/presign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"filename":"document.pdf","taskId":"<taskId>"}'
```

Réponse :
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "assetId": "..."
}
```

Puis uploader le fichier directement vers S3 :
```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @document.pdf
```

**Lister les fichiers d'une tâche**
```bash
curl http://localhost:3000/assets/task/<taskId> \
  -H "Authorization: Bearer <token>"
```

**Supprimer un fichier**
```bash
curl -X DELETE http://localhost:3000/assets/<assetId> \
  -H "Authorization: Bearer <token>"
```

---

### Profil utilisateur

**Voir son profil**
```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <token>"
```

**Modifier son profil**
```bash
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau nom","email":"nouvel@email.com"}'
```

---

## 9. Fonctionnalités admin

### Connexion admin

1. Ouvrir **http://localhost:5174**
2. Se connecter avec un compte dont le `role` est `admin`
3. Si le rôle n'est pas `admin`, l'accès est refusé même avec des identifiants valides

### Tableau de bord

Le dashboard affiche :
- Nombre total d'utilisateurs, équipes, projets et tâches
- La liste complète de tous les utilisateurs avec leur rôle et date d'inscription

### Via l'API

```bash
# Statistiques globales
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer <token-admin>"

# Liste de tous les utilisateurs
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer <token-admin>"
```

---

## 10. API — Référence des endpoints

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/health` | — | Santé de l'API |
| POST | `/auth/register` | — | Inscription |
| POST | `/auth/login` | — | Connexion |
| GET | `/users/me` | JWT | Profil courant |
| PATCH | `/users/me` | JWT | Modifier profil |
| POST | `/teams` | JWT | Créer une équipe |
| GET | `/teams` | JWT | Mes équipes |
| GET | `/teams/:id/members` | JWT | Membres d'une équipe |
| POST | `/invitations` | JWT | Inviter par email |
| GET | `/invitations` | JWT | Mes invitations reçues |
| PATCH | `/invitations/:id/accept` | JWT | Accepter |
| PATCH | `/invitations/:id/refuse` | JWT | Refuser |
| POST | `/projects` | JWT | Créer un projet |
| GET | `/projects/team/:teamId` | JWT | Projets d'une équipe |
| GET | `/projects/:id` | JWT | Détail projet |
| PATCH | `/projects/:id` | JWT | Modifier projet |
| DELETE | `/projects/:id` | JWT | Supprimer projet |
| POST | `/tasks` | JWT | Créer une tâche |
| GET | `/tasks/project/:projectId` | JWT | Tâches d'un projet |
| PATCH | `/tasks/:id` | JWT | Modifier / changer statut |
| DELETE | `/tasks/:id` | JWT | Supprimer tâche |
| POST | `/assets/presign` | JWT | Générer URL upload S3 |
| GET | `/assets/task/:taskId` | JWT | Fichiers d'une tâche |
| DELETE | `/assets/:id` | JWT | Supprimer fichier |
| GET | `/admin/stats` | JWT + Admin | Stats globales |
| GET | `/admin/users` | JWT + Admin | Liste utilisateurs |

---

## 11. Déploiement AWS

### Architecture

```
Utilisateur → CloudFront → S3 (frontend statique)
                    ↓
             API Gateway → Lambda (Hono) → RDS PostgreSQL
                                        → S3 (assets)
```

### Variables GitLab CI/CD à configurer

Dans **Settings > CI/CD > Variables** de ton repo GitLab :

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Clé d'accès IAM |
| `AWS_SECRET_ACCESS_KEY` | Clé secrète IAM |
| `AWS_REGION` | Région AWS (ex: `eu-west-3`) |
| `LAMBDA_FUNCTION_NAME_STG` | Nom de la fonction Lambda (staging) |
| `LAMBDA_FUNCTION_NAME_PRD` | Nom de la fonction Lambda (prod) |
| `S3_BUCKET_USER_STG` | Bucket S3 frontend user (staging) |
| `S3_BUCKET_USER_PRD` | Bucket S3 frontend user (prod) |
| `S3_BUCKET_ADMIN_STG` | Bucket S3 frontend admin (staging) |
| `S3_BUCKET_ADMIN_PRD` | Bucket S3 frontend admin (prod) |
| `CF_DISTRIBUTION_USER_STG` | ID distribution CloudFront user (staging) |
| `CF_DISTRIBUTION_USER_PRD` | ID distribution CloudFront user (prod) |
| `CF_DISTRIBUTION_ADMIN_STG` | ID distribution CloudFront admin (staging) |
| `CF_DISTRIBUTION_ADMIN_PRD` | ID distribution CloudFront admin (prod) |
| `VITE_API_URL_STG` | URL API Gateway (staging) |
| `VITE_API_URL_PRD` | URL API Gateway (prod) |

### Déploiement manuel

```bash
# Déployer l'API sur Lambda
bash scripts/deploy-api.sh stg

# Déployer le frontend utilisateur
bash scripts/deploy-frontend.sh stg user

# Déployer le frontend admin
bash scripts/deploy-frontend.sh stg admin
```

---

## 12. CI/CD GitLab

Le pipeline se déclenche automatiquement :

| Branche | Environnement | Déclenchement |
|---------|--------------|---------------|
| `develop` | Staging (STG) | Automatique au push |
| `main` | Production (PRD) | Manuel (bouton dans GitLab) |

### Stages du pipeline

1. **lint** — Vérifie le code avec Biome (toutes les branches)
2. **build** — Compile l'API et les frontends (`develop` et `main`)
3. **deploy:stg** — Déploie sur staging (branche `develop`)
4. **deploy:prd** — Déploie sur production (branche `main`, déclenchement manuel)

### Workflow recommandé

```bash
# Développement
git checkout develop
git pull origin develop
git checkout -b feature/ma-fonctionnalite

# ... code ...

git add .
git commit -m "feat: ma fonctionnalite"
git push origin feature/ma-fonctionnalite

# Créer une Merge Request develop → puis main pour la prod
```
