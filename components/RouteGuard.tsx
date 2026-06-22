import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/stores/authStore";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireMember?: boolean;
}

export function RouteGuard({
  children,
  requireAuth = true,
  requireMember = false,
}: RouteGuardProps) {
  const router = useRouter();
  const { user, member, status } = useAuthStore();
  const loading = status === "loading";

  useEffect(() => {
    if (loading) return;

    // Se precisa autenticação mas não tem usuário
    if (requireAuth && !user) {
      router.replace("/(auth)/onboarding");
      return;
    }

    // Se precisa membro mas não tem
    if (requireMember && !member) {
      if (user) {
        router.replace("/(auth)/family-setup");
      } else {
        router.replace("/(auth)/onboarding");
      }
      return;
    }
  }, [user, member, loading, requireAuth, requireMember, router]);

  if (loading) {
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

  // Se passou na validação, renderiza children
  if (requireAuth && !user) return null;
  if (requireMember && !member) return null;

  return <>{children}</>;
}
