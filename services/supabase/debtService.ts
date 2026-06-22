/**
 * Debt Service — Acesso ao Supabase para dívidas.
 */

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errorHandler";
import type { Debt, CreateDebtDTO, SimulationResult } from "@/types";

export const debtService = {
  /**
   * Lista dívidas de uma família
   */
  async list(familyId: string): Promise<Debt[]> {
    const { data, error } = await supabase
      .from("debts")
      .select(
        "id, family_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, total_installments, paid_installments, start_date, icon, alert, created_at",
      )
      .eq("family_id", familyId)
      .order("remaining_amount", { ascending: false })
      .returns<Debt[]>();

    if (error) throw toAppError(error);
    return data ?? [];
  },

  /**
   * Cria uma nova dívida
   */
  async create(data: CreateDebtDTO): Promise<Debt> {
    const { data: created, error } = await supabase
      .from("debts")
      .insert(data)
      .select(
        "id, family_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, total_installments, paid_installments, start_date, icon, alert, created_at",
      )
      .single<Debt>();

    if (error) throw toAppError(error);
    return created;
  },

  /**
   * Simula antecipação de pagamento de uma dívida
   * Calcula economia de juros e redução de tempo
   */
  simulateAntecipation(
    debt: Debt,
    extraPayment: number,
  ): SimulationResult | null {
    if (extraPayment <= 0) return null;

    const monthlyRate = Number(debt.interest_rate) / 100 / 12;
    const remaining = Number(debt.remaining_amount);
    const normalPayment = Number(debt.monthly_payment);

    if (normalPayment <= 0) return null;

    // Calculate months without extra
    let balanceNormal = remaining;
    let monthsNormal = 0;
    let totalInterestNormal = 0;
    while (balanceNormal > 0 && monthsNormal < 600) {
      const interest = balanceNormal * monthlyRate;
      totalInterestNormal += interest;
      balanceNormal = balanceNormal + interest - normalPayment;
      monthsNormal++;
      if (balanceNormal < 0) balanceNormal = 0;
    }

    // Calculate months with extra
    let balanceExtra = remaining;
    let monthsExtra = 0;
    let totalInterestExtra = 0;
    const totalPayment = normalPayment + extraPayment;
    while (balanceExtra > 0 && monthsExtra < 600) {
      const interest = balanceExtra * monthlyRate;
      totalInterestExtra += interest;
      balanceExtra = balanceExtra + interest - totalPayment;
      monthsExtra++;
      if (balanceExtra < 0) balanceExtra = 0;
    }

    const savedInterest = Math.max(
      totalInterestNormal - totalInterestExtra,
      0,
    );
    const savedMonths = monthsNormal - monthsExtra;
    const savedYears = Math.floor(savedMonths / 12);
    const savedRemMonths = savedMonths % 12;

    return {
      savedInterest,
      savedMonths,
      savedYears,
      savedRemMonths,
      timeLabel:
        savedYears > 0
          ? `${savedYears} ano${savedYears > 1 ? "s" : ""} e ${savedRemMonths} mes${savedRemMonths !== 1 ? "es" : ""}`
          : `${savedMonths} mes${savedMonths !== 1 ? "es" : ""}`,
    };
  },
};
