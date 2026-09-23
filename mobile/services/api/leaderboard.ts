import { apiFetch } from "./client";

export type LeaderboardPeriod = "weekly" | "monthly" | "yearly" | "alltime";
export type LeaderboardSort = "points" | "consistency";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  points: number;
  eligible_points: number;
}

export interface MyRank {
  rank: number;
  points: number;
  eligible_points: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  me: MyRank | null;
}

export function fetchLeaderboard(period: LeaderboardPeriod, sort: LeaderboardSort): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(`/api/leaderboard?period=${period}&sort=${sort}`);
}
