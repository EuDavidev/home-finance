import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface RecentCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  count: number;
  lastUsed: string;
}

/**
 * Hook para obter categorias usadas recentemente pelo membro
 * Prioriza categorias mais usadas nos últimos 30 dias
 * Limite: máximo 5 categorias
 */
export function useRecentCategories() {
  const { member } = useAuthStore();
  const [categories, setCategories] = useState<RecentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.family_id || !member?.id) {
      setLoading(false);
      return;
    }

    fetchRecentCategories();
  }, [member]);

  const fetchRecentCategories = async () => {
    try {
      setLoading(true);

      // Pega transações dos últimos 30 dias deste membro
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("transactions")
        .select("category")
        .eq("family_id", member!.family_id)
        .eq("member_id", member!.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) throw error;

      if (!data) {
        setCategories([]);
        setLoading(false);
        return;
      }

      // Conta frequência de categorias
      const categoryCount = new Map<string, number>();
      const categoryLastUsed = new Map<string, string>();

      data.forEach((tx: any) => {
        const cat = tx.category;
        if (cat) {
          categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
          if (
            !categoryLastUsed.has(cat) ||
            tx.date > categoryLastUsed.get(cat)!
          ) {
            categoryLastUsed.set(cat, tx.date);
          }
        }
      });

      // Converte para array, ordena por frequência, pega top 5
      const sorted = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => ({
          key,
          label: formatCategoryLabel(key),
          icon: getCategoryIcon(key),
          color: getCategoryColor(key),
          count,
          lastUsed:
            categoryLastUsed.get(key) || new Date().toISOString().split("T")[0],
        }));

      setCategories(sorted);
    } catch (err) {
      console.error("Erro ao carregar categorias recentes:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading };
}

// Helpers
function formatCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    mercado: "Mercado",
    casa: "Casa",
    lazer: "Lazer",
    "cama/mesa/banho": "Cama/Mesa",
    streaming: "Streaming",
    saude: "Saúde",
    transporte: "Transporte",
    educacao: "Educação",
    restaurante: "Restaurante",
    renda: "Renda",
    investimentos: "Investimentos",
    dividas: "Dívidas",
    outros: "Outros",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getCategoryIcon(key: string): string {
  const icons: Record<string, string> = {
    mercado: "🛒",
    casa: "🏠",
    lazer: "🎮",
    "cama/mesa/banho": "🛏️",
    streaming: "📺",
    saude: "⚕️",
    transporte: "🚗",
    educacao: "📚",
    restaurante: "🍽️",
    renda: "💰",
    investimentos: "📈",
    dividas: "💳",
    outros: "📌",
  };
  return icons[key] || "📌";
}

function getCategoryColor(key: string): string {
  const colors: Record<string, string> = {
    mercado: "#4CAF50",
    casa: "#2196F3",
    lazer: "#FF9800",
    "cama/mesa/banho": "#E91E63",
    streaming: "#9C27B0",
    saude: "#F44336",
    transporte: "#00BCD4",
    educacao: "#3F51B5",
    restaurante: "#FF5722",
    renda: "#8BC34A",
    investimentos: "#00897B",
    dividas: "#C62828",
    outros: "#757575",
  };
  return colors[key] || "#757575";
}
