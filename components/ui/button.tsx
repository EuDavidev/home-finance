import { Pressable, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  className,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading}>
        <LinearGradient
          colors={["#FFB59A", "#FF6B1A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, height: 56 }}
          className={cn("items-center justify-center", className)}
        >
          {loading ? (
            <ActivityIndicator color="#131315" />
          ) : (
            <Text className="text-background font-bold text-base">{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "h-14 rounded-2xl items-center justify-center",
        variant === "secondary" && "bg-card-elevated border border-border",
        variant === "ghost" && "bg-transparent",
        variant === "danger" && "bg-danger/10",
        className,
      )}
    >
      <Text
        className={cn(
          "font-semibold text-base",
          variant === "secondary" && "text-foreground",
          variant === "ghost" && "text-primary",
          variant === "danger" && "text-danger",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
