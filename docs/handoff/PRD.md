# Daim — Product Specification

## 1. Product concept

**Daim** is a minimal Muslim prayer-tracking productivity app.

Core loop:

> **Pray → log it → build consistency → see progress**

The app should encourage prayer without becoming an addictive social product.

---

## 2. Core prayer model

The five daily prayers:

- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

For each prayer:

| State                           |    Score |
| ------------------------------- | -------: |
| **Prayed**                      |        1 |
| **Not recorded after deadline** |        0 |
| **Exempt**                      | Excluded |

There is **no Jamaat/individual distinction** and **no Qaza-specific scoring**.

The goal is simply to track whether the prayer was performed, without trying to judge how it was performed.

---

## 3. Prayer logging

The primary interaction is **one tap**.

```text
Fajr        ✓
Dhuhr       ✓
Asr         ○
Maghrib     ○
Isha        ○
```

Tap an unrecorded prayer → **Prayed**.

Tap an already recorded prayer → undo/change it while it remains editable.

### Exemption

Exempt is a secondary action.

Users can:

> **Mark day as exempt**

which marks all five prayers as exempt.

Individual prayers can also be marked exempt through a secondary action for partial-day exemptions.

Daim does **not** record the reason for an exemption.

---

## 4. Editing window

A prayer remains editable until the **end of the second calendar day after its prayer date**, according to the user's timezone.

Example:

> Wednesday's prayers → editable until Friday 23:59:59.

Rules:

- Future prayers cannot be logged.
- Today's prayers are editable.
- Previous prayers remain editable within their window.
- After the window closes, they are locked.
- Server time determines the deadline.
- User timezone determines the calendar date.

### Unrecorded prayers

While inside the editing window, an unrecorded prayer is **pending**.

After the deadline:

> **Pending → 0 points**

This prevents users from deliberately leaving prayers blank to avoid affecting their score.

The app should explain:

> **Prayers not recorded within 2 days count as 0 points.**

This does **not** claim that the person did not physically pray. It only means Daim has no recorded prayer for scoring purposes.

---

## 5. Consistency

Consistency is intentionally simple:

> **Consistency = points earned ÷ eligible prayer points**

Where:

- Prayed = 1
- Deadline-passed unrecorded = 0
- Exempt = excluded

Example:

> 92 points / 100 eligible points = **92% consistency**

Pending prayers do not count until their editing window expires.

---

## 6. History

Daim stores prayer history to provide:

- Personal history
- Contribution graph
- Consistency trend
- Weekly/monthly/yearly statistics
- Leaderboards

Historical prayers remain editable only within their normal editing window.

---

## 7. Home screen

Home is **today-first**.

Today is the only day prominently presented.

```text
Daim                                      ⚙

Today

Fajr        ✓
Dhuhr       ✓
Asr         ○
Maghrib     ✓
Isha        ○

4 / 5 prayed
80% today

[ 8-week contribution graph ]

[ 4-week consistency graph ]
```

### Previous days

Previous days should not be prominent.

Users access them through the contribution graph.

Tapping a day opens its prayers and allows editing if the editing window is still open.

There is no future-date navigation.

---

## 8. Contribution graph

GitHub-style graph showing the **last 8 weeks / 56 days**.

Each square represents one day.

Intensity:

- 0/5 → empty
- 1/5 → lightest
- 2/5 → light
- 3/5 → medium
- 4/5 → strong
- 5/5 → strongest

Exemptions must not visually imply failure.

The graph is primarily for **personal long-term feedback**.

---

## 9. Consistency line graph

A compact line graph showing consistency over the **last 4 weeks**.

- Fixed **0–100%** Y-axis
- Tracks consistency, not cumulative points
- Purpose: show whether the user's consistency is improving

It should remain visually secondary to today's prayers.

---

## 10. Leaderboards

Leaderboard is the second main tab.

### Periods

- Weekly
- **Monthly — default**
- Yearly
- All time

### Sorting

Users can choose:

- **Points**
- **Consistency**

Example:

```text
1   Ahmed
    132 points · 94%

2   Yusuf
    128 points · 91%
```

There is **no hidden combined ranking score** in V1.

No minimum participation threshold.

No age-dependent ranking formula.

The ranking logic should be immediately understandable.

---

## 11. New and returning users

Users are not penalized retroactively for periods when they were not using Daim.

If someone joins halfway through a month:

> Only their participation from joining onward contributes.

If someone stops using Daim and returns later:

> The missing period is not automatically treated as missed prayers.

They simply resume.

---

## 12. Social features

V1 contains only:

- Global leaderboard
- Leaderboard opt-in/out

No:

- Groups
- Friends
- Chat
- Feed
- Comments
- Likes
- Social posting

The leaderboard is a motivational feature, not the purpose of the product.

---

## 13. Psychology and product philosophy

### Core rule

> **Every interaction should make the user more likely to pray the next prayer, not make them feel worse about the previous one.**

