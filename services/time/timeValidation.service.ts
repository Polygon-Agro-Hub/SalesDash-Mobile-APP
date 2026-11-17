import axios from "axios";
import { Linking, Platform } from "react-native";
import environment from "@/environment/environment";

export interface TimeValidationState {
  isInaccurate: boolean;
  deviceTime: Date;
  serverTime: Date | null;
  offsetMs: number;
  isChecking: boolean;
}

// 1 minute threshold for clock discrepancy as requested
export const TIME_DISCREPANCY_THRESHOLD_MS = 1 * 60 * 1000;

class TimeValidationService {
  private isInaccurate: boolean = false;
  private serverTime: Date | null = null;
  private offsetMs: number = 0;
  private isChecking: boolean = false;
  private listeners: Set<(state: TimeValidationState) => void> = new Set();

  public subscribe(listener: (state: TimeValidationState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): TimeValidationState {
    return {
      isInaccurate: this.isInaccurate,
      deviceTime: new Date(),
      serverTime: this.serverTime,
      offsetMs: this.offsetMs,
      isChecking: this.isChecking,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn("[TimeValidation] Listener error:", err);
      }
    });
  }

  /**
   * Directly verify device time against backend time endpoint.
   */
  public async checkServerTime(): Promise<boolean> {
    if (this.isChecking) return this.isInaccurate;
    this.isChecking = true;
    this.notify();

    try {
      const startTime = Date.now();
      // Ensure clean URL without double slashes
      const baseUrl = environment.API_BASE_URL.replace(/\/+$/, "");
      const url = `${baseUrl}/api/time`;

      const response = await axios.get(url, {
        timeout: 6000,
        headers: { "Cache-Control": "no-cache" },
      });

      const endTime = Date.now();
      const roundTripMs = endTime - startTime;
      const networkLatency = Math.round(roundTripMs / 2);

      let serverTimestamp: number | null = null;
      if (typeof response.data?.serverTime === "number") {
        serverTimestamp = response.data.serverTime;
      } else if (response.data?.iso) {
        serverTimestamp = new Date(response.data.iso).getTime();
      } else if (response.headers?.date) {
        serverTimestamp = new Date(response.headers.date).getTime();
      }

      if (serverTimestamp && !isNaN(serverTimestamp)) {
        const adjustedServerTime = serverTimestamp + networkLatency;
        const currentDeviceTime = endTime;
        const diff = Math.abs(currentDeviceTime - adjustedServerTime);

        this.offsetMs = currentDeviceTime - adjustedServerTime;
        this.serverTime = new Date(adjustedServerTime);
        this.isInaccurate = diff > TIME_DISCREPANCY_THRESHOLD_MS;
      }
    } catch {
      // Fallback check: try health endpoint if /api/time fails
      try {
        const baseUrl = environment.API_BASE_URL.replace(/\/+$/, "");
        const fallbackRes = await axios.get(`${baseUrl}/health`, {
          timeout: 4000,
          headers: { "Cache-Control": "no-cache" },
        });
        const serverTimestamp =
          fallbackRes.data?.timestamp ? new Date(fallbackRes.data.timestamp).getTime() :
          fallbackRes.headers?.date ? new Date(fallbackRes.headers.date).getTime() : null;

        if (serverTimestamp && !isNaN(serverTimestamp)) {
          const diff = Math.abs(Date.now() - serverTimestamp);
          this.offsetMs = Date.now() - serverTimestamp;
          this.serverTime = new Date(serverTimestamp);
          this.isInaccurate = diff > TIME_DISCREPANCY_THRESHOLD_MS;
        }
      } catch {
        // If server is unreachable or offline, fail open: do not falsely lock down the app
      }
    } finally {
      this.isChecking = false;
      this.notify();
    }

    return this.isInaccurate;
  }

  /**
   * Passive update from any Axios HTTP response (via Date header).
   */
  public reportServerDateHeader(serverDateHeaderStr: string) {
    try {
      const serverTimestamp = new Date(serverDateHeaderStr).getTime();
      if (isNaN(serverTimestamp)) return;

      const deviceTime = Date.now();
      const diff = Math.abs(deviceTime - serverTimestamp);

      this.offsetMs = deviceTime - serverTimestamp;
      this.serverTime = new Date(serverTimestamp);

      const wasInaccurate = this.isInaccurate;
      const nowInaccurate = diff > TIME_DISCREPANCY_THRESHOLD_MS;

      if (wasInaccurate !== nowInaccurate) {
        this.isInaccurate = nowInaccurate;
        this.notify();
      }
    } catch {
      // Ignore header parse errors
    }
  }

  /**
   * Launch OS Date & Time Settings (WhatsApp behavior).
   */
  public async openDateSettings(): Promise<void> {
    if (Platform.OS === "android") {
      try {
        await Linking.sendIntent("android.settings.DATE_SETTINGS");
      } catch {
        try {
          await Linking.openSettings();
        } catch {
          // Fallback
        }
      }
    } else if (Platform.OS === "ios") {
      try {
        const url = "App-Prefs:General&path=DATE_AND_TIME";
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          await Linking.openSettings();
        }
      } catch {
        await Linking.openSettings();
      }
    } else {
      await Linking.openSettings();
    }
  }
}

export const timeValidationService = new TimeValidationService();
export default timeValidationService;
