// hooks/useRealtimeSync.ts
// Chame no _layout.tsx do (app)/ para sincronizar em background

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function useRealtimeSync() {
  const { member } = useAuthStore();

  useEffect(() => {
    if (!member?.family_id) return;

    // Qualquer mudança nas tabelas → invalida queries locais
    const channel = supabase
      .channel("family-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${member.family_id}`,
        },
        () => {
          /* trigger refetch via Zustand event */
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `family_id=eq.${member.family_id}`,
        },
        () => {},
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.family_id]);
}
