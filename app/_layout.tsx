import "../global.css";
import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import { useFonts } from "expo-font";
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from "@expo-google-fonts/sora";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

// Suppress GoTrue navigator.locks error on web (non-fatal)
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message ?? "";
    if (msg.includes("Lock broken") || msg.includes("navigator.locks")) {
      event.preventDefault();
    }
  });
}

export default function RootLayout() {
  const { user, member, setUser, fetchMember, setStatus } = useAuthStore();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [authReady, setAuthReady] = useState(false);
  const initRef = useRef(false);

  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  // ─── 1. ONE-TIME auth initialization ───
  useEffect(() => {
    if (!navigationState?.key || !fontsLoaded || initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        setStatus("loading");

        // Race getSession against a 5s timeout (web GoTrue lock workaround)
        let session = null;
        try {
          const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null } }>((resolve) =>
              setTimeout(() => resolve({ data: { session: null } }), 5000)
            ),
          ]);
          session = result.data.session;
        } catch {
          // lock error — treat as no session
        }

        if (session?.user) {
          setUser(session.user);
          await fetchMember();
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
      } catch {
        setUser(null);
        setStatus("unauthenticated");
      } finally {
        setAuthReady(true);
      }
    })();
  }, [navigationState?.key, fontsLoaded]);

  // ─── 2. Auth state listener (login/logout events) ───
  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setUser(session?.user ?? null);
          if (session?.user) await fetchMember();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      });
      sub = data.subscription;
    } catch {
      // GoTrue lock — harmless
    }
    return () => sub?.unsubscribe();
  }, []);

  // ─── 3. INITIAL routing only (runs once when auth is ready) ───
  useEffect(() => {
    if (!authReady || !navigationState?.key) return;

    if (user) {
      if (member) {
        router.replace("/(app)/");
      } else {
        router.replace("/(auth)/family-setup");
      }
    } else {
      router.replace("/(auth)/onboarding");
    }
    // Only run when authReady flips to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  // ─── 4. React to login/logout (after initial routing) ───
  useEffect(() => {
    if (!authReady || !navigationState?.key) return;

    // User just logged in
    if (user && member) {
      router.replace("/(app)/");
    }
    // User just logged out
    if (!user && authReady) {
      // Don't redirect if already on an auth page (let user navigate freely)
    }
  }, [user, member]);

  // ─── Loading screen ───
  if (!fontsLoaded || !authReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#131315",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B1A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#131315" }}>
      <StatusBar style="light" />
      <Slot />
    </GestureHandlerRootView>
  );
}
