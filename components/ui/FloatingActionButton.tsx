import { View, Pressable, Animated, StyleSheet, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface FloatingActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Floating Action Button (FAB) com animação de bounce
 * Posicionado no canto inferior direito
 * Usável em qualquer tela do app
 */
export function FloatingActionButton({
  onPress,
  disabled = false,
}: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animação de entrada (bounce)
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = async () => {
    if (disabled) return;

    // Feedback haptic
    await Haptics.selectionAsync();

    // Animação de clique
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className="w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{
          backgroundColor: disabled ? "#9B8B82" : "#FF6B1A",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={3} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90, // Acima da tab bar (70px) + margem (20px)
    right: 20,
    zIndex: 999,
    // Web uses boxShadow CSS; native uses shadow* props
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 4px 8px rgba(255, 107, 26, 0.3)" }
      : {
          shadowColor: "#FF6B1A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }),
    elevation: 12,
  },
});
