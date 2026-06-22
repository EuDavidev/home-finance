/**
 * Hook para dívidas — busca dívidas e simulação de antecipação.
 */

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { debtService } from "@/services/supabase/debtService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { devError } from "@/lib/errorHandler";
import type { Debt, SimulationResult } from "@/types";

export function useDebts() {
  const { member } = useAuthStore();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDebts = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      setLoading(true);
      const data = await debtService.list(member.family_id);
      setDebts(data);
    } catch (err) {
      devError("Error loading debts:", err);
    } finally {
      setLoading(false);
    }
  }, [member?.family_id]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useRealtimeSubscription(
    "debts-hook",
    member?.family_id,
    "debts",
    fetchDebts,
  );

  const totalDebt = debts.reduce(
    (sum, d) => sum + Number(d.remaining_amount),
    0,
  );
  const totalMonthly = debts.reduce(
    (sum, d) => sum + Number(d.monthly_payment),
    0,
  );

  /** Simula antecipação para uma dívida específica */
  const simulate = useCallback(
    (debtIndex: number, extraPayment: number): SimulationResult | null => {
      const targetDebt = debts[debtIndex];
      if (!targetDebt) return null;
      return debtService.simulateAntecipation(targetDebt, extraPayment);
    },
    [debts],
  );

  return {
    debts,
    loading,
    totalDebt,
    totalMonthly,
    simulate,
    refetch: fetchDebts,
  };
}
