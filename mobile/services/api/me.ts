import { apiFetch } from "./client";

export interface User {
  id: string;
  google_id: string;
  display_name: string;
  country: string | null;
  timezone: string;
  language: string;
  leaderboard_visible: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateMeInput {
  country?: string;
  language?: string;
  leaderboard_visible?: boolean;
}

export interface ExportPayload {
  user: User;
  prayer_days: unknown[];
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>("/api/me");
}

export function updateMe(input: UpdateMeInput): Promise<User> {
  return apiFetch<User>("/api/me", { method: "PATCH", body: input });
}

export function deleteAccount(): Promise<void> {
  return apiFetch<void>("/api/me", { method: "DELETE" });
}

export function exportData(): Promise<ExportPayload> {
  return apiFetch<ExportPayload>("/api/me/export");
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}
