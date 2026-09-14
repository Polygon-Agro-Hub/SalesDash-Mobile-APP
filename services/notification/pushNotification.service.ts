import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ServerNotificationItem } from "./notification.service";
import socketService from "../socket/socket.service";
import environment from "@/environment/environment";
import { navigationRef } from "@/services/navigation/navigationService";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  (Constants as any).executionEnvironment === "storeClient";

// Configure how notifications appear when app is in foreground / background / locked
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
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

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Connect to Socket.IO for real-time delivery
      socketService.connect();

      // Ensure notification channel is configured
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Order & Reminder Notifications",
            importance: Notifications.AndroidImportance.MAX,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            vibrationPattern: [0, 250, 250, 250],
            enableLights: true,
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
      await this.registerPushTokenAsync();

      // Handle user tapping on a native system tray / lock screen notification
      try {
        this.responseSubscription =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response?.notification?.request?.content?.data;
            console.log("📱 User interacted with system notification:", data);

            if (navigationRef.isReady()) {
              if (data?.orderId || data?.processOrderId || data?.orderid) {
                (navigationRef as any)?.navigate("ViewOrdersScreen", {
                  orderId: data.orderId || data.processOrderId || data.orderid,
                });
              } else {
                (navigationRef as any)?.navigate("ReminderScreen");
              }
            }
          });
      } catch (listenerErr) {
        // Listener not available in this environment
      }
    } catch (error) {
      console.warn("[PushNotificationService] Init error:", error);
    }
  }

  /**
   * Registers Expo / FCM Push Token on the backend for 24/7 background & lockscreen delivery
   */
  async registerPushTokenAsync() {
    try {
      const rawToken = await AsyncStorage.getItem("authToken");
      if (!rawToken) return;
      const token = rawToken.replace(/^["']|["']$/g, "").trim();

      // Request / verify notification permission
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("ℹ️ [PushNotificationService] Notification permission not granted");
          return;
        }
      } catch (permErr) {
        console.warn("[PushNotificationService] Permission check error:", permErr);
      }

      // Skip in Expo Go client because Expo SDK 53+ removed remote push tokens from Expo Go
      const isExpoGo =
        Constants.appOwnership === "expo" ||
        (Constants as any).executionEnvironment === "storeClient";

      if (isExpoGo) {
        return;
      }

      if (!Device.isDevice) {
        console.log("ℹ️ [PushNotificationService] Push tokens require physical device testing.");
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      let pushToken = "";
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        pushToken = tokenData?.data || "";
      } catch (tokenErr) {
        console.warn("[PushNotificationService] Could not retrieve push token:", tokenErr);
        return;
      }

      if (!pushToken) return;

      await axios.post(
        `${environment.API_BASE_URL}api/notifications/register-push-token`,
        {
          pushToken,
          platform: Platform.OS,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      await AsyncStorage.setItem("lastSavedPushToken", pushToken);
      console.log("✅ [PushNotificationService] Registered push token on server:", pushToken);
    } catch (err: any) {
      console.warn("[PushNotificationService] Error registering push token:", err?.message || err);
    }
  }

  /**
   * Displays an OS-level system notification in the status bar & Lock Screen
   * (Works when app is open, user leaves the app, or app is in background)
   */
  async displayLocalNotification(item: ServerNotificationItem) {
    if (!item || !item.title) return;

    try {
      // Ensure Android channel is ready with Sound & High Priority
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Order & Reminder Notifications",
          importance: Notifications.AndroidImportance.MAX,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          vibrationPattern: [0, 250, 250, 250],
          enableLights: true,
          lightColor: "#6638CE",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      }

      const bodyText =
        item.message ||
        (item.invNo
          ? `Order #${item.invNo} for ${item.customerName || item.customerId || "Customer"}`
          : item.title);

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
          color: "#6638CE",
          vibrate: [0, 250, 250, 250],
        },
        trigger: (Platform.OS === "android" ? { channelId: "default" } : null) as any,
      });
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
