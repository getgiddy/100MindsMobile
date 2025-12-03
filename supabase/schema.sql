-- 100 Minds Mobile - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Extends auth.users with additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SCENARIOS TABLE
-- =============================================
-- Stores leadership training scenarios
CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  persona JSONB,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_scenarios_category ON public.scenarios(category);
CREATE INDEX idx_scenarios_difficulty ON public.scenarios(difficulty);
CREATE INDEX idx_scenarios_created_at ON public.scenarios(created_at DESC);

-- Enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scenarios
CREATE POLICY "Users can view own scenarios"
  ON public.scenarios
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scenarios"
  ON public.scenarios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenarios"
  ON public.scenarios
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenarios"
  ON public.scenarios
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FEEDBACK SESSIONS TABLE
-- =============================================
-- Stores user feedback and performance data
CREATE TABLE IF NOT EXISTS public.feedback_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER NOT NULL CHECK (duration > 0),
  transcript JSONB,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_feedback_user_id ON public.feedback_sessions(user_id);
CREATE INDEX idx_feedback_scenario_id ON public.feedback_sessions(scenario_id);
CREATE INDEX idx_feedback_completed_at ON public.feedback_sessions(completed_at DESC);
CREATE INDEX idx_feedback_score ON public.feedback_sessions(score);

-- Enable RLS
ALTER TABLE public.feedback_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_sessions
CREATE POLICY "Users can view own feedback"
  ON public.feedback_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
  ON public.feedback_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
-- Stores knowledge documents for Tavus personas
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('pdf', 'text', 'markdown', 'docx', 'spreadsheet', 'other')),
  size INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Enable RLS (documents are public for now, can be restricted later)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy - all authenticated users can read documents
CREATE POLICY "Authenticated users can view documents"
  ON public.documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger to auto-update updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PERSONA QUEUE TABLE
-- =============================================
-- Manages async persona creation with Tavus API
CREATE TABLE IF NOT EXISTS public.persona_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  persona_input JSONB NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'error')),
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_persona_queue_scenario_id ON public.persona_queue(scenario_id);
CREATE INDEX idx_persona_queue_status ON public.persona_queue(status);
CREATE INDEX idx_persona_queue_created_at ON public.persona_queue(created_at);

-- Enable RLS
ALTER TABLE public.persona_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for persona_queue
CREATE POLICY "Users can view own persona queue items"
  ON public.persona_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios
      WHERE scenarios.id = persona_queue.scenario_id
      AND scenarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create persona queue items for own scenarios"
  ON public.persona_queue
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios
      WHERE scenarios.id = persona_queue.scenario_id
      AND scenarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own persona queue items"
  ON public.persona_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios
      WHERE scenarios.id = persona_queue.scenario_id
      AND scenarios.user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_persona_queue_updated_at
  BEFORE UPDATE ON public.persona_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA - Initial Scenarios
-- =============================================
-- Insert default scenarios (visible to all users)
-- Note: These will be inserted without a user_id initially
-- You may want to create a "system" user or modify the policy

-- Temporarily disable RLS to insert seed data
ALTER TABLE public.scenarios DISABLE ROW LEVEL SECURITY;

-- Insert seed scenarios (you'll need to update user_id after creating a system user)
-- For now, we'll skip this and let users create their own scenarios

-- Re-enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SEED DATA - Sample Documents
-- =============================================
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

INSERT INTO public.documents (id, name, description, tags, type, size, url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Leadership Best Practices', 'Comprehensive guide to effective leadership strategies', ARRAY['leadership', 'management'], 'pdf', 2048000, 'https://example.com/docs/leadership-best-practices.pdf'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Conflict Resolution Handbook', 'Proven techniques for resolving workplace conflicts', ARRAY['conflict-resolution', 'communication'], 'pdf', 1536000, 'https://example.com/docs/conflict-resolution.pdf'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Team Building Strategies', 'Methods for building cohesive and productive teams', ARRAY['team-building', 'collaboration'], 'markdown', 512000, 'https://example.com/docs/team-building.md'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Performance Management Guide', 'Framework for effective performance reviews and feedback', ARRAY['performance', 'feedback'], 'pdf', 1024000, 'https://example.com/docs/performance-management.pdf'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Change Management Principles', 'Leading teams through organizational change', ARRAY['change-management', 'leadership'], 'pdf', 1792000, 'https://example.com/docs/change-management.pdf'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Communication Skills Workshop', 'Enhancing verbal and written communication', ARRAY['communication', 'soft-skills'], 'text', 768000, 'https://example.com/docs/communication-skills.txt'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Decision Making Framework', 'Structured approach to making difficult decisions', ARRAY['decision-making', 'strategy'], 'markdown', 384000, 'https://example.com/docs/decision-making.md'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Emotional Intelligence in Leadership', 'Developing EQ for better leadership outcomes', ARRAY['emotional-intelligence', 'leadership'], 'pdf', 1280000, 'https://example.com/docs/emotional-intelligence.pdf'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Delegation Best Practices', 'How to delegate effectively and empower your team', ARRAY['delegation', 'management'], 'text', 640000, 'https://example.com/docs/delegation.txt'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Crisis Management Playbook', 'Handling emergencies and high-pressure situations', ARRAY['crisis-management', 'leadership'], 'pdf', 2560000, 'https://example.com/docs/crisis-management.pdf')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View for user progress statistics
CREATE OR REPLACE VIEW public.user_progress_stats AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  AVG(score) as average_score,
  MAX(score) as best_score,
  MIN(score) as lowest_score,
  SUM(duration) as total_duration_seconds,
  MAX(completed_at) as last_session_date
FROM public.feedback_sessions
GROUP BY user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.user_progress_stats TO authenticated;

-- =============================================
-- REALTIME CONFIGURATION
-- =============================================
-- Enable realtime for persona_queue table (for status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.persona_queue;

-- =============================================
-- COMPLETE
-- =============================================
-- Schema setup complete!
-- Next steps:
-- 1. Set your Supabase URL and Anon Key in .env.local
-- 2. Test authentication flow
-- 3. Deploy Tavus proxy Edge Functions
