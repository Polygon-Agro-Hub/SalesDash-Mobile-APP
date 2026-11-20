import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DecodedTokenInfo {
  empId?: string;
  id?: number;
  exp?: number; // expiration in unix seconds
  iat?: number; // issued at in unix seconds
  passwordUpdate?: number;
  tokenType?: string;
  rawToken: string;
}

export function decodeJwt(token: string): DecodedTokenInfo | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = atob(base64);
    } else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    } else {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let bc = 0,
        bs = 0,
        buffer: string,
        idx = 0;
      while ((buffer = base64.charAt(idx++))) {
        if (buffer === "=") break;
        const charIdx = chars.indexOf(buffer);
        if (charIdx === -1) continue;
        bs = bc % 4 ? bs * 64 + charIdx : charIdx;
        if (bc++ % 4) {
          jsonStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }

    const parsed = JSON.parse(jsonStr);
    return {
      ...parsed,
      rawToken: token,
    };
  } catch (e) {
    console.warn("Failed to decode JWT:", e);
    return null;
  }
}

type Listener = (visible: boolean) => void;

class DeveloperOverlayService {
  private isVisible: boolean = false;
  private listeners: Set<Listener> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    try {
      const saved = await AsyncStorage.getItem("@dev_floating_countdown_enabled");
      if (saved === "true") {
        this.isVisible = true;
        this.notify();
      }
    } catch (e) {
      console.warn("Failed to read developer countdown preference:", e);
    } finally {
      this.initialized = true;
    }
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public async setVisible(visible: boolean): Promise<void> {
    this.isVisible = visible;
    this.notify();
    try {
      await AsyncStorage.setItem(
        "@dev_floating_countdown_enabled",
        visible ? "true" : "false"
      );
    } catch (e) {
      console.warn("Failed to persist developer countdown preference:", e);
    }
  }

  public addListener(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.isVisible);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isVisible);
      } catch (err) {
        console.error("Error in developerOverlayService listener:", err);
      }
    });
  }
}

export const developerOverlayService = new DeveloperOverlayService();
