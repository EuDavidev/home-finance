/**
 * Transaction Service — Camada de acesso ao Supabase para transações.
 * Todas as queries são tipadas, com colunas específicas e error handling.
 */

import { supabase } from "@/lib/supabase";
import { toAppError, devError } from "@/lib/errorHandler";
import type {
  Transaction,
  CreateTransactionDTO,
  TransactionFilters,
  MonthlyTotals,
  CategoryBreakdown,
} from "@/types";

const TRANSACTION_COLUMNS =
  "id, family_id, member_id, account_id, member_name, type, amount, description, category, date, note, payment_method, created_at" as const;

export const transactionService = {
  /**
   * Lista transações de uma família com filtros opcionais
   */
  async list(
    familyId: string,
    filters?: TransactionFilters,
  ): Promise<Transaction[]> {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("family_id", familyId)
      .order("date", { ascending: false });

    if (filters?.month && filters?.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(filters.year, filters.month, 0)
        .toISOString()
        .split("T")[0];
      query = query.gte("date", startDate).lte("date", endDate);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.memberId) {
      query = query.eq("member_id", filters.memberId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.returns<Transaction[]>();

    if (error) {
      throw toAppError(error);
    }

    return data ?? [];
  },

  /**
   * Cria uma nova transação
   */
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    const { data: created, error } = await supabase
      .from("transactions")
      .insert(data)
      .select(TRANSACTION_COLUMNS)
      .single<Transaction>();

    if (error) {
      throw toAppError(error);
    }

    return created;
  },

  /**
   * Remove uma transação
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      throw toAppError(error);
    }
  },

  /**
   * Calcula totais mensais (receita, despesa, saldo)
   */
  async getMonthlyTotals(
    familyId: string,
    month: number,
    year: number,
  ): Promise<MonthlyTotals> {
    const startDate = new Date(year, month - 1, 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("family_id", familyId)
      .gte("date", startDate)
      .lte("date", endDate)
      .returns<{ type: string; amount: number }[]>();

    if (error) {
      throw toAppError(error);
    }

    const totals = (data ?? []).reduce(
      (acc, t) => {
        const amount = Number(t.amount);
        if (t.type === "income") {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 },
    );

    totals.balance = totals.income - totals.expense;
    return totals;
  },

  /**
   * Retorna breakdown de gastos por categoria (para o mês)
   */
  async getCategoryBreakdown(
    familyId: string,
    month: number,
    year: number,
  ): Promise<CategoryBreakdown[]> {
    const startDate = new Date(year, month - 1, 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("category, amount")
      .eq("family_id", familyId)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate)
      .returns<{ category: string; amount: number }[]>();

    if (error) {
      throw toAppError(error);
    }

    const categoryMap = new Map<string, number>();
    let totalExpense = 0;

    (data ?? []).forEach((t) => {
      const cat = t.category || "Outros";
      const amount = Number(t.amount);
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
      totalExpense += amount;
    });

    return Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage:
          totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  /**
   * Verifica FITIDs duplicados (para importação OFX)
   */
  async checkDuplicateFitIds(
    familyId: string,
    fitIds: string[],
  ): Promise<Set<string>> {
    const notePatterns = fitIds.map((id) => `[FITID:${id}]`);

    const { data, error } = await supabase
      .from("transactions")
      .select("note")
      .eq("family_id", familyId)
      .in("note", notePatterns)
      .returns<{ note: string }[]>();

    if (error) {
      devError("Error checking duplicate FITIDs:", error);
      return new Set();
    }

    const existingIds = new Set<string>();
    (data ?? []).forEach((t) => {
      const match = t.note?.match(/\[FITID:([^\]]+)\]/);
      if (match) existingIds.add(match[1]);
    });

    return existingIds;
  },

  /**
   * Insere transações em lote (para importação OFX)
   */
  async insertBatch(
    transactions: CreateTransactionDTO[],
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      const { error } = await supabase.from("transactions").insert(batch);

      if (error) {
        throw toAppError(error);
      }

      inserted += batch.length;
      onProgress?.(
        ((Math.floor(i / batchSize) + 1) /
          Math.ceil(transactions.length / batchSize)) *
          100,
      );
    }

    return inserted;
  },

  /**
   * Retorna dados mensais para os últimos N meses (analytics)
   */
  async getMonthlyHistory(
    familyId: string,
    months: number = 6,
  ): Promise<
    { month: number; year: number; income: number; expense: number; balance: number }[]
  > {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, date")
      .eq("family_id", familyId)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .returns<{ type: string; amount: number; date: string }[]>();

    if (error) {
      throw toAppError(error);
    }

    // Initialize all months
    const monthMap = new Map<
      string,
      { month: number; year: number; income: number; expense: number; balance: number }
    >();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
      monthMap.set(key, {
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    // Aggregate
    (data ?? []).forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthData = monthMap.get(key);
      if (monthData) {
        const amount = Number(t.amount);
        if (t.type === "income") {
          monthData.income += amount;
        } else {
          monthData.expense += amount;
        }
        monthData.balance = monthData.income - monthData.expense;
      }
    });

    return Array.from(monthMap.values());
  },
};
