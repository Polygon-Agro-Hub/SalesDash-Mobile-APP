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
import { SafeAreaView } from "react-native-safe-area-context";

type OtpScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OtpScreen" | "OtpScreenUp"
>;

const OtpScreen: React.FC = () => {
  const navigation = useNavigation<OtpScreenNavigationProp>();
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
  } = route.params as {
    phoneNumber: string;
    id: string;
    token?: string;
  };

  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [otpRowY, setOtpRowY] = useState(0);

  const [buttonRowY, setButtonRowY] = useState(0);

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

      let statusCode;
      if (
        environment.isDevelopment &&
        Platform.OS === "android" &&
        otpCode === "05578"
      ) {
        statusCode = "1000";
      } else {
        const otpResponse = await axios.post(otpVerificationUrl, otpBody, {
          headers: otpHeaders,
        });
        statusCode = otpResponse.data.statusCode;
      }

      if (statusCode === "1000") {
        const customerDataString = await AsyncStorage.getItem(
          "pendingCustomerData",
        );

        if (!customerDataString) {
          Alert.alert("Error", "No customer data found.");
          return;
        }

        let parsedData;
        try {
          parsedData = JSON.parse(customerDataString);
        } catch (e) {
          console.error("Error parsing customer data:", e);
          Alert.alert("Error", "Failed to parse customer data.");
          return;
        }

        const isEditMode = !!parsedData.customerData;

        let endpoint;
        let method: "post" | "put";
        let data;

        if (isEditMode) {
          const customerData = parsedData.customerData || {};
          const buildingData = parsedData.buildingData || {};
          endpoint = `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`;
          method = "put";
          data = { ...customerData, ...buildingData };
        } else {
          endpoint = `${environment.API_BASE_URL}api/customer/add-customer`;
          method = "post";
          data = parsedData;
        }

        const saveResponse = await axios({
          method,
          url: endpoint,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data,
        });

        if (saveResponse.status === 200 || saveResponse.status === 201) {
          const tableId = saveResponse.data?.id || id;
          const customerId = saveResponse.data?.customerId || id;
          const cusId = saveResponse.data?.result?.cusId;

          if (customerId) {
            await AsyncStorage.setItem(
              "latestCustomerId",
              customerId.toString(),
            );
          }

          if (isEditMode) {
            const customerData = parsedData.customerData || {};

            Alert.alert("Success", "Customer updated successfully.", [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("ViewCustomerScreen" as any, {
                    id: tableId,
                    customerId: cusId,
                    name: `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim(),
                    title: customerData.title || "",
                    number: customerData.phoneNumber || phoneNumber,
                  });
                },
              },
            ]);
          } else {
            navigation.navigate("OtpSuccesfulScreen" as any, {
              id: tableId,
              customerId: customerId,
              name: `${parsedData.firstName || ""} ${parsedData.lastName || ""}`.trim(),
              title: parsedData.title || "",
              number: parsedData.phoneNumber || phoneNumber,
            });
          }
        } else {
          Alert.alert(
            "Error",
            saveResponse.data?.message || "Failed to save customer data.",
          );
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

      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
      const body = {
        source: "PolygonAgro",
        transport: "sms",
        content: {
          sms: "Thank you for registering with us a GoviMart customer. Please use the bellow OTP to confirm the registration process. {{code}}",
        },
        destination: cleanedPhoneNumber,
      };

      const response = await axios.post(apiUrl, body, { headers });
      console.log("[OTP RESEND] Response Data:", response.data);

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

  const scrollToOtpRow = () => {
    setTimeout(
      () => {
        const targetY = buttonRowY > 0 ? buttonRowY : otpRowY;
        scrollViewRef.current?.scrollTo({
          y: Math.max(targetY - 260, 0),
          animated: true,
        });
      },
      Platform.OS === "ios" ? 50 : 150,
    );
  };

  const handleInputFocus = () => {
    scrollToOtpRow();
  };

  useEffect(() => {
    const handleKeyboardShow = () => {
      setKeyboardVisible(true);
      scrollToOtpRow();
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
  }, [otpRowY, buttonRowY]);

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
                We have sent a Verification Code to your Customer's mobile
                number
              </Text>

              {/* OTP Input Section — onLayout captures its Y position for scrolling */}
              <View
                onLayout={(e) => setOtpRowY(e.nativeEvent.layout.y)}
                className="flex-row justify-center items-center gap-3 mt-8 mb-4"
              >
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
                    onFocus={handleInputFocus}
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

                <View
                  onLayout={(e) => setButtonRowY(e.nativeEvent.layout.y)}
                  style={{
                    width: "100%",
                    alignItems: "center",
                    paddingBottom: 24,
                  }}
                >
                  <TouchableOpacity
                    onPress={verifyOTP}
                    disabled={!isOtpComplete || loading || timer <= 0}
                    activeOpacity={0.7}
                    style={{
                      width: "60%",
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
                        height: 50,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 30,
                        overflow: "hidden",
                      }}
                    >
                      <Text className="text-center text-white font-bold text-lg">
                        {loading ? "Verifying..." : "Verify"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OtpScreen;
