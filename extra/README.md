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

---

## 🖼️ Image Upload Guide

When uploading images to cloud storage and passing URLs to the database, use the following recommended sizes for each image type.

### Hero / Banner Image (`hero_image` column in `movies` table)

| Property | Value |
|----------|-------|
| **Used in** | Hero carousel on home page (full-width background) |
| **Recommended size** | **1920 × 1080 px** (16:9 aspect ratio) |
| **Minimum size** | 1280 × 720 px |
| **Format** | JPEG or WebP |
| **Max file size** | ~500 KB (compressed) |
| **DB column** | `movies.hero_image` (URL string) |

### Poster Image (`poster` column in `movies` table)

| Property | Value |
|----------|-------|
| **Used in** | Movie/Series cards in rows, search results, watchlist, My List |
| **Recommended size** | **400 × 600 px** (2:3 aspect ratio) |
| **Minimum size** | 300 × 450 px |
| **Format** | JPEG or WebP |
| **Max file size** | ~200 KB (compressed) |
| **DB column** | `movies.poster` (URL string) |

### Movie/Series Card Thumbnail

| Property | Value |
|----------|-------|
| **Used in** | MovieCard & SeriesCard components in category rows |
| **Recommended size** | **400 × 600 px** (2:3 ratio, same as poster) |
| **Note** | Uses the `poster` image — no separate column needed |
| **DB column** | `movies.poster` |

### Modal Detail Image

| Property | Value |
|----------|-------|
| **Used in** | MovieModal & SeriesModal detail view (top banner area) |
| **Recommended size** | **1280 × 720 px** (16:9 aspect ratio) |
| **Minimum size** | 960 × 540 px |
| **Note** | Falls back to `hero_image`, then `poster` if unavailable |
| **DB column** | `movies.hero_image` (reused) |

### Episode Thumbnail (`thumbnail_url` column in `episodes` table)

| Property | Value |
|----------|-------|
| **Used in** | Episode list inside SeriesModal, Continue Watching row |
| **Recommended size** | **640 × 360 px** (16:9 aspect ratio) |
| **Minimum size** | 480 × 270 px |
| **Format** | JPEG or WebP |
| **Max file size** | ~150 KB (compressed) |
| **DB column** | `episodes.thumbnail_url` (URL string) |

### Quick Reference Table

| Image Type | Size (px) | Aspect Ratio | DB Column |
|------------|-----------|--------------|-----------|
| Hero / Banner | 1920 × 1080 | 16:9 | `movies.hero_image` |
| Poster / Card | 400 × 600 | 2:3 | `movies.poster` |
| Modal Banner | 1280 × 720 | 16:9 | `movies.hero_image` |
| Episode Thumbnail | 640 × 360 | 16:9 | `episodes.thumbnail_url` |

### Tips

- **Always use compressed images** — prefer WebP for smaller file sizes with good quality.
- **Use a CDN URL** when storing image URLs in the database for fast global delivery.
- **Consistent aspect ratios** are important — the UI crops/scales images to fit, but wrong ratios may cause unwanted cropping.
- **Upload to Lovable Cloud Storage** or any public CDN, then paste the full URL into the respective database column.

---

## Notes

- Replace `<SUPABASE_URL>` and `<ANON_KEY>` in `007_cron_jobs.sql` with your actual project values
- The `handle_new_user` trigger in `004_functions.sql` attaches to `auth.users` (Supabase Auth)
- All tables use UUID primary keys except `movies` and `episodes` which use TEXT IDs
