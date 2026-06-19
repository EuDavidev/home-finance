import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  warm?: boolean;
}

export function KpiCard({ label, value, trend, trendPositive, warm }: KpiCardProps) {
  return (
    <LinearGradient
      colors={warm ? ["#3D2010", "#1F1B19"] : ["#2A2420", "#1F1B19"]}
      style={{ borderRadius: 24, padding: 20 }}
    >
      <Text className="text-muted-fg text-xs uppercase tracking-widest">{label}</Text>
      <Text className="text-foreground text-3xl font-extrabold mt-2 tracking-tight">
        {value}
      </Text>
      {trend && (
        <Text className={`text-sm font-semibold mt-1 ${trendPositive ? "text-success" : "text-danger"}`}>
          {trend}
        </Text>
      )}
    </LinearGradient>
  );
}
