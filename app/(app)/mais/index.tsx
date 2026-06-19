import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { useRouter } from "expo-router";
import {
  CreditCard,
  Wallet,
  BarChart3,
  User,
  ChevronRight,
  LogOut,
  Bell,
  Upload,
  Users,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

export default function MaisScreen() {
  const router = useRouter();
  const { member, family, signOut } = useAuthStore();

  const menuItems = [
    {
      icon: Users,
      title: "Minha Família",
      subtitle: "Adicione membros e gerencie",
      route: "/(app)/mais/familia",
      isNew: true,
    },
    {
      icon: Upload,
      title: "Importar Extrato OFX",
      subtitle: "Carregue arquivo do banco",
      route: "/(app)/mais/importar-ofx",
      isNew: true,
    },
    {
      icon: CreditCard,
      title: "Contas e Cartões",
      subtitle: "Gerencie suas contas bancárias",
      route: "/(app)/mais/contas",
    },
    {
      icon: Wallet,
      title: "Dívidas",
      subtitle: "Controle de dívidas e pagamentos",
      route: "/(app)/mais/dividas",
    },
    {
      icon: BarChart3,
      title: "Análises",
      subtitle: "Gráficos e insights financeiros",
      route: "/(app)/mais/analises",
    },
    {
      icon: User,
      title: "Perfil",
      subtitle: "Configurações da conta",
      route: "/(app)/mais/perfil",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "#2A2420" }}
            >
              <User size={18} color="#FF6B1A" />
            </View>
            <Text className="text-white font-bold text-base tracking-wider">
              HOME FINANCE
            </Text>
          </View>
          <Bell size={22} color="#FF6B1A" />
        </View>

        {/* User Info */}
        <View
          className="mx-5 mb-6 p-5 rounded-2xl"
          style={{ backgroundColor: "#1F1B19" }}
        >
          <View className="flex-row items-center gap-4">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: member?.color || "#FF6B1A" }}
            >
              <Text className="text-white text-xl font-bold">
                {member?.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View>
              <Text className="text-white font-bold text-lg">
                {member?.name || "Usuário"}
              </Text>
              <Text className="text-sm" style={{ color: "#9B8B82" }}>
                {family?.name || "Sem família"}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                {member?.role === "admin" ? "Administrador" : "Membro"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-5 gap-2">
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              className="flex-row items-center p-4 rounded-2xl"
              style={{
                backgroundColor: "#1F1B19",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.04)",
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
              >
                <item.icon size={20} color="#FF6B1A" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  {item.isNew && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(255,107,26,0.3)" }}
                    >
                      <Text className="text-primary text-xs font-bold">
                        Novo
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                  {item.subtitle}
                </Text>
              </View>
              <ChevronRight size={18} color="#6B5C52" />
            </Pressable>
          ))}
        </View>

        {/* Sign Out */}
        <View className="px-5 mt-8">
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center p-4 rounded-2xl gap-2"
            style={{
              backgroundColor: "rgba(244,67,54,0.08)",
              borderWidth: 1,
              borderColor: "rgba(244,67,54,0.2)",
            }}
          >
            <LogOut size={18} color="#F44336" />
            <Text className="font-semibold" style={{ color: "#F44336" }}>
              Sair da conta
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
