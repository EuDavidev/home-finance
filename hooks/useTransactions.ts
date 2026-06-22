/**
 * Hook para transações — busca, filtra e sincroniza em realtime.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { transactionService } from "@/services/supabase/transactionService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { devError } from "@/lib/errorHandler";
import type { Transaction, TransactionFilters, MonthlyTotals } from "@/types";

export function useTransactions(filters?: TransactionFilters) {
  const { member } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      setLoading(true);
      const data = await transactionService.list(
        member.family_id,
        filters,
      );
      setTransactions(data);
    } catch (err) {
      devError("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [member?.family_id, filters?.month, filters?.year, filters?.category, filters?.memberId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Realtime subscription
  useRealtimeSubscription(
    "transactions-hook",
    member?.family_id,
    "transactions",
    fetchTransactions,
  );

  // Calcula totais localmente
  const totals: MonthlyTotals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount);
        if (t.type === "income") {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 },
    );
  }, [transactions]);

  return { transactions, loading, totals, refetch: fetchTransactions };
}
