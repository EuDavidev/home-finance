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

const SIGNUP_COOLDOWN_MS = 30_000;

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async () => {
    const now = Date.now();
    if (nextRetryAt && now < nextRetryAt) {
      const waitSeconds = Math.ceil((nextRetryAt - now) / 1000);
      setError(`Aguarde ${waitSeconds}s antes de tentar novamente.`);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setUser(data.user);
        // After registration → go to family setup
        router.replace("/(auth)/family-setup");
      }
    } catch (err: any) {
      const code = err?.status ?? err?.code;
      const message = String(err?.message ?? "");

      if (
        code === 429 ||
        message.includes("429") ||
        message.toLowerCase().includes("rate limit")
      ) {
        setNextRetryAt(Date.now() + SIGNUP_COOLDOWN_MS);
        setError(
          "Muitas tentativas de cadastro em pouco tempo. Aguarde 30 segundos e tente novamente."
        );
      } else {
        setError(message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && email && password && password.length >= 8;

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
          {/* Back button */}
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-base mb-8">← Voltar</Text>
          </Pressable>

          <View className="gap-6">
            {/* Header */}
            <View>
              <Text className="text-3xl font-bold text-white mb-2">
                Criar conta
              </Text>
              <Text className="text-neutral-400">
                Preencha os dados para começar
              </Text>
            </View>

            {/* Error */}
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

            {/* Form */}
            <View className="gap-4">
              <View>
                <Text className="text-white text-sm mb-2 font-medium">
                  Seu Nome
                </Text>
                <TextInput
                  placeholder="Ex: Davi"
                  placeholderTextColor="#6B5C52"
                  value={name}
                  onChangeText={setName}
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
                <Text className="text-neutral-500 text-xs mt-1">
                  Mínimo 8 caracteres
                </Text>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleRegister}
              disabled={loading || !isFormValid}
              style={{ opacity: loading || !isFormValid ? 0.5 : 1 }}
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
                    {nextRetryAt && Date.now() < nextRetryAt
                      ? "Aguarde para tentar novamente"
                      : "Criar conta"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-6">
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text className="text-neutral-500 text-sm">
                Já tem conta?{" "}
                <Text className="text-primary font-semibold">Fazer login</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
