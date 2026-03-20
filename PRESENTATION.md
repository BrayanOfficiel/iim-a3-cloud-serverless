## Partie 1 — Docker + API + Cognito

Supprimer les containers :

```bash
docker compose down
```

Re-build et relancer tout :

```bash
docker compose up -d --build
```

Lancer l'API en local :

```bash
docker compose down && cd code/api && bun run dev
```

Ouvrir Postman, exécuter les requêtes.

Lancer les migrations BDD :

```bash
bash infrastructure/scripts/migrate.sh
```

Déployer l'API sur Lambda STG :

```bash
bash infrastructure/scripts/deploy-api.sh stg
```

---

## Partie 2 — Frontend user

Site : https://d2yyeuqf0nfwk0.cloudfront.net

Inscription, connexion, créer équipe, inviter un 2e user par email, accepter l'invitation, créer projet, créer tâche, uploader un fichier sur une tâche, supprimer le fichier.

Déployer les assets sur S3 :

```bash
bash infrastructure/scripts/deploy-assets.sh stg
```

Déployer le frontend user :

```bash
bash infrastructure/scripts/deploy-frontend.sh stg user
```

---

## Partie 3 — Admin + DevOps

Site : https://d206vvxy6c3qor.cloudfront.net

Login : `admin@lp.fr` / `Admin123!`

Montrer dashboard stats, liste users, liste équipes.

Lancer le cron backup en local :

```bash
cd code/crons && bun run src/backup.ts
```

Déployer le cron :

```bash
bash infrastructure/scripts/deploy-crons.sh stg
```

Push pour déclencher le CI/CD :

```bash
git add -A && git commit -m "demo: test ci/cd" && git push origin stg
```

Ouvrir GitHub Actions, montrer le pipeline.

Sur GitHub : branches `stg`/`prd`, secrets, environment `production` avec approbation.

Montrer les logs : AWS Console > CloudWatch > Log groups > `/aws/lambda/launchpad-api-stg`
