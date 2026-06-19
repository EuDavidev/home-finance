import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

export default function PerfilScreen() {
  const router = useRouter();
  const { member, family, user, signOut } = useAuthStore();

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center px-5 pt-14 pb-4 gap-3">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FF6B1A" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Perfil</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-5 mb-6 p-5 rounded-2xl" style={{ backgroundColor: "#1F1B19" }}>
          <View className="items-center mb-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: member?.color || "#FF6B1A" }}
            >
              <Text className="text-white text-2xl font-bold">
                {member?.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <Text className="text-white font-bold text-xl">{member?.name}</Text>
            <Text className="text-sm mt-1" style={{ color: "#9B8B82" }}>
              {user?.email}
            </Text>
          </View>

          <View className="gap-3 mt-2">
            <View className="flex-row justify-between py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
              <Text style={{ color: "#9B8B82" }}>Família</Text>
              <Text className="text-white font-medium">{family?.name || "—"}</Text>
            </View>
            <View className="flex-row justify-between py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
              <Text style={{ color: "#9B8B82" }}>Papel</Text>
              <Text className="text-white font-medium">
                {member?.role === "admin" ? "Administrador" : "Membro"}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-5 mt-4">
          <Pressable
            onPress={signOut}
            className="flex-row items-center justify-center p-4 rounded-2xl"
            style={{
              backgroundColor: "rgba(244,67,54,0.08)",
              borderWidth: 1,
              borderColor: "rgba(244,67,54,0.2)",
            }}
          >
            <Text className="font-semibold" style={{ color: "#F44336" }}>
              Sair da conta
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
