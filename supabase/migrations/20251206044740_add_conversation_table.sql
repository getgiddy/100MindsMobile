-- Migration: Add conversations table and update feedback_sessions
-- Date: 2025-12-06
-- Description: Adds conversations table to track Tavus conversations and links feedback_sessions to conversations

-- =============================================
-- CONVERSATIONS TABLE
-- =============================================
-- Stores Tavus conversation metadata and webhook data
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'ended', 'failed')),
  tavus_metadata JSONB,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_scenario_id ON public.conversations(scenario_id);
CREATE INDEX idx_conversations_conversation_id ON public.conversations(conversation_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_started_at ON public.conversations(started_at DESC);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert/update for webhook processing
CREATE POLICY "Service role can manage conversations"
  ON public.conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to auto-update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- UPDATE FEEDBACK_SESSIONS TABLE
-- =============================================
-- Add conversation_id foreign key to link feedback to conversations
ALTER TABLE public.feedback_sessions 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Create index for conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_conversation_id ON public.feedback_sessions(conversation_id);
