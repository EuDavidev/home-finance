-- =============================================
-- Home Finance: Transactions & Budgets Schema
-- Execute this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TRANSACTIONS (transações financeiras)
-- =============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  member_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'outros',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if table already exists
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS member_name TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- 2. BUDGETS (orçamentos mensais por categoria)
-- =============================================

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount_limit NUMERIC(12,2) NOT NULL CHECK (amount_limit > 0),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, category, month, year)
);

-- Add missing columns if table already exists
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- Enable RLS (Row Level Security)
-- =============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Drop existing policies (safe re-run)
-- =============================================

DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;
DROP POLICY IF EXISTS "budgets_delete" ON budgets;

-- =============================================
-- RLS Policies: TRANSACTIONS
-- =============================================

-- Family members can read transactions from their family
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can insert transactions for their family
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can update transactions from their family
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can delete transactions from their family
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- =============================================
-- RLS Policies: BUDGETS
-- =============================================

-- Family members can read budgets from their family
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can insert budgets for their family
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can update budgets from their family
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- Family members can delete budgets from their family
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_transactions_family_id ON transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_family_type ON transactions(family_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_note ON transactions(note);

CREATE INDEX IF NOT EXISTS idx_budgets_family_id ON budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_budgets_family_month_year ON budgets(family_id, month, year);

-- =============================================
-- Enable Realtime
-- =============================================

-- Note: If already added, these will fail harmlessly
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- =============================================
-- Verification Queries (Run these to validate)
-- =============================================

-- Check transactions table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'transactions'
-- ORDER BY ordinal_position;

-- Check budgets table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'budgets'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('transactions', 'budgets');

-- Test: Count transactions
-- SELECT COUNT(*) FROM transactions;

-- Test: Count budgets
-- SELECT COUNT(*) FROM budgets;
