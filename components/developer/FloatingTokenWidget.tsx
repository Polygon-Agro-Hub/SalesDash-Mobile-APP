import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import environment from "@/environment/environment";
import {
  decodeJwt,
  developerOverlayService,
  DecodedTokenInfo,
} from "./developerOverlayService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const FloatingTokenWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<DecodedTokenInfo | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("Loading...");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Position animated value (starts near top-right / top-left)
  const pan = useRef(
    new Animated.ValueXY({ x: 16, y: Platform.OS === "ios" ? 60 : 40 })
  ).current;

  // PanResponder for smooth dragging anywhere on screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only initiate pan when moved more than 2 pixels to allow taps
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Listen to visibility changes
  useEffect(() => {
    const unsubscribe = developerOverlayService.addListener((visible) => {
      setIsVisible(visible);
    });
    return unsubscribe;
  }, []);

  // Quick Refresh function to test refresh token live
  const handleQuickRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        Alert.alert(
          "No Refresh Token",
          "There is no refresh token saved. Please log in first."
        );
        return;
      }

      const res = await axios.post(
        `${environment.API_BASE_URL}api/auth/refresh-token`,
        { refreshToken: storedRefreshToken },
        { timeout: 10000 }
      );

      if (res.data?.success && res.data?.data?.token) {
        const newAccessToken = res.data.data.token;
        const newRefreshToken = res.data.data.refreshToken;

        await AsyncStorage.setItem("authToken", newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem("refreshToken", newRefreshToken);
        }

        const decoded = decodeJwt(newAccessToken);
        setTokenInfo(decoded);
      } else {
        Alert.alert("Refresh Failed", res.data?.message || "Failed to renew token");
      }
    } catch (err: any) {
      console.warn("Widget quick refresh error:", err);
      Alert.alert(
        "Refresh Failed",
        err.response?.data?.message || err.message || "Could not refresh token"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll for token changes and update countdown
  useEffect(() => {
    if (!isVisible) return;

    let timer: NodeJS.Timeout;

    const readAndCalculate = async () => {
      try {
        let token = await AsyncStorage.getItem("authToken");
        if (!token) {
          setRemainingTime("No Token");
          setIsExpired(true);
          setTokenInfo(null);
          return;
        }

        token = token.replace(/^["']|["']$/g, "").trim();
        const decoded = decodeJwt(token);
        setTokenInfo(decoded);

        let expMs = decoded?.exp ? decoded.exp * 1000 : 0;
        if (!expMs) {
          const storedTime = await AsyncStorage.getItem("tokenStoredTime");
          if (storedTime) {
            expMs = new Date(storedTime).getTime() + 12 * 60 * 60 * 1000;
          }
        }

        if (expMs > 0) {
          const nowMs = Date.now();
          const diffMs = expMs - nowMs;

          if (diffMs <= 0) {
            setRemainingTime("EXPIRED");
            setIsExpired(true);
          } else {
            setIsExpired(false);
            const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (days > 0) {
              setRemainingTime(
                `${days}d ${String(hours).padStart(2, "0")}h ${String(
                  minutes
                ).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
              );
            } else {
              setRemainingTime(
                `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
                  2,
                  "0"
                )}m ${String(seconds).padStart(2, "0")}s`
              );
            }
          }
        } else {
          setRemainingTime("Active");
          setIsExpired(false);
        }
      } catch (e) {
        console.warn("Error reading token for widget:", e);
      }
    };

    readAndCalculate();
    timer = setInterval(readAndCalculate, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.pointerEventsWrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {isCollapsed ? (
          // Collapsed Pill View
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsCollapsed(false)}
            style={[
              styles.collapsedPill,
              isExpired ? styles.expiredBorder : styles.activeBorder,
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isExpired ? "#EF4444" : "#10B981" },
              ]}
            />
            <MaterialCommunityIcons
              name="clock-fast"
              size={14}
              color="#A78BFA"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.collapsedText}>{remainingTime}</Text>
          </TouchableOpacity>
        ) : (
          // Expanded Card View
          <View
            style={[
              styles.card,
              isExpired ? styles.expiredBorder : styles.activeBorder,
            ]}
          >
            {/* Header / Drag Bar */}
            <View style={styles.header}>
              <View style={styles.dragGripContainer}>
                <MaterialCommunityIcons
                  name="drag-horizontal"
                  size={18}
                  color="#9CA3AF"
                />
              </View>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isExpired ? "#EF4444" : "#10B981" },
                  ]}
                />
                <Text style={styles.titleText}>JWT Countdown</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => setIsCollapsed(true)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => developerOverlayService.setVisible(false)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Countdown Display */}
            <View style={styles.body}>
              <Text
                style={[
                  styles.countdownText,
                  { color: isExpired ? "#EF4444" : "#34D399" },
                ]}
              >
                {remainingTime}
              </Text>

              {tokenInfo?.empId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Agent:</Text>
                  <Text style={styles.infoValue}>{tokenInfo.empId}</Text>
                </View>
              )}

              {tokenInfo?.exp && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expires:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(tokenInfo.exp * 1000).toLocaleTimeString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}

              {/* Quick Refresh Button to test refresh token live */}
              <TouchableOpacity
                onPress={handleQuickRefresh}
                style={styles.quickRefreshBtn}
                activeOpacity={0.8}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#A78BFA" />
                ) : (
                  <>
                    <Ionicons
                      name="refresh"
                      size={12}
                      color="#A78BFA"
                      style={{ marginRight: 5 }}
                    />
                    <Text style={styles.quickRefreshText}>
                      Test Token Refresh
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer / Drag Hint */}
            <View style={styles.footer}>
              <Text style={styles.footerHint}>Drag anywhere to reposition</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  pointerEventsWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    position: "absolute",
  },
  card: {
    backgroundColor: "rgba(17, 24, 39, 0.94)",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 230,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  collapsedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.92)",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  collapsedText: {
    color: "#F3F4F6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  activeBorder: {
    borderColor: "#10B981",
  },
  expiredBorder: {
    borderColor: "#EF4444",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dragGripContainer: {
    marginRight: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleText: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    padding: 2,
  },
  body: {
    backgroundColor: "rgba(31, 41, 55, 0.7)",
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 4,
    fontVariant: ["tabular-nums"],
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  infoLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  infoValue: {
    color: "#D1D5DB",
    fontSize: 10,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 4,
  },
  footerHint: {
    color: "#6B7280",
    fontSize: 9,
    fontStyle: "italic",
  },
  quickRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(109, 40, 217, 0.25)",
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderRadius: 6,
    paddingVertical: 5,
    marginTop: 6,
  },
  quickRefreshText: {
    color: "#DDD6FE",
    fontSize: 10,
    fontWeight: "700",
  },
});
