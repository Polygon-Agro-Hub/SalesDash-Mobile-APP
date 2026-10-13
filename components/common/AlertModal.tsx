import React, { useEffect } from "react";
import { View, Text, Modal, Animated, TouchableOpacity, Alert, DimensionValue } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string | React.ReactNode;
  type?: "success" | "error";
  onClose: () => void;
  showRescanButton?: boolean;
  onRescan?: () => void;
  showOpenOngoingButton?: boolean;
  onOpenOngoing?: () => void;
  duration?: number;
  autoClose?: boolean;
  showOkButton?: boolean;
  okButtonText?: string;
  buttonWidth?: DimensionValue;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = "error",
  onClose,
  showRescanButton = false,
  onRescan,
  showOpenOngoingButton = false,
  onOpenOngoing,
  duration = 4000,
  autoClose = true,
  showOkButton,
  okButtonText = "OK",
  buttonWidth,
}) => {
  const isOkButtonVisible = showOkButton !== undefined ? showOkButton : !autoClose;
  const loadingBarWidth = new Animated.Value(1); // 1 = 100%

  useEffect(() => {
    if (visible && autoClose) {
      loadingBarWidth.setValue(1);

      Animated.timing(loadingBarWidth, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      const closeTimer = setTimeout(() => {
        onClose();
      }, duration - 200);

      return () => clearTimeout(closeTimer);
    }
  }, [visible, duration, autoClose]);

  const getContent = () => {
    switch (type) {
      case "success":
        return (
          <LottieView
            source={require("@/assets/json/successful.json")}
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        );
      case "error":
      default:
        return (
          <LottieView
            source={require("@/assets/json/error.json")}
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        );
    }
  };

  const renderMessage = () => {
    if (typeof message === "string") {
      return (
        <Text
          style={{
            textAlign: "center",
            color: "#4E4E4E",
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 20,
            marginTop: 8,
            width: "100%",
          }}
        >
          {message}
        </Text>
      );
    }
    return message;
  };

  const getModalTitle = () => {
    if (showOpenOngoingButton) {
      return "Cannot Proceed!";
    }
    return title;
  };

  const buttonShadow = {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            padding: 24,
            borderRadius: 16,
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
            position: "relative",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F7FAFF",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#000000" />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              lineHeight: 24,
              marginBottom: 16,
              textAlign: "center",
              color: "#111827",
              width: "100%",
            }}
          >
            {getModalTitle()}
          </Text>

          {getContent()}

          {renderMessage()}

          <View style={{ width: "100%", gap: 12 }}>
            {showRescanButton && onRescan && (
              <TouchableOpacity
                onPress={onRescan}
                activeOpacity={0.8}
                style={[
                  {
                    backgroundColor: "#6E3DD1",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 9999,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  },
                  buttonShadow,
                ]}
              >
                <FontAwesome5 name="undo" size={18} color="white" />
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Re-Scan</Text>
              </TouchableOpacity>
            )}

            {/* Open Ongoing Activity Button (only shown when showOpenOngoingButton is true) */}
            {showOpenOngoingButton && onOpenOngoing && (
              <TouchableOpacity
                onPress={onOpenOngoing}
                activeOpacity={0.8}
                style={[
                  {
                    backgroundColor: "#6E3DD1",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 9999,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  },
                  buttonShadow,
                ]}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                  Open Ongoing Activity
                </Text>
              </TouchableOpacity>
            )}

            {isOkButtonVisible && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={[
                  {
                    backgroundColor: "#6E3DD1",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 9999,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  },
                  buttonShadow,
                  buttonWidth ? { width: buttonWidth, alignSelf: "center" } : { width: "100%" }
                ]}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>{okButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Loading Bar - only show if autoClose is true */}
          {autoClose && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 12,
                overflow: "hidden",
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  width: loadingBarWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                  backgroundColor: "#6E3DD1",
                }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Global Alert Listener & Hook setup
type AlertListener = (
  title: string,
  message: string | React.ReactNode,
  type: "success" | "error",
  onClose: () => void,
  autoClose: boolean,
  showOkButton?: boolean,
  okButtonText?: string
) => void;

let globalAlertListener: AlertListener | null = null;

export const setGlobalAlertListener = (listener: AlertListener) => {
  globalAlertListener = listener;
};

const originalAlert = Alert.alert;

Alert.alert = (title, message, buttons, options) => {
  const hasMultipleButtons = buttons && buttons.length > 1;

  if (hasMultipleButtons) {
    originalAlert(title, message, buttons, options);
  } else {
    const isSuccess = title && title.toLowerCase().includes("success");
    const type = isSuccess ? "success" : "error";

    const onCloseCallback = () => {
      if (buttons && buttons.length === 1 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    };

    const customOkText = (buttons && buttons.length === 1 && buttons[0].text) || undefined;

    if (globalAlertListener) {
      globalAlertListener(
        title || "",
        message || "",
        type,
        onCloseCallback,
        isSuccess === true,
        !isSuccess,
        customOkText
      );
    } else {
      originalAlert(title, message, buttons, options);
    }
  }
};
