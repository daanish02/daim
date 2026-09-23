# Daim — Updated Technical Specification

The app is now explicitly **Android-first** and will be distributed through **GitHub Releases initially**, before moving to Google Play.

The backend architecture remains the same.

---

## 1. Platform

### V1

**Android mobile app**

Technology:

- **React Native**
- **Expo**
- **TypeScript**

The app will produce an installable **APK** for early distribution. Expo supports APK builds specifically for direct installation on Android devices; AAB becomes the appropriate format once the app moves to Google Play. ([Expo documentation][1])

### Distribution for now

```text
GitHub Repository
       ↓
GitHub Releases
       ↓
Daim APK
       ↓
User downloads & installs
```

GitHub Releases are designed to distribute compiled software binaries and allow release assets to be downloaded directly. ([GitHub Docs][2])

There is **no Play Store dependency for V1**.

Later:

```text
GitHub Releases
       ↓
Google Play
```

The same Android project can be built as an AAB for Play Store distribution later. ([Expo documentation][3])

---

# 2. Repository

The GitHub repository should contain:

```text
daim/
├── mobile/
├── backend/
├── migrations/
├── docs/
└── README.md
```

I would keep the mobile app and backend in the same repository initially.

### GitHub Releases

Each public build gets a version:

```text
v0.1.0
v0.1.1
v0.2.0
```

Release contains:

```text
daim-v0.1.0.apk
```

GitHub allows release assets to be attached directly to releases; individual release assets can currently be up to 2 GiB. ([GitHub Docs][2])

The README should contain a clear:

> **Download Daim for Android**

link to the latest release.

---

# 3. Build strategy

Use Expo/EAS for Android builds.

For early distribution:

```json id="v5fqkh"
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Then:

```bash id="3qg6tx"
eas build --platform android --profile preview
```

Expo documents this APK build path for direct installation on Android devices. ([Expo documentation][1])

We can later add:

```text
production → AAB
```

for Google Play.

---

# 4. Backend

The mobile application communicates with:

```text
React Native / Expo
        ↓ HTTPS
Cloudflare Worker API
        ↓
Cloudflare D1
```

The backend remains:

- Cloudflare Workers
- Hono
- D1
- Google OAuth
- Analytics Engine
- Workers Logs
- Cron Triggers

The mobile app does **not** connect directly to D1.

---

# 5. Authentication on Android

The app uses:

**Google Sign-In**

Flow:

```text
Daim app
   ↓
Google authentication
   ↓
Google identity
   ↓
Daim backend
   ↓
session
   ↓
