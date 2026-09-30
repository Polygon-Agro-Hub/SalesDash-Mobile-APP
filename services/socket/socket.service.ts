import { io, Socket } from "socket.io-client";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AppState, AppStateStatus } from "react-native";
import { ServerNotificationItem } from "../notification/notification.service";
import { updateGlobalUnreadCount } from "@/components/reminder/ReminderScreen";

const LAST_NOTIFIED_ID_KEY = "@salesdash_last_notified_notification_id";

type NotificationCallback = (notification: ServerNotificationItem) => void;

/**
 * Build a human-readable message for a notification item.
 * Falls back to invoice/customer info when message field is blank.
 */
export const formatNotificationMessage = (item: ServerNotificationItem): string => {
  if (item.message && item.message.trim().length > 0) {
    return item.message;
  }
  const inv = item.invNo
    ? `Order #${item.invNo}`
    : item.orderId
    ? `Order #${item.orderId}`
    : "";
  const customer =
    item.customerName || item.customerId
      ? `for ${item.customerName || item.customerId}`
      : "";
  if (inv && customer) return `${inv} ${customer}`;
  if (inv) return inv;
  return item.title || "You have a new update";
};

class SocketService {
  private socket: Socket | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private packageUpdateListeners: Set<(data?: any) => void> = new Set();
  private isConnecting: boolean = false;
  private currentUserId: number | null = null;

  // High-water mark notification ID tracking (resets each session, backed by AsyncStorage)
  private lastNotifiedId: number = 0;
  private lastKnownUnreadCount: number = -1; // -1 means first check this session

