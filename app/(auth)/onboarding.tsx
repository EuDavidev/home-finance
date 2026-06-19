import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "@/lib/fonts";

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-background px-6 justify-between py-12">
      {/* Spacer */}
      <View />

      {/* Content */}
      <View className="items-center">
        {/* Heart Icon */}
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: "#1F1B19" }}
        >
          <Text className="text-5xl">❤️</Text>
        </View>

        {/* Title */}
        <Text className="text-4xl text-white text-center mb-3" style={{ fontFamily: fonts.bold }}>
          The Conscious{"\n"}Ledger
        </Text>

        {/* Subtitle */}
        <Text className="text-base text-neutral-400 text-center" style={{ fontFamily: fonts.regular }}>
          Organização e tranquilidade para o casal.
        </Text>
      </View>

      {/* Image placeholder area */}
      <View
        className="h-40 rounded-2xl mb-8 overflow-hidden"
        style={{ backgroundColor: "rgba(31,27,25,0.5)" }}
      />

      {/* Buttons */}
      <View className="gap-3">
        <Link href="/(auth)/register" asChild>
          <Pressable>
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
              <Text className="text-background text-base" style={{ fontFamily: fonts.bold }}>
                Criar conta
              </Text>
            </LinearGradient>
          </Pressable>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable
            className="h-14 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: "#1F1B19",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-neutral-300 text-base" style={{ fontFamily: fonts.semibold }}>
              Fazer login
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Terms */}
      <Text className="text-xs text-neutral-500 text-center mt-4" style={{ fontFamily: fonts.regular }}>
        Ao continuar, você concorda com nossos{"\n"}Termos.
      </Text>
    </View>
  );
}
