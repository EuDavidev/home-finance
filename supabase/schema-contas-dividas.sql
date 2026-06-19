-- =============================================
-- Home Finance: Accounts, Cards & Debts Schema
-- Execute this in Supabase SQL Editor
-- =============================================

-- 0. FAMILIES (grupos familiares)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 0.1 FAMILY MEMBERS (membros da família)
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

-- 1. ACCOUNTS (contas bancárias)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES family_members(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'corrente' CHECK (type IN ('corrente', 'poupanca')),
  bank TEXT,
  account_number TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  icon TEXT,
  color TEXT DEFAULT '#FF6B1A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREDIT CARDS (cartões de crédito)
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  last_four TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  current_bill NUMERIC(12,2) DEFAULT 0,
  closing_day INT CHECK (closing_day BETWEEN 1 AND 31),
  due_day INT CHECK (due_day BETWEEN 1 AND 31),
  color TEXT DEFAULT '#6B5C52',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DEBTS (dívidas ativas)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other' CHECK (type IN ('mortgage', 'credit_card', 'personal_loan', 'vehicle', 'other')),
  total_amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  monthly_payment NUMERIC(12,2) DEFAULT 0,
  total_installments INT,
  paid_installments INT DEFAULT 0,
  start_date DATE,
  icon TEXT,
  alert TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DEBT PAYMENTS (pagamentos de dívidas)
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid_at DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- FAMILIES: users can read/write their own families
CREATE POLICY "families_select" ON families FOR SELECT USING (
  id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (
  created_by = auth.uid()
);
CREATE POLICY "families_update" ON families FOR UPDATE USING (
  id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "families_delete" ON families FOR DELETE USING (
  created_by = auth.uid()
);

-- FAMILY MEMBERS: users can read/manage members of their families
CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "family_members_update" ON family_members FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "family_members_delete" ON family_members FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin')
);

-- ACCOUNTS: family members can read/write their family's accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- CREDIT CARDS
CREATE POLICY "credit_cards_select" ON credit_cards FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "credit_cards_insert" ON credit_cards FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "credit_cards_update" ON credit_cards FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "credit_cards_delete" ON credit_cards FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- DEBTS
CREATE POLICY "debts_select" ON debts FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "debts_insert" ON debts FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "debts_update" ON debts FOR UPDATE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY "debts_delete" ON debts FOR DELETE USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- DEBT PAYMENTS
CREATE POLICY "debt_payments_select" ON debt_payments FOR SELECT USING (
  debt_id IN (SELECT id FROM debts WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
);
CREATE POLICY "debt_payments_insert" ON debt_payments FOR INSERT WITH CHECK (
  debt_id IN (SELECT id FROM debts WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
);
CREATE POLICY "debt_payments_delete" ON debt_payments FOR DELETE USING (
  debt_id IN (SELECT id FROM debts WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
);

-- =============================================
-- Enable Realtime
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE families;
ALTER PUBLICATION supabase_realtime ADD TABLE family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE debt_payments;
