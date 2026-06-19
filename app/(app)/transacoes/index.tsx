import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  Plus,
  Bell,
  User,
  ShoppingCart,
  Zap,
  Car,
  Home as HomeIcon,
  Banknote,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/format";
import { LinearGradient } from "expo-linear-gradient";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  member_name?: string;
  payment_method?: string;
}

export default function TransacoesScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      const year = new Date().getFullYear();
      const startOfMonth = new Date(year, selectedMonth, 1).toISOString();
      const endOfMonth = new Date(year, selectedMonth + 1, 0).toISOString();

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("family_id", member.family_id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth)
        .order("date", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data } = await query;
      setTransactions(data ?? []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  }, [member?.family_id, selectedMonth, selectedCategory]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Real-time
  useEffect(() => {
    if (!member?.family_id) return;

    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${member.family_id}`,
        },
        () => loadTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.family_id, loadTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const dateKey = t.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  const categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))];

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
              style={{ backgroundColor: "#2A2420" }}
            >
              <User size={18} color="#FF6B1A" />
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
            Histórico de Transações
          </Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Revise seus movimentos financeiros recentes.
          </Text>
        </View>

        {/* Month Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {MONTHS.map((month, i) => (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(i)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: selectedMonth === i ? "#FF6B1A" : "#1F1B19",
                borderWidth: 1,
                borderColor: selectedMonth === i ? "#FF6B1A" : "rgba(255,255,255,0.06)",
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: selectedMonth === i ? "#131315" : "#9B8B82" }}
              >
                {month}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Filter */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 mb-6"
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => setSelectedCategory(null)}
              className="px-4 py-1.5 rounded-full"
              style={{
                backgroundColor: !selectedCategory ? "#FF6B1A" : "transparent",
                borderWidth: 1,
                borderColor: !selectedCategory ? "#FF6B1A" : "rgba(255,255,255,0.1)",
              }}
            >
              <Text
                className="text-sm"
                style={{ color: !selectedCategory ? "#131315" : "#9B8B82" }}
              >
                Todas
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className="px-4 py-1.5 rounded-full"
                style={{
                  backgroundColor: selectedCategory === cat ? "#FF6B1A" : "transparent",
                  borderWidth: 1,
                  borderColor: selectedCategory === cat ? "#FF6B1A" : "rgba(255,255,255,0.1)",
                }}
              >
                <Text
                  className="text-sm"
                  style={{ color: selectedCategory === cat ? "#131315" : "#9B8B82" }}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Transaction List */}
        {Object.entries(grouped).map(([date, items]) => (
          <View key={date} className="px-5 mb-4">
            <Text
              className="text-xs font-semibold tracking-widest mb-3"
              style={{ color: "#6B5C52" }}
            >
              {formatDate(date).toUpperCase()}
            </Text>

            {items.map((t) => (
              <View
                key={t.id}
                className="flex-row items-center p-4 rounded-2xl mb-2"
                style={{
                  backgroundColor: "#1F1B19",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.04)",
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor: t.type === "income"
                      ? "rgba(76,175,80,0.12)"
                      : "rgba(255,107,26,0.12)",
                  }}
                >
                  {t.type === "income" ? (
                    <Banknote size={18} color="#4CAF50" />
                  ) : (
                    <ShoppingCart size={18} color="#FF6B1A" />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">
                    {t.description}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                    {t.category}
                    {t.member_name ? ` • ${t.member_name}` : ""}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className="font-bold text-sm"
                    style={{
                      color: t.type === "income" ? "#4CAF50" : "#F5F0EC",
                    }}
                  >
                    {t.type === "income" ? "+ " : "- "}
                    {formatCurrency(Number(t.amount))}
                  </Text>
                  {t.payment_method && (
                    <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                      {t.payment_method}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Empty state */}
        {transactions.length === 0 && (
          <View className="items-center py-16 px-5">
            <Text className="text-3xl mb-4">📝</Text>
            <Text className="text-white font-semibold text-base text-center mb-2">
              Nenhuma transação em {MONTHS[selectedMonth]}
            </Text>
            <Text className="text-center text-sm" style={{ color: "#9B8B82" }}>
              Adicione uma transação para começar
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(app)/modal/nova-transacao")}
        className="absolute bottom-24 right-5"
        style={{
          shadowColor: "#FF6B1A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={["#FFB59A", "#FF6B1A"]}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={24} color="#131315" strokeWidth={3} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
