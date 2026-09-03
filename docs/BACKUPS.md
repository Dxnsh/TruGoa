# MongoDB backups & restore drill

## Which MongoDB are you on?

This project connects with a standard `MONGO_URI` and the code comments
(`config/db.js`: *"Atlas shared tiers can drop long-idle sockets"*) plus the
existing `scripts/backup.js` assume **MongoDB Atlas**. Confirm by looking at your
`MONGO_URI`:

| URI starts with | Hosting | Backups |
|---|---|---|
| `mongodb+srv://…mongodb.net` | **Atlas** (managed) | Atlas Cloud Backup — see below |
| `mongodb://…onrender.com` / a private IP | Self-hosted on Render | **No managed backups** — you must script `mongodump` on a schedule yourself |
| `mongodb://127.0.0.1` / `localhost` | Local dev only | n/a — never your production data |

> If you are **not** on Atlas: that is the top priority. A self-hosted Mongo on
> Render has no snapshots, no point-in-time recovery, and dies with the disk.
> Move to Atlas (even the free M0) or stand up a scheduled `mongodump` to
> off-box storage (S3/Backblaze) before launch. The rest of this doc assumes Atlas.

---

## ⚠️ Is automated backup actually ON right now?

**Check today — this is the #1 launch blocker if it's off:**

1. Atlas → your Project → **Clusters** → your cluster.
2. Look at the cluster tier (shown under the cluster name):

| Tier | Automated backup | What you get |
|---|---|---|
| **M0** (free) | ❌ **none** | Nothing. A dropped collection or bad migration is unrecoverable. |
| **M2 / M5** (shared) | ✅ if enabled | Daily snapshots, 2-day retention, **no** point-in-time |
| **M10+** (dedicated) | ✅ if enabled | Snapshots + point-in-time recovery, configurable retention |

3. If you're on **M0**: you have no backups. Either upgrade to **M2+** (a few
   $/month) or run the scheduled `mongodump` fallback below. Do this before
   real users create data you can't afford to lose.

---

## Enabling Atlas Cloud Backup (M2 and up)

*Dashboard steps — nothing to change in code.*

1. Atlas → **Clusters** → **…** (or **Edit Configuration**) on your cluster.
2. Find **Backup** → toggle **Turn on Cloud Backup** (M10+) or **Turn on
   Backup** (M2/M5) → **Review Changes** → **Apply**.
3. M10+ only — **Clusters → your cluster → Backup → Edit** the snapshot policy:
   - Snapshot frequency: at least **daily**.
   - Retention: **7 days** daily + **4 weeks** weekly is a sane starting point.
   - **Enable Continuous Cloud Backup** (point-in-time restore) — lets you
     restore to any second in the retention window, which is what you want after
     "a bad migration ran at 14:32".
4. Confirm the first snapshot lands: **Backup → Snapshots** should show one
   within a few hours.

### Also do these (Atlas project hardening — dashboard only)

- **Network Access** → restrict to the Render egress IPs / a private endpoint,
  not `0.0.0.0/0`.
- **Database Access** → the app user should have `readWrite` on the app DB only,
  **not** `atlasAdmin` / `Atlas admin`.
- **Alerts** → add "No backup snapshot taken in 26 hours" and "Backup restore
  failed".

---

## Restore drill — prove the backup actually restores

Having backups you've never restored is not having backups. Run this **now**,
and again after any change to the DB or the backup setup.

The drill **never touches your live database.** It restores into a separate
scratch database and verifies it collection-by-collection against the live one,
then drops the scratch database.

```bash
cd backend
npm run restore:drill
```

### Option A — full drill (dumps + restores, needs the MongoDB Database Tools)

`npm run restore:drill` with no arguments:

1. `mongodump` the database in `MONGO_URI` to a temp archive.
2. `mongorestore` it into `‹dbname›_restoredrill_‹timestamp›` on the same cluster.
3. Compares every collection's document count: live vs restored.
4. Drops the scratch database (pass `-- --keep` to keep it).

Requires `mongodump` / `mongorestore` on PATH — install once:
<https://www.mongodb.com/docs/database-tools/installation/>
(Windows: "MongoDB Database Tools" MSI; then add its `bin` to PATH.)

Exit `0` = every live collection is present and populated in the restore.
Exit `1` = a collection was missing or came back empty — **the backup is not safe**.

### Option B — verify an Atlas snapshot restore (no local tools needed)

This tests the **real** Atlas backup, end to end:

1. Atlas → **Clusters → your cluster → Backup → Snapshots**.
2. On a recent snapshot → **Restore** → **Restore to a different cluster** (or a
   new database name on a test cluster). Never restore over production.
3. Wait for the restore to finish; copy that target's connection string.
4. Verify it against live:

   ```bash
   cd backend
   npm run restore:drill -- --verify-only "mongodb+srv://…/‹restored-db-name›"
   ```

   Same pass/fail output as Option A, without needing `mongodump`.

5. Delete the test cluster / scratch database afterwards so it doesn't cost money.

### What "pass" looks like

```
  collection          live    restored   status
  ------------   ---------   ---------   ------
  adminusers             2           2   match
  businesses            41          41   match
  journals               6           6   match
  reviews               18          18   match
  stories                4           4   match
  tourists              12          12   match

✓  RESTORE DRILL PASSED — every live collection is present and populated in the restore.
```

Small "N fewer / N more" deltas are normal if writes happened between the dump
and the check — the drill only fails on a **missing** or **empty** collection.

The `ratelimits` collection (rate-limit counters — see
`docs/RATE_LIMIT_VERIFICATION.md`) is high-churn and self-refilling; the drill
lists it but never fails on it, and it doesn't matter if a backup captures it
mid-window or not at all.

---

## Fallback: scheduled `mongodump` (if you stay on M0, or want a second copy)

`scripts/backup.js` already exists (`npm run backup` → gzip archive in
`backend/backups/`). It is **not** automated. To schedule it:

- **Not on Render Cron** — Render's cron jobs run in a fresh container without
  the DB tools and `backups/` is ephemeral. Instead run it from a machine that
  stays on (or a GitHub Action) on a daily schedule, and push the archive to
  off-box storage (S3, Backblaze B2, Google Drive).
- Keep at least 7 daily archives.
- Test each new archive path with `npm run restore:drill` (Option A points at
  `MONGO_URI`; to test a specific archive, restore it manually with
  `npm run restore -- backups/‹file›.gz` **into a scratch db name**, then
  `npm run restore:drill -- --verify-only`).

---

## Restore runbook (the day it matters)

1. **Stop writes.** Scale the Render service to 0, or put it in maintenance.
2. Atlas → Backup → Snapshots → pick the last-known-good snapshot (or a
   point-in-time just before the incident).
3. **Restore to a new cluster first**, verify with
   `npm run restore:drill -- --verify-only ‹new-uri›`, eyeball key collections
   in Atlas Data Explorer.
4. Once confirmed: either repoint `MONGO_URI` (Render env) at the restored
   cluster and redeploy, or use Atlas "restore to the same cluster" (destructive
   — only after step 3).
5. Bring the service back up. Watch `/health` for `db: "connected"`.
6. Write down what was lost between the snapshot and the incident.
