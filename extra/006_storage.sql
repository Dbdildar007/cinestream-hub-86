-- ============================================================
-- CineStream Database Schema - Storage Buckets
-- Generated: 2026-03-08
-- ============================================================

-- Avatar uploads bucket (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
