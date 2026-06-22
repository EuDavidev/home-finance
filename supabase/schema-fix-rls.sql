-- =============================================
-- SQL Migration: Correção de RLS e Políticas
-- Execute este script no SQL Editor do Supabase.
-- =============================================

-- 1. Função auxiliar Security Definer para evitar recursão infinita
-- Esta função busca as famílias do usuário sem disparar a verificação de política RLS recursiva.
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_uuid UUID)
RETURNS UUID[] 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  f_ids UUID[];
BEGIN
  SELECT array_agg(family_id) INTO f_ids
  FROM family_members
  WHERE user_id = user_uuid;
  RETURN COALESCE(f_ids, ARRAY[]::UUID[]);
END;
$$;

-- 2. Corrigir políticas da tabela FAMILIES
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "families_select_creator" ON families;
DROP POLICY IF EXISTS "families_select_member" ON families;
DROP POLICY IF EXISTS "families_insert" ON families;
DROP POLICY IF EXISTS "families_delete" ON families;

-- Criador pode ver a família
CREATE POLICY "families_select_creator" ON families FOR SELECT USING (
  created_by = auth.uid()
);

-- Membro da família pode ver a família
CREATE POLICY "families_select_member" ON families FOR SELECT USING (
  id = ANY(get_user_family_ids(auth.uid()))
);

CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "families_delete" ON families FOR DELETE USING (
  created_by = auth.uid()
);

-- 3. Corrigir políticas da tabela FAMILY_MEMBERS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_members_select" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_update" ON family_members;
DROP POLICY IF EXISTS "family_members_delete" ON family_members;

-- Um membro pode ver outros membros da mesma família
CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (
  family_id = ANY(get_user_family_ids(auth.uid()))
);

-- Admin da família ou criador pode adicionar novos membros
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
  OR
  (family_id = ANY(get_user_family_ids(auth.uid())) AND 
   EXISTS (
     SELECT 1 FROM family_members 
     WHERE user_id = auth.uid() AND role = 'admin' AND family_id = family_members.family_id
   ))
);

-- Admin da família ou criador pode editar membros
CREATE POLICY "family_members_update" ON family_members FOR UPDATE USING (
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
  OR
  (family_id = ANY(get_user_family_ids(auth.uid())) AND 
   EXISTS (
     SELECT 1 FROM family_members 
     WHERE user_id = auth.uid() AND role = 'admin' AND family_id = family_members.family_id
   ))
);

-- Admin da família ou criador pode remover membros
CREATE POLICY "family_members_delete" ON family_members FOR DELETE USING (
  family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
  OR
  (family_id = ANY(get_user_family_ids(auth.uid())) AND 
   EXISTS (
     SELECT 1 FROM family_members 
     WHERE user_id = auth.uid() AND role = 'admin' AND family_id = family_members.family_id
   ))
);

-- 4. Otimizar e aplicar atualizações em ACCOUNTS, DEBTS, TRANSACTIONS
-- Certificar que as políticas usam a função otimizada para evitar subqueries lentas.
DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (
  family_id = ANY(get_user_family_ids(auth.uid()))
);

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (
  family_id = ANY(get_user_family_ids(auth.uid()))
);

DROP POLICY IF EXISTS "debts_select" ON debts;
CREATE POLICY "debts_select" ON debts FOR SELECT USING (
  family_id = ANY(get_user_family_ids(auth.uid()))
);

DROP POLICY IF EXISTS "debts_insert" ON debts;
CREATE POLICY "debts_insert" ON debts FOR INSERT WITH CHECK (
  family_id = ANY(get_user_family_ids(auth.uid()))
);

-- 5. Trigger automático de UPDATED_AT para manter consistência dos dados
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger nas tabelas principais se ainda não tiverem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_families_updated_at') THEN
    CREATE TRIGGER set_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_family_members_updated_at') THEN
    CREATE TRIGGER set_family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
