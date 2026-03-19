// Rôles utilisateur
export type Role = "user" | "admin";

// Statut d'invitation
export type InvitationStatus = "pending" | "accepted" | "refused";

// Statut de tâche
export type TaskStatus = "todo" | "in_progress" | "done";

// User tel que stocké en DB (sans email/name -- ceux-ci viennent de Cognito)
export interface UserDB {
  id: string;
  role: Role;
  created_at: string;
}

// User complet (après enrichissement Cognito)
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  teamId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  filename: string;
  s3Key: string;
  taskId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Backup {
  id: string;
  filename: string;
  s3Key: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: Pick<User, "id" | "email" | "name" | "role">;
}

export interface AdminStats {
  users: number;
  teams: number;
  projects: number;
  tasks: number;
}
