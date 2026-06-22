/**
 * Budget Service — Acesso ao Supabase para orçamentos.
 */

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errorHandler";
import type { Budget, BudgetWithSpending } from "@/types";

export const budgetService = {
  /**
   * Lista orçamentos de uma família para um mês/ano específico
   */
  async list(
    familyId: string,
    month: number,
    year: number,
  ): Promise<Budget[]> {
    const { data, error } = await supabase
      .from("budgets")
      .select(
        "id, family_id, category, amount_limit, month, year, created_at, updated_at",
      )
      .eq("family_id", familyId)
      .eq("month", month)
      .eq("year", year)
      .returns<Budget[]>();

    if (error) {
      throw toAppError(error);
    }

    return data ?? [];
  },

  /**
   * Lista orçamentos com gastos calculados para cada categoria
   */
  async getWithSpending(
    familyId: string,
    month: number,
    year: number,
  ): Promise<BudgetWithSpending[]> {
    // Buscar orçamentos e transações em paralelo
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const [budgetsRes, transactionsRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("id, family_id, category, amount_limit, month, year, created_at, updated_at")
        .eq("family_id", familyId)
        .eq("month", month)
        .eq("year", year),
      supabase
        .from("transactions")
        .select("category, amount")
        .eq("family_id", familyId)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate),
    ]);

    if (budgetsRes.error) throw toAppError(budgetsRes.error);
    if (transactionsRes.error) throw toAppError(transactionsRes.error);

    // Calcular gastos por categoria
    const categorySpending = new Map<string, number>();
    (transactionsRes.data ?? []).forEach(
      (t: { category: string; amount: number }) => {
        const cat = t.category || "Outros";
        categorySpending.set(
          cat,
          (categorySpending.get(cat) || 0) + Number(t.amount),
        );
      },
    );

    return (budgetsRes.data ?? []).map((b: Budget) => {
      const spent = categorySpending.get(b.category) || 0;
      const limit = Number(b.amount_limit);
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        ...b,
        amount_limit: limit,
        spent,
        percentage,
        exceeded: percentage >= 100,
      };
    });
  },
};
