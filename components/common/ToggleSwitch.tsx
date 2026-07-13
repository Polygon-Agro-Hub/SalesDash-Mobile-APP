import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";

type ToggleSize = "small" | "medium" | "large";

interface ToggleSwitchProps {
  isOn: boolean;
  onColor?: string;
  offColor?: string;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  size?: ToggleSize;
  disabled?: boolean;
  onToggle: (isOn: boolean) => void;
}

const SIZE_MAP: Record<
  ToggleSize,
  { trackWidth: number; trackHeight: number; thumbSize: number; padding: number }
> = {
  small: { trackWidth: 40, trackHeight: 22, thumbSize: 18, padding: 2 },
  medium: { trackWidth: 52, trackHeight: 28, thumbSize: 24, padding: 2 },
  large: { trackWidth: 64, trackHeight: 34, thumbSize: 30, padding: 2 },
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  onColor = "#22C55E",
  offColor = "#D9D9D9",
  label,
  labelStyle,
  size = "medium",
  disabled = false,
  onToggle,
}) => {
  const { trackWidth, trackHeight, thumbSize, padding } = SIZE_MAP[size];
  const travel = trackWidth - thumbSize - padding * 2;

  // 0 -> off, 1 -> on
  const animatedValue = useRef(new Animated.Value(isOn ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOn ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // color interpolation requires JS driver
    }).start();
  }, [isOn, animatedValue]);

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [offColor, onColor],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });

  const handlePress = () => {
    if (disabled) return;
    onToggle(!isOn);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn, disabled }}
      accessibilityLabel={label}
      style={[styles.container, disabled && styles.disabled]}
    >
      {label ? (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            padding,
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    color: "#000",
  },
  track: {
    justifyContent: "center",
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ToggleSwitch;