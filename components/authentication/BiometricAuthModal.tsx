import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BiometricAuthModalProps {
  visible: boolean;
  status: "scanning" | "success" | "error";
  onCancel: () => void;
  biometricLabel?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  visible,
  status,
  onCancel,
  biometricLabel = "Fingerprint",
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleSuccessAnim = useRef(new Animated.Value(0)).current;

  // Orbiting ring animation
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (visible && status === "scanning") {
      rotateAnim.setValue(0);
      loop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
    } else {
      rotateAnim.stopAnimation();
    }
    return () => {
      loop?.stop();
    };
  }, [visible, status]);

  // Breathing pulse for logo/fingerprint in scanning mode
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (visible && status === "scanning") {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      pulseLoop?.stop();
    };
  }, [visible, status]);

  // Success bounce scale animation
  useEffect(() => {
    if (status === "success") {
      scaleSuccessAnim.setValue(0);
      Animated.spring(scaleSuccessAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10, 8, 20, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            width: Math.min(SCREEN_WIDTH - 48, 340),
            paddingVertical: 32,
            paddingHorizontal: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Circular Visual Area */}
          <View
            style={{
              width: 140,
              height: 140,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {/* Spinning Radar Ring (Apple Pay style) */}
            {status === "scanning" && (
              <Animated.View
                style={{
                  position: "absolute",
                  width: 136,
                  height: 136,
                  borderRadius: 68,
                  borderWidth: 3,
                  borderColor: "transparent",
                  borderTopColor: "#6C3CD1",
                  borderRightColor: "#9B60E8",
                  borderLeftColor: "#6C3CD1",
                  transform: [{ rotate: spin }],
                }}
              />
            )}

            {/* Static Success / Error Outer Ring */}
            {status === "success" && (
              <View
                style={{
                  position: "absolute",
                  width: 136,
                  height: 136,
                  borderRadius: 68,
                  borderWidth: 3,
                  borderColor: "#10B981",
                  backgroundColor: "#ECFDF5",
                }}
              />
            )}

            {status === "error" && (
              <View
                style={{
                  position: "absolute",
                  width: 136,
                  height: 136,
                  borderRadius: 68,
                  borderWidth: 3,
                  borderColor: "#EF4444",
                  backgroundColor: "#FEF2F2",
                }}
              />
            )}

            {/* Center Content: Logo while scanning, Checkmark on success */}
            {status === "scanning" && (
              <Animated.View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: "#F7F5FC",
                  borderWidth: 1.5,
                  borderColor: "#EADFFC",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: pulseAnim }],
                  shadowColor: "#6C3CD1",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Image
                  source={require("@/assets/images/public/logo.webp")}
                  style={{ width: 64, height: 64 }}
                  resizeMode="contain"
                />
              </Animated.View>
            )}

            {status === "success" && (
              <Animated.View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: "#10B981",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: scaleSuccessAnim }],
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <Ionicons name="checkmark" size={56} color="#FFFFFF" />
              </Animated.View>
            )}

            {status === "error" && (
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: "#EF4444",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={56} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Status Label & Microcopy */}
          {status === "scanning" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color="#6C3CD1"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#1E1B4B",
                    textAlign: "center",
                  }}
                >
                  Scanning {biometricLabel}...
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: 18,
                  paddingHorizontal: 8,
                }}
              >
                Touch the fingerprint sensor or hold your finger to sign in
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#10B981",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                Verified!
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#4B5563",
                  textAlign: "center",
                }}
              >
                Welcome back. Redirecting to Dashboard...
              </Text>
            </>
          )}

          {status === "error" && (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#EF4444",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                Verification Failed
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                Could not verify your identity. Please try again or use your password.
              </Text>
            </>
          )}

          {/* Cancel Button */}
          {status !== "success" && (
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              style={{
                marginTop: 22,
                paddingVertical: 10,
                paddingHorizontal: 28,
                borderRadius: 999,
                backgroundColor: "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#4B5563",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BiometricAuthModal;