  private fallbackPollingTimer: any = null;
  private hasLoggedConnectionNotice: boolean = false;
  private appStateSubscription: any = null;
  private isPollingActive: boolean = false;

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    if (this.appStateSubscription) return;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          // App came to foreground - immediately check for new notifications
          this.checkNewNotifications();
        }
      }
    );
  }

  async connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }
    this.isConnecting = true;

    try {
      const rawToken = await AsyncStorage.getItem("authToken");
      if (!rawToken) {
        this.isConnecting = false;
        return;
      }
      const token = rawToken.replace(/^["']|["']$/g, "").trim();

      if (!this.currentUserId) {
        try {
          const res = await axios.get(
            `${environment.API_BASE_URL}api/auth/user/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );
          if (res.data?.data?.id) {
            this.currentUserId = res.data.data.id;
          }
        } catch (_) {}
      }

      const baseUrl = environment.API_BASE_URL || "http://localhost:3000";
      const urlMatch = baseUrl.match(/^(https?:\/\/[^/]+)/);
      const socketUrl = urlMatch ? urlMatch[1] : baseUrl;

      this.socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        extraHeaders: { Authorization: `Bearer ${token}` },
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 5000,
        timeout: 5000,
      });

      this.socket.on("connect", () => {
        this.isConnecting = false;
        this.hasLoggedConnectionNotice = false;
        console.log(`🔌 [SocketService] Connected: ${this.socket?.id}`);
        if (this.currentUserId) {
          this.socket?.emit("registerSalesAgent", this.currentUserId);
          this.socket?.emit("register_user", this.currentUserId);
        }
        // One-time baseline unread count check on connect (0 polling)
        this.checkNewNotifications();
      });

      const handleSocketNotification = (data: ServerNotificationItem) => {
        console.log("📢 [SocketService] Real-time socket event received:", data?.title);
        const formatted: ServerNotificationItem = {
          ...data,
          message: formatNotificationMessage(data),
        };
        if (data?.id && data.id > this.lastNotifiedId) {
          this.lastNotifiedId = data.id;
          AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.lastNotifiedId)).catch(() => {});
        }
        if (typeof data?.unreadCount === "number") {
          this.lastKnownUnreadCount = data.unreadCount;
          updateGlobalUnreadCount(data.unreadCount);
        } else if (this.lastKnownUnreadCount >= 0) {
          this.lastKnownUnreadCount += 1;
          updateGlobalUnreadCount(this.lastKnownUnreadCount);
        }
        // Event-Driven Alert: notify listeners
        this.dispatchToListeners(formatted);
      };

      this.socket.on("newNotification", handleSocketNotification);
      this.socket.on("new_notification", handleSocketNotification);

      // Listen for package updates in real-time
      const handlePackageUpdate = (data: any) => {
        console.log("📦 [SocketService] Real-time package update event received:", data);
        this.dispatchPackageUpdate(data);
      };

      this.socket.on("packageUpdated", handlePackageUpdate);
      this.socket.on("package_updated", handlePackageUpdate);
      this.socket.on("packagesUpdated", handlePackageUpdate);

      this.socket.on("connect_error", () => {
        this.isConnecting = false;
        if (!this.hasLoggedConnectionNotice) {
          this.hasLoggedConnectionNotice = true;
          console.log("ℹ️ [SocketService] Socket connecting / retrying...");
        }
      });

      this.socket.on("disconnect", (reason) => {
        this.isConnecting = false;
        console.log(`🔌 [SocketService] Disconnected: ${reason}`);
      });

    } catch (e) {
      this.isConnecting = false;
    }
  }

  private dispatchToListeners(item: ServerNotificationItem) {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(item);
      } catch (e) {
        console.error("[SocketService] Listener error:", e);
      }
    });
  }

  private dispatchPackageUpdate(data?: any) {
    this.packageUpdateListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (e) {
        console.error("[SocketService] Package listener error:", e);
      }
    });
  }

  public async checkNewNotifications() {
    try {
      const rawToken = await AsyncStorage.getItem("authToken");
      if (!rawToken) return;
      const token = rawToken.replace(/^["']|["']$/g, "").trim();
      await this.pollNotifications(token);
    } catch (_) {}
  }

  private async pollNotifications(token: string) {
    if (this.isPollingActive) return;
    this.isPollingActive = true;

    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = response.data?.data || {};
      const notifications: ServerNotificationItem[] = data.notifications || [];
      const unreadCount: number = data.unreadCount ?? 0;

      if (!notifications || notifications.length === 0) {
        this.lastKnownUnreadCount = 0;
        return;
      }

      // Filter unread notifications
      const unreadItems = notifications.filter(
        (n) =>
          n.readStatus === 0 ||
          n.readStatus === false ||
          (n.readStatus as any) === "0"
      );

      const latestUnreadId =
        unreadItems.length > 0
          ? Math.max(...unreadItems.map((n) => n.id || 0))
          : 0;

      // ── 1. STATE-DRIVEN INBOX SYNC (Silent) ──────────────────────────────
      // Always update global unread count badge silently for the inbox
      updateGlobalUnreadCount(unreadCount);

      // Load persistent high-water mark from storage if not in memory
      if (this.lastNotifiedId === 0) {
        try {
          const stored = await AsyncStorage.getItem(LAST_NOTIFIED_ID_KEY);
          if (stored) {
            this.lastNotifiedId = parseInt(stored, 10) || 0;
          }
        } catch (_) {}
      }

      // ── 2. BASELINE INITIALIZATION (First check of session) ───────────────
      // SILENT SYNC: When app opens or reconnects, establish the baseline high-water mark.
      // Pre-existing notifications belong to the inbox state — DO NOT alert the user.
      if (this.lastKnownUnreadCount === -1) {
        this.lastNotifiedId = Math.max(this.lastNotifiedId, latestUnreadId);
        this.lastKnownUnreadCount = unreadCount;
        AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.lastNotifiedId)).catch(() => {});
        console.log(
          "ℹ️ [SocketService] Baseline inbox state synced silently. Unread count:",
          unreadCount,
          "High-water mark ID:",
          this.lastNotifiedId
        );
        return;
      }

      // ── 3. EVENT-DRIVEN ALERTS (Only genuinely new real-time arrivals) ────
      // Only alert if new items arrived whose ID is strictly higher than the high-water mark
      if (latestUnreadId > this.lastNotifiedId) {
        const newItems = unreadItems.filter(
          (n) => (n.id || 0) > this.lastNotifiedId
        );

        newItems.forEach((item) => {
          const formatted = {
            ...item,
            message: formatNotificationMessage(item),
            unreadCount,
          };
          console.log("🔔 [SocketService] Genuinely new event detected via poll:", item.title);
          this.dispatchToListeners(formatted);
        });

        this.lastNotifiedId = latestUnreadId;
        AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.lastNotifiedId)).catch(() => {});
      }

      this.lastKnownUnreadCount = unreadCount;

    } catch (_) {
      // Silently ignore network failures
    } finally {
      this.isPollingActive = false;
    }
  }

  private startFallbackPolling(token: string) {
    // Zero-polling architecture: real-time events delivered directly via /api/notifications/trigger
  }

  private stopFallbackPolling() {
    if (this.fallbackPollingTimer) {
      clearInterval(this.fallbackPollingTimer);
      this.fallbackPollingTimer = null;
    }
  }

  onNewNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  onPackageUpdate(callback: (data?: any) => void): () => void {
    this.packageUpdateListeners.add(callback);
    return () => {
      this.packageUpdateListeners.delete(callback);
    };
  }

  disconnect() {
    this.stopFallbackPolling();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    this.isConnecting = false;
    this.hasLoggedConnectionNotice = false;
    // Reset session tracking on logout/disconnect
    this.lastKnownUnreadCount = -1;
    this.lastNotifiedId = 0;
    this.isPollingActive = false;
    AsyncStorage.removeItem(LAST_NOTIFIED_ID_KEY).catch(() => {});
  }
}

export default new SocketService();
