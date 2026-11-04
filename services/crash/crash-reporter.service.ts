import axios from "axios";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Application from "expo-application";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";

export interface CrashReportPayload {
  errorMessage: string;
  errorStack?: string;
  screenName?: string;
  userComment?: string;
}

export interface CrashReportResponse {
  success: boolean;
  message: string;
  data?: {
    recipients: string[];
    previewUrl?: string;
    isTestAccount?: boolean;
    messageId?: string;
  };
}

class CrashReporterService {
  /**
   * Automatically gathers device, app, and user context, then sends the crash report to backend.
   */
  async sendReport({
    errorMessage,
    errorStack,
    screenName = "General",
    userComment = "",
  }: CrashReportPayload): Promise<CrashReportResponse> {
    try {
      // Gather app version
      const appVersion =
        Application.nativeApplicationVersion ||
        Constants.expoConfig?.version ||
        "1.0.6";
      const buildNumber =
        Application.nativeBuildVersion ||
        Constants.expoConfig?.android?.versionCode ||
        20;

      // Gather device details
      const deviceInfo = {
        brand: Device.brand || Platform.OS,
        model: Device.modelName || Device.designName || (Platform.constants as any)?.Model || "Unknown Device",
        osName: Device.osName || Platform.OS,
        osVersion: Device.osVersion || String(Platform.Version),
        platform: Platform.OS,
      };

      // Gather user details from AsyncStorage if available
      let empId = "";
      let userName = "";
      try {
        const storedEmpId = await AsyncStorage.getItem("empId");
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedEmpId) empId = storedEmpId;
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          userName = parsed.name || parsed.userName || "";
          if (!empId && parsed.empId) empId = parsed.empId;
        }
      } catch (e) {
        console.warn("Could not retrieve user info for crash report", e);
      }

      const payload = {
        errorMessage,
        errorStack: errorStack || "",
        screenName,
        appVersion,
        buildNumber,
        deviceInfo,
        userInfo: {
          empId: empId || "Unauthenticated",
          userName: userName || empId || "Sales Agent",
        },
        userComment,
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(
        `${environment.API_BASE_URL}api/support/crash-report`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to submit crash report:", error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to submit crash report",
      };
    }
  }

  private isAutoInitialized = false;

  /**
   * Initializes automatic background capture of fatal unhandled JavaScript exceptions.
   */
  initAutoCrashCapture() {
    if (this.isAutoInitialized) return;
    this.isAutoInitialized = true;

    const globalAny: any = global;
    if (globalAny.ErrorUtils) {
      const defaultHandler = globalAny.ErrorUtils.getGlobalHandler();
      globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        // Automatically dispatch crash report in the background
        this.sendReport({
          errorMessage: `[FATAL: ${Boolean(isFatal)}] ${error?.message || error}`,
          errorStack: error?.stack || String(error),
          screenName: "GlobalFatalHandler",
          userComment: "Automatically captured background fatal crash",
        }).catch((err) => {
          console.warn("Auto crash dispatch failed:", err);
        });

        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }
  }
}

export default new CrashReporterService();
