import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import socketService from "@/services/socket/socket.service";
import pushNotificationService from "@/services/notification/pushNotification.service";
import { ServerNotificationItem } from "@/services/notification/notification.service";
import { renderBoldInvoiceMessage } from "@/constants/notificationTemplates";
import { navigationRef } from "@/services/navigation/navigationService";
import { updateGlobalUnreadCount } from "@/components/reminder/ReminderScreen";

const appIcon = require("@/assets/images/public/dashicon.png");

const InAppNotificationBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentNotification, setCurrentNotification] =
    useState<ServerNotificationItem | null>(null);

  // Starts off-screen (-200)
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    socketService.connect();
    pushNotificationService.init();

    const unsubscribe = socketService.onNewNotification((item) => {
      if (typeof item.unreadCount === "number") {
        updateGlobalUnreadCount(item.unreadCount);
      }

      // Vibrate to provide tactile feedback
      try {
        Vibration.vibrate([0, 150, 80, 150]);
      } catch (_) {}

      // Trigger floating in-app banner
      showBanner(item);

      // ALWAYS display in Android/iOS system notification panel (drawer) with sound & vibration
      pushNotificationService.displayLocalNotification(item);
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showBanner = (item: ServerNotificationItem) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setCurrentNotification(item);

    // Reset position offscreen
    slideAnim.setValue(-200);

    // Smoothly spring down to 0
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 7,
      speed: 12,
    }).start();

    // Auto-dismiss after 6 seconds
    hideTimerRef.current = setTimeout(() => {
      dismissBanner();
    }, 6000);
  };

  const dismissBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -220,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotification(null);
    });
  };

  const handlePress = () => {
    if (!currentNotification) return;
    dismissBanner();

    if (navigationRef.isReady()) {
      const titleLower = (currentNotification.title || "").toLowerCase();
      if (titleLower.includes("complain")) {
        (navigationRef.current as any)?.navigate("ViewComplainScreen");
      } else if (
        currentNotification.orderId ||
        currentNotification.processOrderId ||
        currentNotification.orderid
      ) {
        (navigationRef.current as any)?.navigate("ViewOrdersScreen", {
          orderId:
            currentNotification.orderId ||
            currentNotification.processOrderId ||
            currentNotification.orderid,
        });
      } else {
        (navigationRef.current as any)?.navigate("ReminderScreen");
      }
    }
  };

  if (!currentNotification) return null;

  const displayMessage =
    currentNotification.message ||
    (currentNotification.invNo
      ? `Order #${currentNotification.invNo} for ${
          currentNotification.customerName ||
          currentNotification.customerId ||
          "Customer"
        }`
      : currentNotification.title);

  // Position below status bar
  const topPosition = Math.max(insets?.top || 0, Platform.OS === "android" ? 36 : 44) + 8;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: topPosition,
        left: 14,
        right: 14,
        zIndex: 999999,
        elevation: 999999,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={{
          backgroundColor: "#6638CE", // Primary signature purple
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: "rgba(255, 255, 255, 0.25)",
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 16,
        }}
      >
        {/* Left: App Icon */}
        <Image
          source={appIcon}
          style={{
            width: 44,
            height: 44,
            resizeMode: "contain",
            marginRight: 12,
          }}
        />

        {/* Right: Text Information */}
        <View style={{ flex: 1 }}>
          {/* Header Brand */}
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: "700",
              color: "#E9D5FF", // Soft lavender accent
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            SalesDash Notification
          </Text>

          {/* Title */}
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: "800",
              color: "#FFFFFF", // Bold crisp white
              marginTop: 1,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {currentNotification.title}
          </Text>

          {/* Message with Bold Invoice No */}
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: "#F3E8FF", // Readable light purple-tinted white
            }}
            numberOfLines={2}
          >
            {renderBoldInvoiceMessage(
              displayMessage,
              {
                fontSize: 12,
                lineHeight: 16,
                color: "#F3E8FF",
              },
              {
                fontSize: 12,
                lineHeight: 16,
                fontWeight: "800",
                color: "#FFFFFF", // Crisp white invoice number
              }
            )}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default InAppNotificationBanner;
