-- =============================================
-- MIGRATION: Padronizar type de transações
-- De "receita"/"despesa" → "income"/"expense"
-- =============================================
-- 
-- CONTEXTO:
-- O QuickTransactionModal anteriormente salvava transações com
-- type = "receita" ou "despesa". O código foi atualizado para
-- usar "income"/"expense" em todo o app. Este script corrige
-- os dados históricos no banco de dados.
--
-- SEGURANÇA:
-- Este script é idempotente — pode ser executado múltiplas vezes
-- sem efeito colateral. Apenas altera rows que ainda usam os
-- valores antigos.
--
-- INSTRUÇÃO:
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================

-- 1. Verificar quantas transações serão afetadas (PREVIEW)
SELECT 
  type,
  COUNT(*) as total
FROM transactions
WHERE type IN ('receita', 'despesa')
GROUP BY type;

-- 2. Migrar "receita" → "income"
UPDATE transactions
SET type = 'income', updated_at = now()
WHERE type = 'receita';

-- 3. Migrar "despesa" → "expense"
UPDATE transactions
SET type = 'expense', updated_at = now()
WHERE type = 'despesa';

-- 4. Verificar resultado (deve retornar 0 rows)
SELECT COUNT(*) as registros_antigos_restantes
FROM transactions
WHERE type IN ('receita', 'despesa');

-- 5. Verificar distribuição final
SELECT 
  type,
  COUNT(*) as total,
  SUM(amount) as valor_total
FROM transactions
GROUP BY type
ORDER BY type;

-- =============================================
-- OPCIONAL: Adicionar constraint para prevenir
-- valores inválidos no futuro
-- =============================================

-- Remover constraint antiga se existir
DO $$
BEGIN
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Adicionar constraint com valores padronizados
DO $$
BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Descomente e execute para confirmar a constraint:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'transactions'::regclass 
-- AND conname = 'transactions_type_check';
