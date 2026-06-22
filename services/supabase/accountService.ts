/**
 * Account Service — Acesso ao Supabase para contas e cartões.
 */

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errorHandler";
import type {
  Account,
  CreateAccountDTO,
  CreditCard,
  CreateCreditCardDTO,
} from "@/types";

export const accountService = {
  /**
   * Lista contas bancárias de uma família
   */
  async listAccounts(familyId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select(
        "id, family_id, member_id, name, type, bank, account_number, balance, icon, color, created_at",
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: true })
      .returns<Account[]>();

    if (error) throw toAppError(error);
    return data ?? [];
  },

  /**
   * Lista cartões de crédito de uma família
   */
  async listCards(familyId: string): Promise<CreditCard[]> {
    const { data, error } = await supabase
      .from("credit_cards")
      .select(
        "id, account_id, family_id, name, last_four, credit_limit, current_bill, closing_day, due_day, color, created_at",
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: true })
      .returns<CreditCard[]>();

    if (error) throw toAppError(error);
    return data ?? [];
  },

  /**
   * Cria uma nova conta bancária
   */
  async createAccount(data: CreateAccountDTO): Promise<Account> {
    const { data: created, error } = await supabase
      .from("accounts")
      .insert(data)
      .select(
        "id, family_id, member_id, name, type, bank, account_number, balance, icon, color, created_at",
      )
      .single<Account>();

    if (error) throw toAppError(error);
    return created;
  },

  /**
   * Cria um novo cartão de crédito
   */
  async createCard(data: CreateCreditCardDTO): Promise<CreditCard> {
    const { data: created, error } = await supabase
      .from("credit_cards")
      .insert(data)
      .select(
        "id, account_id, family_id, name, last_four, credit_limit, current_bill, closing_day, due_day, color, created_at",
      )
      .single<CreditCard>();

    if (error) throw toAppError(error);
    return created;
  },

  /**
   * Busca ou cria uma conta para importação OFX
   */
  async findOrCreateForOFX(params: {
    familyId: string;
    memberId: string;
    accountNumber: string;
    bankName: string;
    bankIcon: string;
    bankColor: string;
    balance: number;
  }): Promise<string> {
    const { data: existing } = await supabase
      .from("accounts")
      .select("id")
      .eq("family_id", params.familyId)
      .eq("account_number", params.accountNumber)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: newAccount, error } = await supabase
      .from("accounts")
      .insert({
        family_id: params.familyId,
        member_id: params.memberId,
        name: `${params.bankName} - ${params.accountNumber}`,
        type: "corrente",
        bank: params.bankName,
        account_number: params.accountNumber,
        balance: params.balance,
        icon: params.bankIcon,
        color: params.bankColor,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) throw toAppError(error);
    return newAccount.id;
  },
};
