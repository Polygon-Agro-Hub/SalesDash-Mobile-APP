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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../common/CustomHeader";

type OtpScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OtpScreen"
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
  const { phoneNumber } = route.params as {
    phoneNumber: string;
    id: string;
  };

  const [isOtpInvalid, setIsOtpInvalid] = useState(false);

  // Check if all OTP digits are filled
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

    // Check if timer has expired
    if (timer <= 0) {
      Alert.alert("Error", "OTP has expired. Please request a new one.");
      return;
    }

    try {
      setLoading(true);
      const referenceId = await AsyncStorage.getItem("referenceId");

      const token = await getUserProfile();
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
        const customerDataString = await AsyncStorage.getItem(
          "pendingCustomerData",
        );

        if (!customerDataString) {
          Alert.alert("Error", "No customer data found.");
          return;
        }

        let customerData;
        try {
          customerData = JSON.parse(customerDataString);
        } catch (e) {
          console.error("Error parsing customer data:", e);
          Alert.alert("Error", "Failed to parse customer data.");
          return;
        }

        const saveCustomerUrl = `${environment.API_BASE_URL}api/customer/add-customer`;

        const saveResponse = await axios.post(saveCustomerUrl, customerData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (saveResponse.status === 200) {
          const customerId = saveResponse.data.customerId;

          await AsyncStorage.setItem("latestCustomerId", customerId.toString());

          navigation.navigate("Main" as any, {
            screen: "OtpSuccesfulScreen" as any,
            params: {
              customerId: customerId,
              customerData: customerData,
            },
          });
        } else {
          Alert.alert(
            "Error",
            `Failed to save customer: ${saveResponse.data.error}`,
          );
        }
      } else {
        setIsOtpInvalid(true);
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Full error:", error);
      Alert.alert("Error", "An error occurred while verifying OTP.");
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
          sms: "Thank you for registering with us a Market Place customer. Please use the bellow OTP to confirm the registration process. {{code}}",
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
    // Only allow numeric input
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    // Update the OTP code
    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);

    // Check if OTP is valid (all digits filled)
    const isValid = updatedOtp.every((digit) => digit.length === 1);
    setIsOtpInvalid(!isValid);

    // Move to next input field if text is entered
    if (text.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Dismiss keyboard and submit when last digit is entered
    if (index === otp.length - 1 && text.length === 1) {
      Keyboard.dismiss();
      // Only auto-submit if timer hasn't expired and OTP is valid
      if (isValid && timer > 0) {
        verifyOTP();
      }
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    // Handle backspace to move to previous input
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <CustomHeader
          title="OTP Verification"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
          onBackPress={() => navigation.goBack()}
        />
        <View className="flex-1 bg-white">
          <View
            style={{ paddingHorizontal: wp(5), paddingVertical: hp(2) }}
            className="flex-1 justify-center"
          >
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

            {/* OTP Input Section - Centered */}
            <View className="flex-row justify-center gap-3 mt-8 mb-4 px-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={`otp-input-${index}`}
                  ref={(el: TextInput | null) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-12 text-lg text-center rounded-lg border-2 ${
                    digit
                      ? "bg-[#874DDB] text-white border-[#874DDB]"
                      : "bg-[#E7D7FF] text-pink-900 border-[#E7D7FF]"
                  }`}
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
              <View className="flex-row items-center justify-center mt-3">
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

              {/* Verify Button - Disabled until all digits are entered */}
              {!isKeyboardVisible && (
                <TouchableOpacity 
                  onPress={verifyOTP} 
                  disabled={!isOtpComplete || loading || timer <= 0}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={!isOtpComplete || loading || timer <= 0 ? ["#6839CF", "#874DDB"] : ["#6839CF", "#874DDB"]}
                    className={`py-3 px-14 items-center mt-10 rounded-3xl ${
                      !isOtpComplete || loading || timer <= 0 ? "opacity-50" : ""
                    }`}
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

export default OtpScreen;