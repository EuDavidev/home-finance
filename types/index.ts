/**
 * Tipos centralizados do Home Finance
 * Todos os tipos de domínio em um único lugar.
 */

// ─── Auth & Family ─────────────────────────────

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  role: "admin" | "member";
  color: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberWithFamily extends FamilyMember {
  families: Family;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "no-family";

// ─── Transactions ──────────────────────────────

export interface Transaction {
  id: string;
  family_id: string;
  member_id: string | null;
  account_id: string | null;
  member_name: string | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDTO {
  family_id: string;
  member_id: string;
  member_name?: string;
  account_id?: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  note?: string;
  payment_method?: string;
}

export interface TransactionFilters {
  month?: number;
  year?: number;
  category?: string;
  memberId?: string;
  limit?: number;
}

export interface MonthlyTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

// ─── Budgets ───────────────────────────────────

export interface Budget {
  id: string;
  family_id: string;
  category: string;
  amount_limit: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  percentage: number;
  exceeded: boolean;
}

// ─── Accounts & Cards ──────────────────────────

export interface Account {
  id: string;
  family_id: string;
  member_id: string | null;
  name: string;
  type: "corrente" | "poupanca";
  bank: string | null;
  account_number: string | null;
  balance: number;
  icon: string | null;
  color: string;
  created_at: string;
}

export interface CreateAccountDTO {
  family_id: string;
  member_id: string;
  name: string;
  type: "corrente" | "poupanca";
  bank?: string;
  account_number?: string;
  balance?: number;
  icon?: string;
  color?: string;
}

export interface CreditCard {
  id: string;
  account_id: string | null;
  family_id: string;
  name: string;
  last_four: string | null;
  credit_limit: number;
  current_bill: number;
  closing_day: number | null;
  due_day: number | null;
  color: string;
  created_at: string;
}

export interface CreateCreditCardDTO {
  family_id: string;
  account_id?: string;
  name: string;
  last_four?: string;
  credit_limit?: number;
  current_bill?: number;
  closing_day?: number;
  color?: string;
}

// ─── Debts ─────────────────────────────────────

export type DebtType =
  | "mortgage"
  | "credit_card"
  | "personal_loan"
  | "vehicle"
  | "other";

export interface Debt {
  id: string;
  family_id: string;
  name: string;
  type: DebtType;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  total_installments: number | null;
  paid_installments: number;
  start_date: string | null;
  icon: string | null;
  alert: string | null;
  created_at: string;
}

export interface CreateDebtDTO {
  family_id: string;
  name: string;
  type: DebtType;
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  monthly_payment?: number;
  total_installments?: number;
  paid_installments?: number;
  alert?: string;
}

export interface SimulationResult {
  savedInterest: number;
  savedMonths: number;
  savedYears: number;
  savedRemMonths: number;
  timeLabel: string;
}

// ─── Supabase Error ────────────────────────────

export interface AppError {
  message: string;
  code?: string;
  isNetwork?: boolean;
}
