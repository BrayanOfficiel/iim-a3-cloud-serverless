-- Migration 001: Schéma initial Launchpad

-- Enums
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'refused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users (seul le sub Cognito est stocké, pas d'email/name/password)
CREATE TABLE IF NOT EXISTS users (
  id varchar(128) PRIMARY KEY,
  role role NOT NULL DEFAULT 'user',
  created_at timestamp NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  created_by varchar(128) NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Team members (relation N-N users <-> teams)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id varchar(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_email varchar(255) NOT NULL,
  invited_by varchar(128) NOT NULL REFERENCES users(id),
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id varchar(128) REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Assets (fichiers liés aux tâches, stockés dans S3)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename varchar(255) NOT NULL,
  s3_key varchar(512) NOT NULL,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by varchar(128) NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Backups (historique des sauvegardes BDD)
CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename varchar(255) NOT NULL,
  s3_key varchar(512) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
