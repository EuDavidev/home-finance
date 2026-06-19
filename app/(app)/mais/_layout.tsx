import { Stack } from "expo-router";

export default function MaisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#131315" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="contas" />
      <Stack.Screen name="dividas" />
      <Stack.Screen name="analises" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="familia" />
      <Stack.Screen name="importar-ofx" />
    </Stack>
  );
}
