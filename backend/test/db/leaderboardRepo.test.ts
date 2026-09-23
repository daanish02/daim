import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { getLeaderboard, getUserRank } from "../../src/db/leaderboardRepo";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function makeVisibleUser(googleId: string, displayName: string) {
  const user = await upsertUserByGoogleId(env.DB, { googleId, displayName, timezone: "UTC" });
  await env.DB.prepare("UPDATE users SET leaderboard_visible = 1 WHERE id = ?").bind(user.id).run();
  return user;
}

async function setStats(userId: string, points: number, eligible: number) {
  await env.DB.prepare(
    `INSERT INTO user_period_stats (id, user_id, period_type, period_key, points, eligible_points, updated_at)
     VALUES (?, ?, 'monthly', '2026-03', ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), userId, points, eligible, new Date().toISOString())
    .run();
}

describe("getLeaderboard", () => {
  test("sorted by points descending", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    const b = await makeVisibleUser("g-b", "Yusuf");
    await setStats(a.id, 132, 140);
    await setStats(b.id, 128, 140);

    const board = await getLeaderboard(env.DB, "monthly", "2026-03", "points");

    expect(board.map((r) => r.display_name)).toEqual(["Ahmed", "Yusuf"]);
    expect(board[0].points).toBe(132);
  });

  test("sorted by consistency (points/eligible) descending", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    const b = await makeVisibleUser("g-b", "Yusuf");
    await setStats(a.id, 100, 140); // ~71%
    await setStats(b.id, 90, 100); // 90%

    const board = await getLeaderboard(env.DB, "monthly", "2026-03", "consistency");

    expect(board.map((r) => r.display_name)).toEqual(["Yusuf", "Ahmed"]);
  });

  test("excludes users who opted out (leaderboard_visible = 0)", async () => {
    const visible = await makeVisibleUser("g-a", "Ahmed");
    const hidden = await upsertUserByGoogleId(env.DB, { googleId: "g-b", displayName: "Hidden", timezone: "UTC" });
    await setStats(visible.id, 100, 100);
    await setStats(hidden.id, 200, 200);

    const board = await getLeaderboard(env.DB, "monthly", "2026-03", "points");

    expect(board.map((r) => r.display_name)).toEqual(["Ahmed"]);
  });

  test("excludes users with no stats row for that period", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    await makeVisibleUser("g-b", "NoStats"); // never gets a stats row
    await setStats(a.id, 50, 100);

    const board = await getLeaderboard(env.DB, "monthly", "2026-03", "points");

    expect(board.map((r) => r.display_name)).toEqual(["Ahmed"]);
  });

  test("supports limit/offset pagination", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    const b = await makeVisibleUser("g-b", "Yusuf");
    const c = await makeVisibleUser("g-c", "Zara");
    await setStats(a.id, 300, 300);
    await setStats(b.id, 200, 300);
    await setStats(c.id, 100, 300);

    const page1 = await getLeaderboard(env.DB, "monthly", "2026-03", "points", { limit: 2, offset: 0 });
    const page2 = await getLeaderboard(env.DB, "monthly", "2026-03", "points", { limit: 2, offset: 2 });

    expect(page1.map((r) => r.display_name)).toEqual(["Ahmed", "Yusuf"]);
    expect(page2.map((r) => r.display_name)).toEqual(["Zara"]);
  });
});

describe("getUserRank", () => {
  test("1-indexed rank by points among visible users with stats", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    const b = await makeVisibleUser("g-b", "Yusuf");
    const c = await makeVisibleUser("g-c", "Zara");
    await setStats(a.id, 300, 300);
    await setStats(b.id, 200, 300);
    await setStats(c.id, 100, 300);

    expect(await getUserRank(env.DB, "monthly", "2026-03", "points", c.id)).toEqual({
      rank: 3,
      points: 100,
      eligible_points: 300,
    });
  });

  test("rank by consistency uses points/eligible, not raw points", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    const b = await makeVisibleUser("g-b", "Yusuf");
    await setStats(a.id, 100, 140); // ~71%
    await setStats(b.id, 90, 100); // 90%

    expect(await getUserRank(env.DB, "monthly", "2026-03", "consistency", a.id)).toMatchObject({ rank: 2 });
    expect(await getUserRank(env.DB, "monthly", "2026-03", "consistency", b.id)).toMatchObject({ rank: 1 });
  });

  test("returns null when the user has no stats row for that period", async () => {
    const a = await makeVisibleUser("g-a", "Ahmed");
    expect(await getUserRank(env.DB, "monthly", "2026-03", "points", a.id)).toBeNull();
  });

  test("returns null when the user has opted out of the leaderboard", async () => {
    const hidden = await upsertUserByGoogleId(env.DB, { googleId: "g-h", displayName: "Hidden", timezone: "UTC" });
    await setStats(hidden.id, 999, 999);
    expect(await getUserRank(env.DB, "monthly", "2026-03", "points", hidden.id)).toBeNull();
  });
});
