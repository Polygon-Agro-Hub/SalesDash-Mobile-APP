import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ServerNotificationItem } from "./notification.service";
import socketService from "../socket/socket.service";
import environment from "@/environment/environment";
import { navigationRef, navigate } from "@/services/navigation/navigationService";

const CHANNEL_ID = "default";

// Configure how notifications appear when app is in foreground / background / locked
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  // Silent fallback
}

class PushNotificationService {
  private isInitialized = false;
  private responseSubscription: any = null;
  private registeredTokens = new Set<string>();
  private isRegisteringToken = false;

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Connect to Socket.IO for real-time delivery
      socketService.connect();

      // Ensure notification channel is configured
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Order & Reminder Notifications",
            description: "Live notifications for orders, packages, and deliveries.",
            importance: Notifications.AndroidImportance.MAX,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#6638CE",
            sound: "default",
            enableVibrate: true,
            showBadge: true,
          });
        } catch (channelErr) {
          // Channel creation not supported in this environment
        }
      }

      // Automatically register device push token if user is logged in
      this.registerPushTokenAsync().catch((e) =>
        console.warn("[PushNotificationService] Initial token registration deferred:", e?.message)
      );

      // Handle user tapping on a native system tray / lock screen notification
      try {
        this.responseSubscription =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response?.notification?.request?.content?.data;
            const title = response?.notification?.request?.content?.title || "";
            console.log("📱 User interacted with system notification:", data);

            const titleLower = (title || "").toLowerCase();
            if (titleLower.includes("complain")) {
              navigate("ViewComplainScreen");
            } else if (data?.orderId || data?.processOrderId || data?.orderid) {
              navigate("ViewOrdersScreen", {
                orderId: data.orderId || data.processOrderId || data.orderid,
              });
            } else {
              navigate("ReminderScreen");
            }
          });
      } catch (listenerErr) {
        // Listener not available in this environment
      }

      console.log("[PushNotificationService] Initialized successfully");
    } catch (error) {
      console.warn("[PushNotificationService] Init error:", error);
    }
  }

  /**
   * Check if OS Notification Permission is currently granted
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.warn("[PushNotificationService] hasPermission check error:", error);
      return false;
    }
  }

  /**
   * Request OS System Notification Permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.warn("[PushNotificationService] requestPermissions error:", error);
      return false;
    }
  }

  /**
   * Registers native FCM / Expo Push Tokens with the backend database (notificationpushtoken)
   * Ensures 24/7 background & lockscreen delivery via Firebase Cloud Messaging
   */
  async registerPushTokenAsync(): Promise<void> {
    if (this.isRegisteringToken) return;
    this.isRegisteringToken = true;

    try {
      const rawToken = await AsyncStorage.getItem("authToken");
      if (!rawToken) {
        console.log("ℹ️ [PushNotificationService] User not logged in, skipping push token registration.");
        return;
      }
      const authToken = rawToken.replace(/^["']|["']$/g, "").trim();

      if (!Device.isDevice) {
        console.log("ℹ️ [PushNotificationService] Push notifications require a physical device.");
        return;
      }

      // Check / request permission
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        console.warn("⚠️ [PushNotificationService] Notification permission not granted.");
        return;
      }

      // 1. Native Device Push Token (FCM on Android, APNs on iOS)
      try {
        const devTokenObj = await Notifications.getDevicePushTokenAsync();
        if (devTokenObj?.data) {
          console.log(
            `📱 [PushNotificationService] Obtained native device token (${devTokenObj.type}):`,
            devTokenObj.data.slice(0, 20) + "..."
          );
          await this.sendTokenToBackend(
            authToken,
            devTokenObj.data,
            devTokenObj.type || (Platform.OS === "android" ? "fcm" : "apns")
          );
        }
      } catch (devErr: any) {
        console.warn("⚠️ [PushNotificationService] Native device token not available:", devErr?.message);
      }

      // 2. Expo Push Token (secondary fallback)
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId ??
          "f0851a8a-d2d7-42c2-8f98-a5b1b0099907";
        const expoTokenObj = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        if (expoTokenObj?.data) {
          console.log(
            "📱 [PushNotificationService] Obtained Expo push token:",
            expoTokenObj.data.slice(0, 25) + "..."
          );
          await this.sendTokenToBackend(authToken, expoTokenObj.data, "expo");
        }
      } catch (expoErr: any) {
        console.log("ℹ️ [PushNotificationService] Expo push token not obtained:", expoErr?.message);
      }
    } catch (err: any) {
      console.warn("❌ [PushNotificationService] registerPushToken error:", err?.message || err);
    } finally {
      this.isRegisteringToken = false;
    }
  }

  private async sendTokenToBackend(authToken: string, pushToken: string, tokenType: string): Promise<void> {
    const cacheKey = `${pushToken}_${tokenType}`;
    if (this.registeredTokens.has(cacheKey)) return;

    try {
      const baseUrl = environment.API_BASE_URL.replace(/\/+$/, "");
      const url = `${baseUrl}/api/notifications/save-push-token`;
      const response = await axios.post(
        url,
        {
          pushToken,
          tokenType: tokenType.toLowerCase() === "expo" ? "expo" : "fcm",
          deviceType: Platform.OS,
          platform: Platform.OS,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data?.success || response.data?.status) {
        console.log(`✅ [PushNotificationService] Push token registered on backend (${tokenType})`);
        this.registeredTokens.add(cacheKey);
      }
    } catch (apiErr: any) {
      console.error(
        "❌ [PushNotificationService] Failed to send push token to backend:",
        apiErr?.response?.data || apiErr?.message
      );
    }
  }

  /**
   * Displays an OS-level system notification in the status bar & Lock Screen
   * (Works when app is open, user leaves the app, or app is in background)
   */
  async displayLocalNotification(item: ServerNotificationItem) {
    if (!item || !item.title) return;

    try {
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Order & Reminder Notifications",
            importance: Notifications.AndroidImportance.MAX,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
            enableVibrate: true,
            showBadge: true,
          });
        } catch (_) {}
      }

      const bodyText =
        item.message ||
        (item.invNo
          ? `Order #${item.invNo} for ${item.customerName || item.customerId || "Customer"}`
          : item.title);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.title,
            body: bodyText,
            data: {
              orderId: item.orderId || item.processOrderId || item.orderid,
              invNo: item.invNo || item.invoiceNo,
              ...item,
            },
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            color: "#6638CE",
          },
          trigger: (Platform.OS === "android" ? { channelId: CHANNEL_ID } : null) as any,
        });
      } catch (_) {
        // Fallback without channelId trigger
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.title,
            body: bodyText,
            data: {
              orderId: item.orderId || item.processOrderId || item.orderid,
              invNo: item.invNo || item.invoiceNo,
              ...item,
            },
            sound: "default",
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.warn("[PushNotificationService] Failed to display system notification:", error);
    }
  }

  destroy() {
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
    this.isInitialized = false;
  }
}

export default new PushNotificationService();
