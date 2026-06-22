/**
 * Hook para contas e cartões de crédito.
 */

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { accountService } from "@/services/supabase/accountService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { devError } from "@/lib/errorHandler";
import type { Account, CreditCard } from "@/types";

export function useAccounts() {
  const { member } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      setLoading(true);
      const [accountsData, cardsData] = await Promise.all([
        accountService.listAccounts(member.family_id),
        accountService.listCards(member.family_id),
      ]);
      setAccounts(accountsData);
      setCards(cardsData);
    } catch (err) {
      devError("Error loading accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [member?.family_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeSubscription(
    "accounts-hook",
    member?.family_id,
    ["accounts", "credit_cards"],
    fetchData,
  );

  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );

  return {
    accounts,
    cards,
    loading,
    totalBalance,
    refetch: fetchData,
  };
}
