import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

/**
 * Storage adapter that works in all environments:
 * - Web browser: uses localStorage
 * - React Native: uses AsyncStorage
 * - Server/SSR: uses in-memory fallback
 */
function getStorage() {
  // Server/SSR environment (Node.js) — no localStorage, no AsyncStorage
  if (typeof window === "undefined") {
    const memoryStore = new Map<string, string>();
    return {
      getItem: (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
        return Promise.resolve();
      },
    };
  }

  // Web browser
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) =>
        Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) =>
        Promise.resolve(localStorage.removeItem(key)),
    };
  }

  // React Native (iOS/Android)
  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web" && typeof window !== "undefined",
    flowType: "pkce",
  },
});
