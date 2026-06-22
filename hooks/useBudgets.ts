/**
 * Hook para orçamentos — busca orçamentos com gastos calculados.
 */

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { budgetService } from "@/services/supabase/budgetService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { devError } from "@/lib/errorHandler";
import type { BudgetWithSpending } from "@/types";

export function useBudgets(month?: number, year?: number) {
  const { member } = useAuthStore();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const fetchBudgets = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      setLoading(true);
      const data = await budgetService.getWithSpending(
        member.family_id,
        targetMonth,
        targetYear,
      );
      setBudgets(data);
    } catch (err) {
      devError("Error fetching budgets:", err);
    } finally {
      setLoading(false);
    }
  }, [member?.family_id, targetMonth, targetYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Realtime — recarrega quando transações ou orçamentos mudam
  useRealtimeSubscription(
    "budgets-hook",
    member?.family_id,
    ["transactions", "budgets"],
    fetchBudgets,
  );

  // Totais
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalLimit = budgets.reduce((sum, b) => sum + b.amount_limit, 0);
  const totalPercentage =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return {
    budgets,
    loading,
    totalSpent,
    totalLimit,
    totalPercentage,
    refetch: fetchBudgets,
  };
}
