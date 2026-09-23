-- Daim initial schema

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    country TEXT,
    timezone TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    leaderboard_visible INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
    id_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE prayer_days (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prayer_date TEXT NOT NULL,

    fajr INTEGER,
    dhuhr INTEGER,
    asr INTEGER,
    maghrib INTEGER,
    isha INTEGER,

    timezone TEXT NOT NULL,
    deadline_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE(user_id, prayer_date)
);

CREATE INDEX idx_prayer_days_user_date ON prayer_days(user_id, prayer_date);
CREATE INDEX idx_prayer_days_deadline ON prayer_days(deadline_at);

CREATE TABLE user_period_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,

    period_type TEXT NOT NULL,
    period_key TEXT NOT NULL,

    points REAL NOT NULL DEFAULT 0,
    eligible_points REAL NOT NULL DEFAULT 0,

    updated_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE(user_id, period_type, period_key)
);

CREATE INDEX idx_user_period_stats_lookup ON user_period_stats(period_type, period_key);

CREATE TABLE admin_users (
    user_id TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
