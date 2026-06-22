/**
 * Hook genérico para subscription Supabase Realtime.
 * Substitui código duplicado em 6+ screens.
 */

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Cria uma subscription realtime para uma ou mais tabelas.
 *
 * @param channelName - Nome único do channel
 * @param familyId - ID da família para filtrar
 * @param tables - Tabela(s) a observar
 * @param onData - Callback executado quando há mudança
 */
export function useRealtimeSubscription(
  channelName: string,
  familyId: string | undefined,
  tables: string | string[],
  onData: () => void,
): void {
  useEffect(() => {
    if (!familyId) return;

    const tableArray = Array.isArray(tables) ? tables : [tables];
    let channel = supabase.channel(channelName);

    tableArray.forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `family_id=eq.${familyId}`,
        },
        () => onData(),
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, familyId, onData]);
}
