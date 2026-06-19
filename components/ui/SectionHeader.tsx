import { View, Pressable } from "react-native";
import { Text } from "./Text";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: "#F5F0EC",
          fontSize: 18,
          fontFamily: "Sora_700Bold",
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              color: "#FF6B1A",
              fontSize: 13,
              fontFamily: "Sora_600SemiBold",
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
