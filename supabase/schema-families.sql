-- =============================================
-- Home Finance: Families & Family Members Tables
-- Execute this ONLY in Supabase SQL Editor
-- (Add only the missing columns and tables)
-- =============================================

-- 1. Add missing columns to FAMILIES (if they don't exist)
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. FAMILY MEMBERS (membros da família) - Create if not exists
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  color TEXT DEFAULT '#FF6B1A',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Add missing columns to FAMILY MEMBERS (if they don't exist)
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FF6B1A',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add constraint if not exists (check constraint for role)
-- Note: Constraints cannot be added with IF NOT EXISTS, so we skip if it causes error
DO $$ 
BEGIN
  ALTER TABLE family_members ADD CONSTRAINT family_members_role_check CHECK (role IN ('admin', 'member'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add unique constraint if not exists
DO $$ 
BEGIN
  ALTER TABLE family_members ADD CONSTRAINT family_members_family_user_unique UNIQUE(family_id, user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- =============================================
-- Enable RLS (Row Level Security)
-- =============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Drop existing policies (if any)
-- =============================================

DROP POLICY IF EXISTS "families_select" ON families;
DROP POLICY IF EXISTS "families_select_creator" ON families;
DROP POLICY IF EXISTS "families_select_member" ON families;
DROP POLICY IF EXISTS "families_insert" ON families;
DROP POLICY IF EXISTS "families_update" ON families;
DROP POLICY IF EXISTS "families_delete" ON families;

DROP POLICY IF EXISTS "family_members_select" ON family_members;
DROP POLICY IF EXISTS "family_members_select_self" ON family_members;
DROP POLICY IF EXISTS "family_members_select_admin" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_update" ON family_members;
DROP POLICY IF EXISTS "family_members_delete" ON family_members;

-- =============================================
-- Simplified Policies: FAMILIES (No Recursion)
-- =============================================

-- Users can read families they created
CREATE POLICY "families_select_creator" ON families FOR SELECT USING (
  created_by = auth.uid()
);

-- Users can create families
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Only creator can delete families
CREATE POLICY "families_delete" ON families FOR DELETE USING (
  created_by = auth.uid()
);

-- =============================================
-- Simplified Policies: FAMILY MEMBERS (No Recursion)
-- =============================================

-- Users can read their own membership ONLY
CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (
  user_id = auth.uid()
);

-- Only creators of the family or admins can insert members
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (
  -- Check if current user is the creator of this family
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
);

-- Only admins of the family can update members
CREATE POLICY "family_members_update" ON family_members FOR UPDATE USING (
  -- User can update only if they are admin in that family
  (user_id = auth.uid() AND role = 'admin')
  OR
  -- Or if they are the creator of the family
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
);

-- Only admins of the family can delete members
CREATE POLICY "family_members_delete" ON family_members FOR DELETE USING (
  -- User can delete only if they are admin in that family
  (user_id = auth.uid() AND role = 'admin')
  OR
  -- Or if they are the creator of the family
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
);

-- =============================================
-- Enable Realtime (if needed - may already exist)
-- =============================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE families;
-- ALTER PUBLICATION supabase_realtime ADD TABLE family_members;
-- Note: If tables are already in publication, these commands will fail.
-- You can safely ignore or skip these if you see the error above.

-- =============================================
-- Create Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_family ON family_members(user_id, family_id);

-- =============================================
-- Verification Queries (Run these to validate)
-- =============================================

-- Check if families table has created_by column
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name='families' AND column_name='created_by';

-- Check if family_members table exists
-- SELECT * FROM information_schema.tables 
-- WHERE table_name='family_members';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE schemaname='public' AND tablename IN ('families', 'family_members');

-- Test query (as authenticated user):
-- SELECT * FROM families LIMIT 1;
-- SELECT * FROM family_members LIMIT 1;
