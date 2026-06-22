import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Plus, ShoppingCart, Banknote } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/format";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/types";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function TransacoesScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { transactions, loading, refetch } = useTransactions({
    month: selectedMonth,
    year: new Date().getFullYear(),
    category: selectedCategory ?? undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Group by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))];

  return (
    <Screen title="Histórico de Transações" subtitle="Revise seus movimentos financeiros recentes." refreshing={refreshing} onRefresh={onRefresh}>
      {/* Month Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3" contentContainerStyle={{ gap: 8 }}>
        {MONTHS.map((month, i) => (
          <Pressable key={month} onPress={() => setSelectedMonth(i + 1)} className="px-4 py-2 rounded-full"
            style={{ backgroundColor: selectedMonth === i + 1 ? "#FF6B1A" : "#1F1B19", borderWidth: 1, borderColor: selectedMonth === i + 1 ? "#FF6B1A" : "rgba(255,255,255,0.06)" }}>
            <Text className="text-sm font-medium" style={{ color: selectedMonth === i + 1 ? "#131315" : "#9B8B82" }}>{month}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-6" contentContainerStyle={{ gap: 8 }}>
          <Pressable onPress={() => setSelectedCategory(null)} className="px-4 py-1.5 rounded-full"
            style={{ backgroundColor: !selectedCategory ? "#FF6B1A" : "transparent", borderWidth: 1, borderColor: !selectedCategory ? "#FF6B1A" : "rgba(255,255,255,0.1)" }}>
            <Text className="text-sm" style={{ color: !selectedCategory ? "#131315" : "#9B8B82" }}>Todas</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable key={cat} onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className="px-4 py-1.5 rounded-full"
              style={{ backgroundColor: selectedCategory === cat ? "#FF6B1A" : "transparent", borderWidth: 1, borderColor: selectedCategory === cat ? "#FF6B1A" : "rgba(255,255,255,0.1)" }}>
              <Text className="text-sm" style={{ color: selectedCategory === cat ? "#131315" : "#9B8B82" }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Transaction List */}
      {Object.entries(grouped).map(([date, items]) => (
        <View key={date} className="px-5 mb-4">
          <Text className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#6B5C52" }}>
            {formatDate(date).toUpperCase()}
          </Text>
          {items.map((t) => (
            <View key={t.id} className="flex-row items-center p-4 rounded-2xl mb-2"
              style={{ backgroundColor: "#1F1B19", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" }}>
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: t.type === "income" ? "rgba(76,175,80,0.12)" : "rgba(255,107,26,0.12)" }}>
                {t.type === "income" ? <Banknote size={18} color="#4CAF50" /> : <ShoppingCart size={18} color="#FF6B1A" />}
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{t.description}</Text>
                <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                  {t.category}{t.member_name ? ` • ${t.member_name}` : ""}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-sm" style={{ color: t.type === "income" ? "#4CAF50" : "#F5F0EC" }}>
                  {t.type === "income" ? "+ " : "- "}{formatCurrency(Number(t.amount))}
                </Text>
                {t.payment_method && <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>{t.payment_method}</Text>}
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Empty state */}
      {transactions.length === 0 && (
        <EmptyState icon="📝" title={`Nenhuma transação em ${MONTHS[selectedMonth - 1]}`}
          description="Adicione uma transação para começar" />
      )}

      {/* FAB */}
      <Pressable onPress={() => router.push("/(app)/modal/nova-transacao")} className="absolute bottom-24 right-5"
        style={{ shadowColor: "#FF6B1A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}>
        <LinearGradient colors={["#FFB59A", "#FF6B1A"]}
          style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
          <Plus size={24} color="#131315" strokeWidth={3} />
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}
