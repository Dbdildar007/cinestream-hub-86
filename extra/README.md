# CineStream - Database Migration Files

This folder contains the complete SQL schema for the CineStream project. These files document the entire database structure and can be used to recreate the database from scratch.

## Files

| File | Description |
|------|-------------|
| `001_create_tables.sql` | All 15 table definitions with columns, types, defaults, constraints, and foreign keys |
| `002_indexes.sql` | Custom indexes for query performance optimization |
| `003_rls_policies.sql` | Row Level Security policies for all tables |
| `004_functions.sql` | Database functions (auto-profile creation, single-device login, auto-update timestamps) |
| `005_realtime.sql` | Supabase Realtime publication configuration |
| `006_storage.sql` | Storage bucket definitions |
| `007_cron_jobs.sql` | Scheduled jobs (pg_cron) for automated tasks |

## Execution Order

Run the files in numerical order (001 → 007) for a clean setup.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `movies` | Unified content store (movies + series via `is_series` flag) |
| `seasons` | Season metadata linked to series in `movies` |
| `episodes` | Episode details linked to seasons |
| `profiles` | User profiles with session management |
| `friendships` | Friend request and connection tracking |
| `chat_messages` | Direct messaging between users |
| `message_reactions` | Emoji reactions on chat messages |
| `call_messages` | WebRTC signaling messages |
| `notifications` | In-app notification system |
| `movie_ratings` | User star ratings for content |
| `movie_reminders` | "Remind Me" for upcoming content |
| `watchlist` | User's saved content list |
| `watch_progress` | Playback resume tracking |
| `watch_parties` | Active watch party sessions |
| `watch_party_history` | Completed watch party records |

## Notes

- Replace `<SUPABASE_URL>` and `<ANON_KEY>` in `007_cron_jobs.sql` with your actual project values
- The `handle_new_user` trigger in `004_functions.sql` attaches to `auth.users` (Supabase Auth)
- All tables use UUID primary keys except `movies` and `episodes` which use TEXT IDs
