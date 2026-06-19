import { View } from "react-native";

interface ProgressBarProps {
  /** Percentage 0-100+ */
  percentage: number;
  /** Height of the bar */
  height?: number;
  /** Override the fill color */
  color?: string;
  /** Background track color */
  trackColor?: string;
}

export function ProgressBar({
  percentage,
  height = 6,
  color,
  trackColor = "rgba(255,255,255,0.08)",
}: ProgressBarProps) {
  const fillColor =
    color ??
    (percentage >= 100
      ? "#F44336"
      : percentage >= 80
      ? "#FF9800"
      : "#FF6B1A");

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.min(Math.max(percentage, 0), 100)}%`,
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}
