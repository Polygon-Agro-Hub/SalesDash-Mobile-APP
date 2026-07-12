import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ScrollView,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../common/CustomHeader";

type OrderConfimedOTPScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderConfimedOTPScreen"
>;

/**
 * This screen ONLY does two things:
 *   1. Verifies the OTP that was sent (from OrderSummeryScreen) to the
 *      customer's mobile number.
 *   2. Routes onward depending on payment method:
 *        - Cash  -> creates the order here, then navigates to
 *                   Main > OrderConfirmedScreen with the full order-summary
 *                   params (orderId, isPackage, total, subtotal, discount,
 *                   paymentMethod, userId, selectedDate, selectedTimeSlot).
 *        - Card  -> order creation is deferred until the customer taps
 *                   "Send Payment Request" on the OnlinePayment screen, so
 *                   here we just forward the order-summary params onward.
 *
 * There is no customer add/edit logic here anymore — that responsibility
 * has been removed from this flow entirely.
 */
const OrderConfimedOTPScreen: React.FC = () => {
  const navigation = useNavigation<OrderConfimedOTPScreenNavigationProp>();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const {
    phoneNumber,
    id,
    token: routeToken,
    paymentMethod,
    customerName,
    customerTitle,
    isPackage,
    total,
    fullTotal,
    subtotal,
    discount,
    selectedDate,
    selectedTimeSlot,
    items,
    orderItems,
    rawPackageItems,
    rawAdditionalItems,
    selectedAddress,
    customerid,
    customerscreencustomerid,
    isFinalizeImdt,
    deliveryCharge,
  } = route.params as {
    phoneNumber: string;
    id: string;
    token?: string;
    paymentMethod?: string;
    customerName?: string;
    customerTitle?: string;
    isPackage?: number;
    total?: number;
    fullTotal?: number;
    subtotal?: number;
    discount?: number;
    selectedDate?: string;
    selectedTimeSlot?: string;
    items?: any[];
    orderItems?: any[];
    rawPackageItems?: any[];
    rawAdditionalItems?: any[];
    selectedAddress?: any;
    customerid?: string;
    customerscreencustomerid?: string;
    isFinalizeImdt?: number;
    deliveryCharge?: number;
  };

  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isOtpComplete = otp.every((digit) => digit.length === 1);

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return null;
      }
      await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      return storedToken;
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
      return null;
    }
  };

  /**
   * Cash flow: creates the order from the pending payload, then navigates
   * to Main > OrderConfirmedScreen with the full order-summary params.
   */
  const createOrderAndNavigate = async (token: string) => {
    const pendingOrderStr = await AsyncStorage.getItem("pendingOrderData");

    if (!pendingOrderStr) {
      Alert.alert("Error", "No pending order data found.");
      return;
    }

    let pendingOrderPayload;
    try {
      pendingOrderPayload = JSON.parse(pendingOrderStr);
    } catch (e) {
      console.error("Error parsing pending order data:", e);
      Alert.alert("Error", "Failed to read the pending order.");
      return;
    }

    try {
      const orderResponse = await axios.post(
        `${environment.API_BASE_URL}api/orders/create-order`,
        pendingOrderPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (orderResponse.data.success) {
        await AsyncStorage.removeItem("pendingOrderData");
        const orderId = orderResponse.data.data.orderId;

        navigation.navigate("Main" as any, {
          screen: "OrderConfirmedScreen",
          params: {
            orderId,
            isPackage: isPackage,
            total: total,
            subtotal: subtotal,
            discount: discount,
            paymentMethod: paymentMethod,
            userId: id,
            selectedDate: selectedDate,
            selectedTimeSlot: selectedTimeSlot,
          },
        });
      } else {
        Alert.alert(
          "Error",
          orderResponse.data.message || "Failed to create order",
        );
      }
    } catch (e: any) {
      console.error("Error creating order after OTP verification:", e);
      let errorMessage = "Error creating order after OTP verification";
      if (axios.isAxiosError(e) && e.response) {
        errorMessage =
          e.response.data?.message || e.response.data?.error || errorMessage;
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 5) {
      setIsOtpInvalid(true);
      return;
    }

    if (timer <= 0) {
      Alert.alert("Error", "OTP has expired. Please request a new one.");
      return;
    }

    try {
      setLoading(true);
      const referenceId = await AsyncStorage.getItem("referenceId");

      let token = routeToken || (await AsyncStorage.getItem("authToken"));
      if (!token) {
        token = await getUserProfile();
      }

      if (!referenceId || !token) {
        Alert.alert("Error", "Missing OTP reference or authentication token.");
        return;
      }

      const otpVerificationUrl =
        "https://api.getshoutout.com/otpservice/verify";
      const otpHeaders = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const otpBody = {
        code: otpCode,
        referenceId,
      };

      const otpResponse = await axios.post(otpVerificationUrl, otpBody, {
        headers: otpHeaders,
      });
      const { statusCode } = otpResponse.data;

      if (statusCode === "1000") {
        if (paymentMethod === "Card") {
          await AsyncStorage.removeItem("referenceId");
          navigation.navigate("OnlinePayment" as any, {
            id: null,
            customerId: id,
            name: customerName,
            title: customerTitle,

            isPackage,
            total,
            fullTotal,
            subtotal,
            discount,
            selectedDate,
            selectedTimeSlot,
            items,
            orderItems,
            rawPackageItems,
            rawAdditionalItems,
            selectedAddress,
            customerid: customerid || id,
            customerscreencustomerid,
            isFinalizeImdt,
            deliveryCharge,
          });
        } else {
          await createOrderAndNavigate(token);
        }
      } else {
        setIsOtpInvalid(true);
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      console.error("Full error during OTP verification:", error);
      let errorMessage = "An error occurred while verifying OTP.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMessage;
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtp(["", "", "", "", ""]);
      setResendDisabled(true);
      setTimer(60);

      const apiUrl = "https://api.getshoutout.com/otpservice/send";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const body = {
        source: "PolygonAgro",
        transport: "sms",
        content: {
          sms: "Thank you for your order with GoviMart. Please use the below OTP to confirm your order. {{code}}",
        },
        destination: phoneNumber,
      };

      const response = await axios.post(apiUrl, body, { headers });

      if (response.data.referenceId) {
        await AsyncStorage.setItem("referenceId", response.data.referenceId);
        Alert.alert("Success", "OTP resent successfully.");
      } else {
        Alert.alert("Error", "Failed to resend OTP.");
        setResendDisabled(false);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while resending OTP.");
      setResendDisabled(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);

    const isValid = updatedOtp.every((digit) => digit.length === 1);
    setIsOtpInvalid(!isValid);

    if (text.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === otp.length - 1 && text.length === 1) {
      Keyboard.dismiss();

      if (isValid && timer > 0) {
        verifyOTP();
      }
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const handleKeyboardShow = () => {
      setKeyboardVisible(true);
    };

    const handleKeyboardHide = () => {
      setKeyboardVisible(false);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      showEvent,
      handleKeyboardShow,
    );
    const hideSubscription = Keyboard.addListener(
      hideEvent,
      handleKeyboardHide,
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        style={{ backgroundColor: "white" }}
      >
        <CustomHeader
          title="OTP Verification"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
          onBackPress={() => navigation.goBack()}
        />
        <View className="flex-1 bg-white items-center justify-center">
          <View className="flex-1 justify-center w-full max-w-[500px]">
            {/* Illustration - Centered */}
            <View className="items-center justify-center mb-6">
              <Image
                source={require("@/assets/images/otp/otp-check.webp")}
                style={{
                  width: 200,
                  height: 200,
                }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-black text-center font-bold text-xl">
              Enter Verification Code.
            </Text>
            <Text className="text-[#808080] text-center mt-3 px-4">
              We have sent a Verification Code to your Customer's mobile number
            </Text>

            {/* OTP Input Section */}
            <View className="flex-row justify-center items-center gap-3 mt-8 mb-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={`otp-input-${index}`}
                  ref={(el: TextInput | null) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-12 rounded-lg border-2 ${
                    digit
                      ? "bg-[#874DDB] border-[#874DDB]"
                      : "bg-[#E7D7FF] border-[#E7D7FF]"
                  }`}
                  style={{
                    textAlign: "center",
                    textAlignVertical: "center",
                    fontSize: 16,
                    fontWeight: "600",
                    lineHeight: 20,
                    color: digit ? "#FFFFFF" : "#86198f",
                    padding: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  cursorColor="#FFFFFF"
                  selectionColor={digit ? "#FFFFFF" : "#874DDB"}
                />
              ))}
            </View>

            <View className="items-center justify-center bg-white">
              {/* Timer */}
              <Text className="text-black">
                {timer > 0
                  ? `00:${timer < 10 ? `0${timer}` : timer}`
                  : "OTP expired"}
              </Text>

              {/* Resend OTP */}
              <View className="flex-row items-center justify-center mb-5 my-3">
                <Text className="text-black font-semibold">
                  Didn't receive the OTP ?
                </Text>
                <TouchableOpacity
                  disabled={resendDisabled}
                  onPress={handleResendOtp}
                >
                  <Text
                    className={`ml-2 font-semibold ${resendDisabled ? "text-gray-500" : "text-[#874DDB]"}`}
                  >
                    RESEND OTP
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Verify Button — hidden while keyboard is open */}
              {!isKeyboardVisible && (
                <TouchableOpacity
                  onPress={verifyOTP}
                  disabled={!isOtpComplete || loading || timer <= 0}
                  activeOpacity={0.7}
                  style={{
                    width: "50%",
                    borderRadius: 30,
                    backgroundColor: "transparent",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={
                      !isOtpComplete || loading || timer <= 0
                        ? ["#A0A0A0", "#808080"]
                        : ["#6839CF", "#874DDB"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className={`h-[50px] items-center justify-center rounded-full ${
                      !isOtpComplete || loading || timer <= 0
                        ? "opacity-50"
                        : ""
                    }`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.1,
                      shadowRadius: 3.84,
                      overflow: "hidden",
                    }}
                  >
                    <Text className="text-center text-white font-bold text-lg">
                      {loading ? "Verifying..." : "Verify"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrderConfimedOTPScreen;
