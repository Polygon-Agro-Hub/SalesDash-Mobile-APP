import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CrashReportModal from "./CrashReportModal";
import crashReporterService from "@/services/crash/crash-reporter.service";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showModal: boolean;
  isAutoSending: boolean;
  autoSent: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showModal: false,
      isAutoSending: false,
      autoSent: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Initialize global unhandled fatal exception handler
    crashReporterService.initAutoCrashCapture();
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 [ErrorBoundary] Caught app exception:", error, errorInfo);
    this.setState({ errorInfo, isAutoSending: true });

    // Automatically send crash report without requiring user action
    crashReporterService
      .sendReport({
        errorMessage: error?.message || "Unhandled Component Crash",
        errorStack: error?.stack || errorInfo?.componentStack || "",
        screenName: "AutoCrashCapture (ErrorBoundary)",
        userComment: "Automatically captured background crash report",
      })
      .then((res) => {
        this.setState({ isAutoSending: false, autoSent: res.success });
      })
      .catch((err) => {
        console.warn("Auto crash send failed:", err);
        this.setState({ isAutoSending: false, autoSent: false });
      });
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showModal: false,
      isAutoSending: false,
      autoSent: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: wp(6),
          }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: hp(6),
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning / Error Illustration */}
            <View
              style={{
                width: hp(12),
                height: hp(12),
                borderRadius: hp(6),
                backgroundColor: "#FEE2E2",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: hp(2.5),
              }}
            >
              <Ionicons name="warning-outline" size={hp(6.5)} color="#DC2626" />
            </View>

            <Text
              style={{
                fontSize: hp(2.6),
                fontWeight: "bold",
                color: "#111827",
                textAlign: "center",
                marginBottom: hp(1),
              }}
            >
              Something went wrong
            </Text>

            <Text
              style={{
                fontSize: hp(1.6),
                color: "#6B7280",
                textAlign: "center",
                lineHeight: hp(2.3),
                maxWidth: 320,
                marginBottom: hp(2),
              }}
            >
              An unexpected issue occurred in the application.
            </Text>

            {/* Auto-Report Status Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: this.state.autoSent ? "#ECFDF5" : "#F3F4F6",
                borderWidth: 1,
                borderColor: this.state.autoSent ? "#A7F3D0" : "#E5E7EB",
                borderRadius: 20,
                paddingVertical: hp(0.8),
                paddingHorizontal: wp(3.5),
                marginBottom: hp(2.5),
              }}
            >
              {this.state.isAutoSending ? (
                <>
                  <ActivityIndicator size="small" color="#6C3CD1" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: hp(1.4), color: "#4B5563", fontWeight: "500" }}>
                    Sending crash report automatically...
                  </Text>
                </>
              ) : this.state.autoSent ? (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={hp(2)}
                    color="#10B981"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: hp(1.4), color: "#065F46", fontWeight: "600" }}>
                    Crash report automatically sent to developer team
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={hp(2)}
                    color="#6B7280"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: hp(1.4), color: "#4B5563", fontWeight: "500" }}>
                    Diagnostic report captured
                  </Text>
                </>
              )}
            </View>

            {/* Error Message Snippet */}
            <View
              style={{
                width: "100%",
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                padding: wp(4),
                marginBottom: hp(3),
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.4),
                  fontWeight: "bold",
                  color: "#991B1B",
                  marginBottom: 4,
                }}
              >
                Error Details:
              </Text>
              <Text
                numberOfLines={3}
                style={{
                  fontSize: hp(1.3),
                  color: "#4B5563",
                  fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
                }}
              >
                {this.state.error?.message || "Unknown Application Exception"}
              </Text>
            </View>

            {/* Primary Action: Restart App */}
            <View style={{ width: "100%", gap: hp(1.5) }}>
              <TouchableOpacity
                onPress={this.handleRestart}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#6C3CD1", "#8C52FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: hp(1.8),
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: wp(2),
                  }}
                >
                  <Ionicons name="refresh-outline" size={hp(2.2)} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: hp(1.8),
                      fontWeight: "bold",
                    }}
                  >
                    Restart Screen
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Optional user feedback */}
              <TouchableOpacity
                onPress={() => this.setState({ showModal: true })}
                style={{
                  width: "100%",
                  paddingVertical: hp(1.6),
                  borderRadius: 14,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: hp(1.6),
                    fontWeight: "600",
                  }}
                >
                  Add details / notes (Optional)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Crash Report Modal */}
          <CrashReportModal
            visible={this.state.showModal}
            onClose={() => this.setState({ showModal: false })}
            initialError={this.state.error?.message}
            initialStack={this.state.error?.stack || this.state.errorInfo?.componentStack || undefined}
            screenName="App Error Boundary"
          />
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
