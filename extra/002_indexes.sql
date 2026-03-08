-- ============================================================
-- CineStream Database Schema - Indexes
-- Generated: 2026-03-08
-- ============================================================

-- Chat Messages - conversation lookup optimization
CREATE INDEX idx_chat_messages_conversation 
  ON public.chat_messages USING btree (sender_id, receiver_id, created_at);

-- Chat Messages - unread messages lookup
CREATE INDEX idx_chat_messages_receiver 
  ON public.chat_messages USING btree (receiver_id, read_at);
