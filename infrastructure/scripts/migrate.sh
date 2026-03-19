#!/bin/bash
set -euo pipefail

# Script de migration SQL manuelle
# Usage: bash infrastructure/scripts/migrate.sh
# Nécessite: DATABASE_URL dans l'environnement ou un fichier .env

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/code/api/migrations"

# Charger .env si présent
if [ -f "$ROOT_DIR/code/api/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/code/api/.env" | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur: DATABASE_URL non définie"
  exit 1
fi

echo "Connexion à la base de données..."

# Créer la table de suivi des migrations si elle n'existe pas
psql "$DATABASE_URL" -c "
  CREATE TABLE IF NOT EXISTS _migrations (
    id serial PRIMARY KEY,
    filename varchar(255) NOT NULL UNIQUE,
    applied_at timestamp NOT NULL DEFAULT now()
  );
" 2>/dev/null

echo "Recherche des migrations dans $MIGRATIONS_DIR..."

# Parcourir les fichiers .sql dans l'ordre
for migration_file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  filename=$(basename "$migration_file")

  # Vérifier si déjà appliquée
  already_applied=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM _migrations WHERE filename = '$filename';
  " | tr -d ' ')

  if [ "$already_applied" -eq "0" ]; then
    echo "Application de $filename..."
    psql "$DATABASE_URL" -f "$migration_file"

    psql "$DATABASE_URL" -c "
      INSERT INTO _migrations (filename) VALUES ('$filename');
    "
    echo "$filename appliquée avec succès."
  else
    echo "$filename déjà appliquée, ignorée."
  fi
done

echo "Migrations terminées."
