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
  private isConnecting: boolean = false;
  private currentUserId: number | null = null;

  // Session-only tracking (NOT persisted - resets every app launch).
  // KEY FIX: Previously we persisted the last shown ID to AsyncStorage which
  // caused the banner to NEVER fire on reinstall/reopen because the persisted
  // ID matched existing notification IDs in the DB.
  private shownBannerUpToId: number = 0;
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
        this.stopFallbackPolling();
        console.log(`🔌 [SocketService] Connected: ${this.socket?.id}`);
        if (this.currentUserId) {
          this.socket?.emit("registerSalesAgent", this.currentUserId);
          this.socket?.emit("register_user", this.currentUserId);
        }
      });

      const handleSocketNotification = (data: ServerNotificationItem) => {
        console.log("📢 [SocketService] Real-time socket event received:", data?.title);
        const formatted: ServerNotificationItem = {
          ...data,
          message: formatNotificationMessage(data),
        };
        if (data?.id && data.id > this.shownBannerUpToId) {
          this.shownBannerUpToId = data.id;
          AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.shownBannerUpToId)).catch(() => {});
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

      this.socket.on("connect_error", () => {
        this.isConnecting = false;
        if (!this.hasLoggedConnectionNotice) {
          this.hasLoggedConnectionNotice = true;
          console.log("ℹ️ [SocketService] Socket not reachable, using REST polling.");
        }
        this.startFallbackPolling(token);
      });

      this.socket.on("disconnect", (reason) => {
        this.isConnecting = false;
        if (reason !== "io client disconnect") {
          this.startFallbackPolling(token);
        }
      });

      // Always start polling as a safety net even when socket connects
      // (socket only delivers real-time events; polling catches existing unread ones)
      this.startFallbackPolling(token);

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
      if (this.shownBannerUpToId === 0) {
        try {
          const stored = await AsyncStorage.getItem(LAST_NOTIFIED_ID_KEY);
          if (stored) {
            this.shownBannerUpToId = parseInt(stored, 10) || 0;
          }
        } catch (_) {}
      }

      // ── 2. BASELINE INITIALIZATION (First check of session) ───────────────
      // SILENT SYNC: When app opens or reconnects, establish the baseline high-water mark.
      // Pre-existing notifications belong to the inbox state — DO NOT alert the user.
      if (this.lastKnownUnreadCount === -1) {
        this.shownBannerUpToId = Math.max(this.shownBannerUpToId, latestUnreadId);
        this.lastKnownUnreadCount = unreadCount;
        AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.shownBannerUpToId)).catch(() => {});
        console.log(
          "ℹ️ [SocketService] Baseline inbox state synced silently. Unread count:",
          unreadCount,
          "High-water mark ID:",
          this.shownBannerUpToId
        );
        return;
      }

      // ── 3. EVENT-DRIVEN ALERTS (Only genuinely new real-time arrivals) ────
      // Only alert if new items arrived whose ID is strictly higher than the high-water mark
      if (latestUnreadId > this.shownBannerUpToId) {
        const newItems = unreadItems.filter(
          (n) => (n.id || 0) > this.shownBannerUpToId
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

        this.shownBannerUpToId = latestUnreadId;
        AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(this.shownBannerUpToId)).catch(() => {});
      }

      this.lastKnownUnreadCount = unreadCount;

    } catch (_) {
      // Silently ignore network failures
    } finally {
      this.isPollingActive = false;
    }
  }

  private startFallbackPolling(token: string) {
    if (this.fallbackPollingTimer) return;
    // First poll immediately
    this.pollNotifications(token);
    // Then every 8 seconds
    this.fallbackPollingTimer = setInterval(() => {
      this.pollNotifications(token);
    }, 8000);
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
    this.shownBannerUpToId = 0;
    this.isPollingActive = false;
    AsyncStorage.removeItem(LAST_NOTIFIED_ID_KEY).catch(() => {});
  }
}

export default new SocketService();
