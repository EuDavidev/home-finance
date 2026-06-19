import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  member_id: string;
  category: { key: string; label: string; icon: string; color: string };
  account: { name: string };
  family_members: { name: string; color: string };
}

export function useTransactions(filters?: {
  month?: string;     // "2026-04"
  categoryId?: string;
  memberId?: string;
}) {
  const { member } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!member?.family_id) return;

    let query = supabase
      .from("transactions")
      .select(`
        *,
        category:categories(key, label, icon, color),
        account:accounts(name),
        family_members(name, color)
      `)
      .eq("family_id", member.family_id)
      .order("date", { ascending: false });

    if (filters?.month) {
      const [year, month] = filters.month.split("-");
      const start = `${year}-${month}-01`;
      const end = new Date(Number(year), Number(month), 0)
        .toISOString().slice(0, 10);
      query = query.gte("date", start).lte("date", end);
    }

    if (filters?.memberId) {
      query = query.eq("member_id", filters.memberId);
    }

    const { data, error } = await query;
    if (!error && data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();

    // Realtime subscription
    const channel = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${member?.family_id}`,
        },
        () => fetchTransactions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [member?.family_id, filters?.month, filters?.memberId]);

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.amount > 0) acc.receitas += t.amount;
      else acc.despesas += Math.abs(t.amount);
      return acc;
    },
    { receitas: 0, despesas: 0 }
  );

  return { transactions, loading, totals, refetch: fetchTransactions };
}
