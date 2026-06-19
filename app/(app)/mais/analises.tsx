import { View, ScrollView, Pressable, RefreshControl, Dimensions } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  User,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  ChevronRight,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/format";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthData {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

export default function AnalisesScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const screenWidth = Dimensions.get("window").width;

  const loadData = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      const now = new Date();
      // Calculate start of the 6-month window
      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Single query for all 6 months
      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("family_id", member.family_id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());

      // Group by month client-side
      const monthMap = new Map<string, MonthData>();

      // Initialize all 6 months
      for (let i = 5; i >= 0; i--) {
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

      // Aggregate transactions into months
      (transactions ?? []).forEach((t: any) => {
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

      setMonthlyData(Array.from(monthMap.values()));
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
  }, [member?.family_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Current month data
  const currentMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const totalBalance = currentMonth?.balance ?? 0;
  const totalIncome = currentMonth?.income ?? 0;
  const totalExpense = currentMonth?.expense ?? 0;

  const balanceChange = previousMonth && previousMonth.balance !== 0
    ? ((totalBalance - previousMonth.balance) / Math.abs(previousMonth.balance)) * 100
    : 0;

  // Chart calculations
  const maxBalance = Math.max(...monthlyData.map((d) => Math.abs(d.balance)), 1);
  const maxIncomeExpense = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  // Generate insight
  const generateInsight = () => {
    if (monthlyData.length < 2) return null;

    const curr = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2];

    if (curr.expense < prev.expense) {
      const reduction = Math.round(((prev.expense - curr.expense) / prev.expense) * 100);
      return {
        text: `Seus gastos reduziram ${reduction}% este mês. Ótimo trabalho em manter o orçamento!`,
        positive: true,
      };
    } else if (curr.income > prev.income) {
      const increase = Math.round(((curr.income - prev.income) / prev.income) * 100);
      return {
        text: `Suas receitas aumentaram ${increase}% em relação ao mês anterior. Continue assim!`,
        positive: true,
      };
    } else {
      const increase = Math.round(((curr.expense - prev.expense) / prev.expense) * 100);
      return {
        text: `Atenção: seus gastos aumentaram ${increase}% em relação ao mês anterior. Considere revisar seu orçamento.`,
        positive: false,
      };
    }
  };

  const insight = generateInsight();

  // Cumulative balance for line chart
  let cumulativeBalance = 0;
  const cumulativeData = monthlyData.map((d) => {
    cumulativeBalance += d.balance;
    return { ...d, cumulative: cumulativeBalance };
  });
  const maxCumulative = Math.max(...cumulativeData.map((d) => Math.abs(d.cumulative)), 1);

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B1A" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: member?.color || "#FF6B1A" }}
            >
              <User size={18} color="#FFF" />
            </View>
            <Text className="text-white font-bold text-base tracking-wider">
              HOME FINANCE
            </Text>
          </View>
          <Bell size={22} color="#FF6B1A" />
        </View>

        {/* Title */}
        <View className="px-5 mb-4">
          <Text className="text-white text-2xl font-bold">
            Análises e Gráficos
          </Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Visão detalhada do seu desempenho financeiro mensal.
          </Text>
        </View>

        {/* Total Balance Card */}
        <View className="mx-5 mb-4">
          <LinearGradient
            colors={["#2A2420", "#1F1B19"]}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
              >
                <Text style={{ fontSize: 14 }}>💰</Text>
              </View>
              <Text
                className="text-xs font-semibold tracking-widest"
                style={{ color: "#9B8B82" }}
              >
                SALDO TOTAL
              </Text>
            </View>
            <Text className="text-white text-3xl font-extrabold mb-2">
              {formatCurrency(totalBalance)}
            </Text>
            <View className="flex-row items-center gap-1">
              <TrendingUp size={14} color={balanceChange >= 0 ? "#4CAF50" : "#F44336"} />
              <Text
                className="text-sm font-semibold"
                style={{ color: balanceChange >= 0 ? "#4CAF50" : "#F44336" }}
              >
                {balanceChange >= 0 ? "+" : ""}{balanceChange.toFixed(1)}% vs. mês anterior
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Income / Expense cards */}
        <View className="flex-row px-5 gap-3 mb-6">
          <View className="flex-1">
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "#1F1B19",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Text
                className="text-xs font-semibold tracking-widest mb-2"
                style={{ color: "#4CAF50" }}
              >
                RECEITAS
              </Text>
              <Text className="text-white text-lg font-bold">
                {formatCurrency(totalIncome)}
              </Text>
              <View
                className="w-8 h-8 rounded-full items-center justify-center mt-2 self-end"
                style={{ backgroundColor: "rgba(76,175,80,0.12)" }}
              >
                <ArrowDown size={16} color="#4CAF50" />
              </View>
            </View>
          </View>
          <View className="flex-1">
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "#1F1B19",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Text
                className="text-xs font-semibold tracking-widest mb-2"
                style={{ color: "#F44336" }}
              >
                DESPESAS
              </Text>
              <Text className="text-white text-lg font-bold">
                {formatCurrency(totalExpense)}
              </Text>
              <View
                className="w-8 h-8 rounded-full items-center justify-center mt-2 self-end"
                style={{ backgroundColor: "rgba(244,67,54,0.12)" }}
              >
                <ArrowUp size={16} color="#F44336" />
              </View>
            </View>
          </View>
        </View>

        {/* Balance Evolution Chart (custom SVG-like with views) */}
        {cumulativeData.length > 0 && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-white font-bold text-base">
                    Evolução do Saldo
                  </Text>
                  <Text className="text-xs" style={{ color: "#6B5C52" }}>
                    Últimos 6 meses
                  </Text>
                </View>
                <MoreVertical size={18} color="#6B5C52" />
              </View>

              {/* Y-axis labels */}
              <View className="flex-row mt-4 mb-2">
                <View style={{ width: 40 }}>
                  <Text className="text-xs" style={{ color: "#6B5C52", textAlign: "right" }}>
                    {formatCurrency(maxCumulative, true)}
                  </Text>
                </View>
                <View className="flex-1" />
              </View>

              {/* Chart area */}
              <View className="flex-row items-end" style={{ height: 140, marginLeft: 44 }}>
                {cumulativeData.map((d, i) => {
                  const barHeight = maxCumulative > 0
                    ? Math.max((Math.abs(d.cumulative) / maxCumulative) * 120, 4)
                    : 4;

                  return (
                    <View
                      key={`${d.year}-${d.month}`}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "flex-end",
                        height: "100%",
                      }}
                    >
                      {/* Line dot + bar combo */}
                      <View
                        style={{
                          width: "70%",
                          maxWidth: 40,
                          height: barHeight,
                          borderRadius: 6,
                          backgroundColor: d.cumulative >= 0
                            ? "rgba(255,107,26,0.3)"
                            : "rgba(244,67,54,0.3)",
                        }}
                      />
                      {/* Dot on top */}
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#FF6B1A",
                          position: "absolute",
                          bottom: barHeight - 4,
                        }}
                      />
                      {/* Connecting line to next */}
                      {i < cumulativeData.length - 1 && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: barHeight - 1,
                            right: -10,
                            width: 20,
                            height: 2,
                            backgroundColor: "rgba(255,107,26,0.5)",
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* X-axis labels */}
              <View className="flex-row" style={{ marginLeft: 44, marginTop: 8 }}>
                {cumulativeData.map((d) => (
                  <View
                    key={`label-${d.year}-${d.month}`}
                    style={{ flex: 1, alignItems: "center" }}
                  >
                    <Text className="text-xs" style={{ color: "#6B5C52" }}>
                      {MONTHS_SHORT[d.month]}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Income vs Expense Chart */}
        {monthlyData.length > 0 && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View>
                  <Text className="text-white font-bold text-base">
                    Receitas vs Despesas
                  </Text>
                  <Text className="text-xs" style={{ color: "#6B5C52" }}>
                    Análise comparativa
                  </Text>
                </View>
                {/* Legend */}
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B1A" }} />
                    <Text className="text-xs" style={{ color: "#9B8B82" }}>Receitas</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F44336" }} />
                    <Text className="text-xs" style={{ color: "#9B8B82" }}>Despesas</Text>
                  </View>
                </View>
              </View>

              {/* Bar chart */}
              <View className="flex-row items-end mt-4" style={{ height: 160 }}>
                {monthlyData.map((d) => {
                  const incomeHeight = maxIncomeExpense > 0
                    ? Math.max((d.income / maxIncomeExpense) * 130, 2)
                    : 2;
                  const expenseHeight = maxIncomeExpense > 0
                    ? Math.max((d.expense / maxIncomeExpense) * 130, 2)
                    : 2;

                  return (
                    <View
                      key={`bar-${d.year}-${d.month}`}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 3,
                        height: "100%",
                      }}
                    >
                      {/* Income bar */}
                      <View
                        style={{
                          width: 14,
                          height: incomeHeight,
                          borderRadius: 4,
                          backgroundColor: "#FF6B1A",
                        }}
                      />
                      {/* Expense bar */}
                      <View
                        style={{
                          width: 14,
                          height: expenseHeight,
                          borderRadius: 4,
                          backgroundColor: "#9B8B82",
                        }}
                      />
                    </View>
                  );
                })}
              </View>

              {/* X-axis labels */}
              <View className="flex-row mt-2">
                {monthlyData.map((d) => (
                  <View
                    key={`blabel-${d.year}-${d.month}`}
                    style={{ flex: 1, alignItems: "center" }}
                  >
                    <Text className="text-xs" style={{ color: "#6B5C52" }}>
                      {MONTHS_SHORT[d.month]}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Monthly Insight Card */}
        {insight && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={insight.positive ? ["#2A2420", "#1F1B19"] : ["#3D1515", "#1F1B19"]}
              style={{
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: insight.positive ? "rgba(255,107,26,0.3)" : "rgba(244,67,54,0.3)",
              }}
            >
              <Text className="text-white font-bold text-lg mb-2">
                Insight Mensal
              </Text>
              <Text className="text-sm leading-5 mb-4" style={{ color: "#9B8B82" }}>
                {insight.text}
              </Text>
              <Pressable>
                <LinearGradient
                  colors={["#FFB59A", "#FF6B1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: "#131315", fontWeight: "700", fontSize: 13 }}>
                    Ver Detalhes
                  </Text>
                  <Text style={{ color: "#131315", fontSize: 14 }}>→</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Empty state */}
        {monthlyData.length === 0 && (
          <View className="items-center py-16 px-5">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <Text className="text-3xl">📈</Text>
            </View>
            <Text className="text-white font-bold text-lg text-center mb-2">
              Dados insuficientes
            </Text>
            <Text className="text-center" style={{ color: "#9B8B82" }}>
              Adicione transações para ver suas análises financeiras aqui
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
