import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomHeader from "../common/CustomHeader";
import axios from "axios";
import environment from "@/environment/environment";
import { io } from "socket.io-client";

type OnlinePaymentStatusNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OnlinePaymentStatus"
>;

interface OnlinePaymentStatusProps {
  navigation: OnlinePaymentStatusNavigationProp;
  route: any;
}

type StepStatus = "done" | "current" | "pending";

interface StepConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const OnlinePaymentStatus: React.FC<OnlinePaymentStatusProps> = ({
  navigation,
  route,
}) => {
  const currentStep: number = route.params?.currentStep ?? 1;

  const {
    orderId,
    customerId,
    name,
    title,
    number,
    isPackage,
    total,
    subtotal,
    discount,
    selectedDate,
    selectedTimeSlot,
    paymentMethod,
  } = route.params || {};

  const [checking, setChecking] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  const hasNavigatedRef = useRef<boolean>(false);

  const steps: StepConfig[] = [
    {
      key: "sent",
      label: "Payment Request Sent",
      icon: <Ionicons name="paper-plane" size={20} color="white" />,
    },
    {
      key: "waiting",
      label: "Waiting for\nPayment",
      icon: (
        <MaterialCommunityIcons name="credit-card" size={20} color="white" />
      ),
    },
    {
      key: "confirmed",
      label: "Order\nConfirmed",
      icon: <Feather name="check" size={20} color="white" />,
    },
  ];

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) return "done";
    if (index === currentStep) return "current";
    return "pending";
  };

  const navigateToConfirmed = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    
    navigation.navigate("Main" as any, {
      screen: "OrderConfirmedScreen",
      params: {
        orderId,
        isPackage,
        total,
        subtotal,
        discount,
        paymentMethod,
        customerId,        
        selectedDate,
        selectedTimeSlot,
      },
    });
  }, [
    orderId,
    isPackage,
    total,
    subtotal,
    discount,
    paymentMethod,
    customerId,
    selectedDate,
    selectedTimeSlot,
    navigation,
  ]);

  const checkPaymentStatus = useCallback(
    async () => {
      if (!orderId || hasNavigatedRef.current) return;

      try {
        setChecking(true);
        const response = await axios.get(
          `${environment.API_BASE_URL}api/orders/check-payment-status/${orderId}`
        );

        if (!isMountedRef.current || hasNavigatedRef.current) return;

        const { isPaid } = response.data?.data ?? {};

        if (Number(isPaid) === 1) {
          navigateToConfirmed();
        }
        
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        if (isMountedRef.current) {
          setChecking(false);
        }
      }
    },
    [orderId, navigateToConfirmed]
  );

  useEffect(() => {
    if (!orderId) return;

    isMountedRef.current = true;
    hasNavigatedRef.current = false;

    let socket: any = null;
    let fallbackInterval: any = null;

    // Parse URL manually to ensure compatibility with all JS engines
    let socketUrl = environment.API_BASE_URL;
    let socketPath = "/socket.io";
    const urlMatch = environment.API_BASE_URL.match(/^(https?:\/\/[^\/]+)(.*)$/);
    if (urlMatch) {
      socketUrl = urlMatch[1];
      let pathname = urlMatch[2];
      if (pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }
      socketPath = `${pathname}/socket.io`;
    }

    const socketOptions = {
      path: socketPath,
      transports: ["websocket"],
      timeout: 5000,
    };

    socket = io(socketUrl, socketOptions);

    socket.on("connect", () => {
      console.log("🔌 Connected to socket server");
      socket.emit("joinOrder", orderId);
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    });

    socket.on("connect_error", () => {
      console.log("🔌 Socket connection error. Using REST polling fallback.");
      if (!fallbackInterval) {
        fallbackInterval = setInterval(checkPaymentStatus, 5000);
      }
    });

    socket.on("paymentStatusChanged", (data) => {
      console.log("💲 Payment status changed via socket:", data);
      if (Number(data.isPaid) === 1) {
        navigateToConfirmed();
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from socket server");
    });

    // Initial check
    checkPaymentStatus();

    // Start fallback polling immediately just in case serverless doesn't support websockets
    fallbackInterval = setInterval(checkPaymentStatus, 5000);

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        checkPaymentStatus();
        return true;
      }
    );

    return () => {
      isMountedRef.current = false;
      if (socket) {
        socket.disconnect();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      backHandler.remove();
    };
  }, [orderId, checkPaymentStatus, navigateToConfirmed]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <CustomHeader
        title="Online Payment Status"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => checkPaymentStatus()}
      />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Subtitle */}
        <Text
          style={{
            textAlign: "center",
            color: "#6B7280",
            fontSize: 13,
            lineHeight: 20,
            marginTop: 4,
            paddingHorizontal: 16,
          }}
        >
          You will be notified once the payment is completed.
        </Text>

        {/* Illustration */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <Image
            source={require("@/assets/images/order/online-payment-status.webp")}
            style={{ width: 220, height: 220 }}
            resizeMode="contain"
          />
        </View>

        {/* Payment Pending banner */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "#F8F3FE",
            borderColor: "#DDD1F8",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#7B2FF7",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              marginTop: 1,
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
              i
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#7B2FF7" }}>
              Payment Pending
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#6B21A8",
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              This order will be confirmed automatically once the payment is
              successful.
            </Text>
          </View>
        </View>

        {/* Auto-refresh status row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F9FAFB",
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <ActivityIndicator size="small" color="#7B2FF7" />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: "#6B7280",
              fontWeight: "500",
            }}
          >
            Waiting for payment confirmation...
          </Text>
        </View>

        {/* Vertical stepper */}
        <View style={{ alignItems: "center" }}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = status === "done" || status === "current";
            const circleColor = isActive ? "#7B2FF7" : "#D1D5DB";

            return (
              <View key={step.key} style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: circleColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.icon}
                </View>
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: "600",
                    color: isActive ? "#1F2937" : "#9CA3AF",
                  }}
                >
                  {step.label}
                </Text>

                {index < steps.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      height: 32,
                      marginTop: 12,
                      marginBottom: 4,
                      borderLeftWidth: 2,
                      borderLeftColor:
                        getStepStatus(index + 1) !== "pending"
                          ? "#7B2FF7"
                          : "#D1D5DB",
                      borderStyle: "dotted",
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OnlinePaymentStatus;