authenticated app
```

The backend remains authoritative for the user identity.

The stable Google `sub` identifier is used as the external identity.

---

# 6. Session

After authentication, the backend issues an opaque session.

The mobile app stores the session securely using the appropriate Expo secure-storage mechanism rather than ordinary unencrypted local storage.

Every API request sends the authenticated session.

---

# 7. Mobile app structure

```text
mobile/
├── app/
│   ├── home
│   ├── leaderboard
│   ├── day
│   ├── settings
│   └── onboarding
│
├── components/
│   ├── PrayerRow
│   ├── ContributionGraph
│   ├── ConsistencyGraph
│   └── LeaderboardRow
│
├── services/
│   ├── api
│   ├── auth
│   └── storage
│
├── state/
├── theme/
├── i18n/
└── utils/
```

---

# 8. Backend structure

```text
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── prayers.ts
│   │   ├── history.ts
│   │   ├── leaderboard.ts
│   │   ├── account.ts
│   │   └── admin.ts
│   │
│   ├── services/
│   │   ├── prayerService.ts
│   │   ├── scoringService.ts
│   │   ├── leaderboardService.ts
│   │   └── userService.ts
│   │
│   ├── auth/
│   ├── db/
│   ├── analytics/
│   ├── cron/
│   └── middleware/
```

---

# 9. Database

The database design from the previous document remains.

### `users`

```sql
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
```

No custom username.

---

### `sessions`

```sql
CREATE TABLE sessions (
    id_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### `prayer_days`

```sql
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
```

Values:

```text
1    = prayed
-1   = exempt
NULL = pending/unrecorded
```

After the deadline, `NULL` contributes 0 points.

---

### `user_period_stats`

```sql
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
```

---

### `admin_users`

```sql
CREATE TABLE admin_users (
    user_id TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

# 10. Prayer state machine

```text
             PENDING
             /     \
            /       \
       PRAYED     EXEMPT
            \       /
             \     /
            deadline
                ↓
             LOCKED
```

Before the deadline:

```text
pending ↔ prayed
pending ↔ exempt
prayed  ↔ exempt
```

After the deadline:

**No changes.**

Calculation:

```text
prayed  → +1
exempt  → excluded
pending → 0
```

---

# 11. API

Core API remains:

```text
GET  /api/me

GET  /api/home

PUT  /api/prayer-days/:date/:prayer

PUT  /api/prayer-days/:date/exempt

GET  /api/prayer-days?from=&to=

GET  /api/leaderboard?period=&sort=

GET  /api/me/export

PATCH /api/me

DELETE /api/me

POST /api/auth/logout
```

Authentication endpoints handle Google OAuth separately.

---

# 12. Mobile offline behavior

For V1:

**Do not support offline prayer submissions.**

The app should require successful server confirmation before displaying a prayer as permanently recorded.

Reason:

- scoring is server-controlled
- editing deadlines are server-controlled
- duplicate/conflicting writes are avoided
- implementation stays simple

The app can still cache static UI assets and previously fetched read-only information.

Offline write support can be added later if actual usage demonstrates a need for it.

---

# 13. Notifications

The Android app will **not request notification permission** in V1.

No:

- prayer reminders
- streak notifications
- engagement notifications

This keeps the first version aligned with the product philosophy.

---

# 14. App permissions

The app should request the minimum permissions possible.

Ideally:

- Internet access
- No location
- No contacts
- No camera
- No microphone
- No notifications
- No unnecessary device permissions

This is particularly important for a product whose selling point is simplicity and privacy.

---

# 15. GitHub distribution

The repository README should have:

```text
Daim
A simple prayer tracker.

[ Download latest Android APK ]
```

The download points to the latest GitHub release.

GitHub supports stable links to the latest release and release assets. ([GitHub Docs][4])

Example structure:

```text
GitHub
└── Releases
    ├── v0.1.0
    │   └── daim-v0.1.0.apk
    ├── v0.2.0
    │   └── daim-v0.2.0.apk
    └── latest
```

---

# 16. Signing

Even before Play Store publication, the Android APK should be **properly signed**.

Keep the signing credentials secure and backed up.

When Google Play is introduced, maintain the same Android application/package identity and signing strategy so migration is straightforward.

Expo/EAS can manage Android signing credentials for builds, or you can manage them yourself. ([Expo documentation][5])

---

# 17. Versioning

Use semantic-style versions:

```text
0.1.0
0.1.1
0.2.0
...
1.0.0
```

Early versions can remain `0.x`.

Every GitHub release should correspond to a Git tag.

GitHub Releases are based on Git tags and can package the binaries and release notes together. ([GitHub Docs][2])

---

# 18. Backend deployment

The APK distribution being on GitHub does **not** mean the backend runs on GitHub.

Backend remains:

```text
Mobile APK
    ↓
Internet
    ↓
Cloudflare Worker
    ↓
D1
```

Deploy backend separately from the app.

---

# 19. Deployment workflow

### Mobile

```text
Code
 ↓
GitHub
 ↓
EAS Build
 ↓
APK
 ↓
GitHub Release
```

### Backend

```text
Code
 ↓
GitHub
 ↓
Cloudflare deployment
 ↓
Worker
```

Eventually, this can be automated with GitHub Actions, but **manual releases are perfectly adequate for V1**.

---

# 20. Google Play transition later

When you have:

- Google Play Developer account
- Signing setup
- Required compliance materials
- Final production build

the distribution changes from:

```text
GitHub Release → APK
```

to:

```text
Google Play → AAB
```

Google Play requires new apps to use Android App Bundles rather than APKs for store submission. ([Expo documentation][3])

The underlying React Native/Expo application and Cloudflare backend do not need to fundamentally change.

---

# 21. Admin panel

The admin panel remains web-based.

It does **not** need to be another mobile app.

```text
Browser
   ↓
Cloudflare Worker
   ↓
/admin
```

It includes:

- Product analytics
- DAU/WAU/MAU
- Retention
- Prayer activity
- Leaderboard participation
- Performance
- Errors
- System health
- Database usage

No prayer-data editing.

---

# 22. Analytics and observability

Use:

**Cloudflare Analytics Engine**
for Daim-specific product events.

Use:

**Workers Logs**
for infrastructure/application debugging.

Don't add Firebase Analytics, Mixpanel, Sentry, Datadog, etc. initially.

This keeps the dependency count and operating cost low.

---

# 23. Testing

### Android

Test on:

- Android emulator
- At least one physical Android phone
- Different screen sizes
- Different Android versions where practical

### Backend

Automated tests cover:

- authentication
- prayer state transitions
- editing window
- timezone behavior
- scoring
- leaderboard periods
- account deletion
- data export

---

# 24. V1 architecture

The final architecture is:

```text
                         DAIM
                          │
                 React Native + Expo
                          │
                          │ HTTPS
                          ▼
                 Cloudflare Worker
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
       D1          Analytics Engine      Workers Logs
        │
        ├── users
        ├── sessions
        ├── prayer_days
        ├── user_period_stats
        └── admin_users
        │
        ▼
    Cron Triggers

Distribution:
GitHub Repository
       ↓
GitHub Releases
       ↓
      APK

Later:
GitHub/EAS
       ↓
      AAB
       ↓
 Google Play
```

This is the architecture I would build now. The only meaningful platform change later is the **distribution channel**: APK through GitHub initially, AAB through Google Play once you're ready.

[1]: https://docs.expo.dev/build-reference/apk/?utm_source=chatgpt.com "Build APKs for Android Emulators and devices - Expo documentation"
[2]: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases?utm_source=chatgpt.com "About releases - GitHub Docs"
[3]: https://docs.expo.dev/submit/android/?utm_source=chatgpt.com "Submit to the Google Play Store with EAS Submit - Expo documentation"
[4]: https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases?utm_source=chatgpt.com "Linking to releases - GitHub Docs"
[5]: https://docs.expo.dev/build/introduction/?utm_source=chatgpt.com "EAS Build - Expo documentation"