Daim should leave users feeling **encouraged, not judged**.

Therefore:

- Completed prayers should be visually prominent.
- Missing/unrecorded prayers should be neutral, not styled as failures.
- Exemptions should never look like failures.
- Graphs should emphasize progress and patterns rather than deficits.
- Returning after inactivity should not trigger guilt.
- Leaderboards should be optional motivation, not a measure of religious worth.

### Avoid

- Streaks
- Streak-loss punishment
- Badges
- XP
- Loot/rewards
- Aggressive gamification
- Guilt-based notifications
- Notification spam
- Endless social feeds

### Product copy rule

> **Daim never assumes the user failed; it only reports what was recorded.**

For example:

**Avoid:**
"You missed Fajr."

**Use:**
"Fajr not recorded."

The ideal interaction remains:

> **Open → log → see progress → leave**

---

## 14. Data and privacy

Daim should collect as little information as reasonably possible.

### User data

- Google OAuth identity
- Google given/first name as display name
- Fallback to Google display name when necessary
- Country
- Timezone
- Language
- Leaderboard visibility
- Account creation information

There are **no custom usernames** in V1.

### Prayer data

- User ID
- Date
- Five prayer states

Daim does not need to collect:

- Exact location
- Reason for exemption
- Mosque
- Gender
- Age
- Sect/denomination

### Account controls

Users can:

- Download their data
- Delete their account
- Delete their prayer history
- Opt out of the leaderboard

Deleting an account deletes its prayer history.

---

## 15. Authentication

**Google OAuth only.**

No additional login methods are planned for V1.

---

## 16. Notifications

**None.**

No prayer reminders or engagement notifications.

---

## 17. Country

Country is stored as part of the user's profile.

---

## 18. Internationalization

Launch in **English**.

The application should be built with localization support from the beginning so other languages can be added later.

Arabic must support proper **RTL layout**, not merely translated strings.

---

## 19. Branding

### Name

**Daim**

Arabic:

**دائم**

The brand should communicate continuity and regularity while feeling like a modern productivity product.

### Visual direction

- Calm
- Modern
- Minimal
- Mobile-first
- Plenty of whitespace
- Subtle borders/shadows
- No excessive animation

### Palette

```text
Primary:       #176B5B
Dark:          #16302A
Background:    #F8F7F2
Text:          #18201D
Muted:         #89928E
Accent:        #C9A45C
```

Green is dominant.

Gold is used sparingly.

### Logo

The primary mark should use:

> **دائم**

with a contemporary Arabic typeface.

Avoid generic religious imagery such as:

- Crescent/moon symbols
- Mosque silhouettes
- Prayer silhouettes
- Quran imagery

The typography itself should form the identity.

---

## 20. Monetization

Daim is completely free.

No:

- Ads
- Premium subscriptions
- Paywalled tracking
- Selling user data

A small optional:

> **Support Daim**

or

> **Buy me a coffee**

link can exist outside the core prayer experience.

---

## 21. Admin panel

Daim has a small internal **operations/admin panel**.

Its purpose is:

### Analytics

- Total users
- New users
- DAU / WAU / MAU
- Retention
- Prayer logging activity
- Average prayers logged
- Average consistency
- Leaderboard opt-in rate
- Country/language distribution

### Performance

- API latency
- Error rate
- Request volume
- Database usage
- Storage usage
- System health

### Debugging

- Structured application logs
- Error logs
- Request IDs
- Endpoint failures
- System/job failures

The admin panel **does not provide functionality to edit users' prayer data**.

Administrative access to individual prayer history should be minimized.

---

## 22. Infrastructure objective

The product should target **₹0/month infrastructure for as long as reasonably possible**.

The exact technical architecture will be defined separately in the technical specification.

---

## 23. Initial navigation

```text
┌─────────────────────────────┐
│            DAIM             │
│                         ⚙   │
│                             │
│          TODAY              │
│                             │
│ Fajr          ✓             │
│ Dhuhr         ✓             │
│ Asr           ○             │
│ Maghrib       ✓             │
│ Isha          ○             │
│                             │
│ 3 / 5 prayed · 60%          │
│                             │
│   8-WEEK CONTRIBUTION       │
│   ▦ ▦ ▦ ▦ ▦ ▦ ▦            │
│                             │
│   4-WEEK CONSISTENCY        │
│   ╱──╲___╱────╲             │
│                             │
├─────────────────────────────┤
│ Home              Leaderboard│
└─────────────────────────────┘
```

---

## 24. Core product definition

> **Daim is a simple, privacy-conscious prayer tracker that lets Muslims quickly record their five daily prayers, see their consistency over time, and optionally compare their progress through simple leaderboards.**

The product deliberately stays small.

**Product design is now frozen for V1.** The next document can therefore focus entirely on the technical architecture, database, APIs, scoring logic, security, deployment, analytics, and admin implementation.
