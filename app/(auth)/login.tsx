import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { LinearGradient } from "expo-linear-gradient";

const AUTH_COOLDOWN_MS = 30_000;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loginRetryAt, setLoginRetryAt] = useState<number | null>(null);
  const [resetRetryAt, setResetRetryAt] = useState<number | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  const isRateLimitError = (err: any) => {
    const code = err?.status ?? err?.code;
    const message = String(err?.message ?? "").toLowerCase();
    return code === 429 || message.includes("429") || message.includes("rate limit");
  };

  const handleLogin = async () => {
    const now = Date.now();
    if (loginRetryAt && now < loginRetryAt) {
      const waitSeconds = Math.ceil((loginRetryAt - now) / 1000);
      setError(`Aguarde ${waitSeconds}s antes de tentar login novamente.`);
      return;
    }

    try {
      setError("");
      setInfo("");
      setLoading(true);
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;
      if (data.user) {
        setUser(data.user);
        // The root layout will handle navigation based on family membership
      }
    } catch (err: any) {
      if (isRateLimitError(err)) {
        setLoginRetryAt(Date.now() + AUTH_COOLDOWN_MS);
        setError(
          "Muitas tentativas de login em pouco tempo. Aguarde 30 segundos e tente novamente."
        );
      } else {
        setError(err.message || "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const now = Date.now();
    if (resetRetryAt && now < resetRetryAt) {
      const waitSeconds = Math.ceil((resetRetryAt - now) / 1000);
      setError(`Aguarde ${waitSeconds}s para pedir novo link de recuperação.`);
      return;
    }

    if (!email) {
      setError("Informe seu email para recuperar a senha.");
      return;
    }

    try {
      setError("");
      setInfo("");
      setResetLoading(true);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;

      setInfo("Se o email existir, enviamos um link de recuperação.");
    } catch (err: any) {
      if (isRateLimitError(err)) {
        setResetRetryAt(Date.now() + AUTH_COOLDOWN_MS);
        setError(
          "Muitas solicitações de recuperação em pouco tempo. Aguarde 30 segundos e tente novamente."
        );
      } else {
        setError(err.message || "Erro ao solicitar recuperação de senha");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-between py-12">
          {/* Back */}
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-base mb-8">← Voltar</Text>
          </Pressable>

          <View className="gap-6">
            <View>
              <Text className="text-3xl font-bold text-white mb-2">
                Bem-vindo
              </Text>
              <Text className="text-neutral-400">Acesse sua conta</Text>
            </View>

            {error ? (
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: "rgba(244,67,54,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(244,67,54,0.3)",
                }}
              >
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}
            {info ? (
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: "rgba(76,175,80,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(76,175,80,0.3)",
                }}
              >
                <Text className="text-green-400 text-sm">{info}</Text>
              </View>
            ) : null}

            <View className="gap-4">
              <View>
                <Text className="text-white text-sm mb-2 font-medium">
                  Email
                </Text>
                <TextInput
                  placeholder="seu@email.com"
                  placeholderTextColor="#6B5C52"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="rounded-xl px-4 py-3.5 text-white"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </View>

              <View>
                <Text className="text-white text-sm mb-2 font-medium">
                  Senha
                </Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#6B5C52"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="rounded-xl px-4 py-3.5 text-white"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </View>
            </View>

            <Pressable onPress={handleForgotPassword} disabled={resetLoading || loading}>
              <Text className="text-primary text-sm text-right">
                {resetLoading ? "Enviando link..." : "Esqueci minha senha"}
              </Text>
            </Pressable>

            {/* Submit */}
            <Pressable
              onPress={handleLogin}
              disabled={loading || !email || !password}
              style={{ opacity: loading || !email || !password ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={["#FFB59A", "#FF6B1A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#131315" />
                ) : (
                  <Text className="text-background font-bold text-base">
                    Entrar
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View className="items-center mt-6">
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text className="text-neutral-500 text-sm">
                Não tem conta?{" "}
                <Text className="text-primary font-semibold">Criar conta</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
