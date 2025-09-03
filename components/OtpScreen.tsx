import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView,Platform,Keyboard, Alert, ScrollView, TextInputKeyPressEventData, NativeSyntheticEvent } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { useNavigation } from "@react-navigation/native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";




type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, "OtpScreen">;

interface OtpScreenProps {
    navigation: OtpScreenNavigationProp;
  }

const OtpScreen: React.FC = () => {
  const navigation = useNavigation<OtpScreenNavigationProp>();
  const [otp, setOtp] = useState<string[]>(["", "", "", "",""]);
  const inputRefs = useRef<TextInput[]>([]);
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const route = useRoute();
  const { phoneNumber ,id } = route.params as { phoneNumber: string , id: string};
  
 
  console.log("Received phone number:", phoneNumber);

 useEffect(() => {
  const fetchReferenceId = async () => {
    try {
      const refId = await AsyncStorage.getItem("referenceId");
      if (refId) {
        setReferenceId(refId);
      }
    } catch (error) {
      console.error("Failed to load referenceId:", error);
    }
  };

  fetchReferenceId();
  }, []);
 

const [isOtpInvalid, setIsOtpInvalid] = useState(false);

const getUserProfile = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");  
    if (!storedToken) {
      Alert.alert("Error", "No authentication token found");
      return null;  
    }
    const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    return storedToken;  
  } catch (error) {
    Alert.alert("Error", "Failed to fetch user profile");
    console.error(error);
    return null;  
  }
};





// const verifyOTP = async () => {
//   const otpCode = otp.join("");
  
//   if (otpCode.length !== 5) {
//    // Alert.alert("Error", "Please enter a valid 5-digit OTP.");
//     setIsOtpInvalid(true);
//     return;
//   }

//   try {
//     setLoading(true);
//     const referenceId = await AsyncStorage.getItem("referenceId");
//     console.log("Reference ID:", referenceId);
      
//     const token = await getUserProfile();
//     if (!referenceId || !token) {
//       Alert.alert("Error", "Missing OTP reference or authentication token.");
//       return;
//     }
    
//     const otpVerificationUrl = "https://api.getshoutout.com/otpservice/verify";
//     const otpHeaders = {
//       Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
//       "Content-Type": "application/json",
//     };
    
//     const otpBody = {
//       code: otpCode,
//       referenceId,
//     };
    
//     const otpResponse = await axios.post(otpVerificationUrl, otpBody, { headers: otpHeaders });
//     const { statusCode } = otpResponse.data;
    
//     if (statusCode === "1000") {
//       setIsVerified(true);
//       Alert.alert("Success", "OTP verified successfully.");
      
//       const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
//       console.log("Stored customer data:", customerDataString);
      
//       if (!customerDataString) {
//         Alert.alert("Error", "No customer data found.");
//         return;
//       }
      
//       let customerData;
//       try {
//         customerData = JSON.parse(customerDataString);
//         console.log("Parsed customer data:", customerData);
//       } catch (e) {
//         console.error("Error parsing customer data:", e);
//         Alert.alert("Error", "Failed to parse customer data.");
//         return;
//       }
      
//       const saveCustomerUrl = `${environment.API_BASE_URL}api/customer/add-customer`;
      
//       const saveResponse = await axios.post(
//         saveCustomerUrl,
//         customerData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       console.log("API Response:", saveResponse.data);
      
//       if (saveResponse.status === 200) {
//         // Extract the customer ID from the response
//         const customerId = saveResponse.data.customerId;
//         console.log("New customer ID:", customerId);
        
//         // Save customer ID to AsyncStorage if needed for later use
//         await AsyncStorage.setItem("latestCustomerId", customerId.toString());
        
//        // Alert.alert("Success", "Customer registered successfully.");
        
//         // Navigate to the success screen with the customer ID
//   navigation.navigate("Main" as any, {
//   screen: "OtpSuccesfulScreen" as any,
//   params: {
//     customerId: customerId,
//     customerData: customerData, // You can pass the original data as well if needed
//   }
// });

//       } else {
//         Alert.alert("Error", `Failed to save customer: ${saveResponse.data.error}`);
//       }
//     } else {
//       setIsOtpInvalid(true);
//       Alert.alert("Error", "Invalid OTP. Please try again.");
//     }
//   } catch (error) {
//     console.error("Full error:", error);
//     console.error("Response data:");
    
//     Alert.alert("Error", "An error occurred while verifying OTP.");
//   } finally {
//     setLoading(false);
//   }
// };


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
    console.log("Reference ID:", referenceId);
      
    const token = await getUserProfile();
    if (!referenceId || !token) {
      Alert.alert("Error", "Missing OTP reference or authentication token.");
      return;
    }
    
    const otpVerificationUrl = "https://api.getshoutout.com/otpservice/verify";
    const otpHeaders = {
      Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
      "Content-Type": "application/json",
    };
    
    const otpBody = {
      code: otpCode,
      referenceId,
    };
    
    const otpResponse = await axios.post(otpVerificationUrl, otpBody, { headers: otpHeaders });
    const { statusCode } = otpResponse.data;
    
    if (statusCode === "1000") {
      setIsVerified(true);
     // Alert.alert("Success", "OTP verified successfully.");
      
      const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
      console.log("Stored customer data:", customerDataString);
      
      if (!customerDataString) {
        Alert.alert("Error", "No customer data found.");
        return;
      }
      
      let customerData;
      try {
        customerData = JSON.parse(customerDataString);
        console.log("Parsed customer data:", customerData);
      } catch (e) {
        console.error("Error parsing customer data:", e);
        Alert.alert("Error", "Failed to parse customer data.");
        return;
      }
      
      const saveCustomerUrl = `${environment.API_BASE_URL}api/customer/add-customer`;
      
      const saveResponse = await axios.post(
        saveCustomerUrl,
        customerData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("API Response:", saveResponse.data);
      
      if (saveResponse.status === 200) {
        const customerId = saveResponse.data.customerId;
        console.log("New customer ID:", customerId);
        
        await AsyncStorage.setItem("latestCustomerId", customerId.toString());
        
        navigation.navigate("Main" as any, {
          screen: "OtpSuccesfulScreen" as any,
          params: {
            customerId: customerId,
            customerData: customerData,
          }
        });

      } else {
        Alert.alert("Error", `Failed to save customer: ${saveResponse.data.error}`);
      }
    } else {
      setIsOtpInvalid(true);
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  } catch (error) {
    console.error("Full error:", error);
    console.error("Response data:");
    
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
      content: { sms: "Your code is {{code}}" },
      destination: phoneNumber,
    };

    const response = await axios.post(apiUrl, body, { headers });

    if (response.data.referenceId) {
      await AsyncStorage.setItem("referenceId", response.data.referenceId);
      setReferenceId(response.data.referenceId);
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



  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  // const handleOtpChange = (text: string, index: number) => {
  //   const newOtp = [...otp];
  //   newOtp[index] = text;
  //   setOtp(newOtp);
  
   
  //   if (text.length === 1 && index < inputRefs.current.length - 1) {
  //     inputRefs.current[index + 1]?.focus();
  //   }
  
  //   if (newOtp.every((digit) => digit.length === 1)) {
  //     Keyboard.dismiss();
  //   }
  // };


//   const handleOtpChange = (text: string, index: number) => {
//   const newOtp = [...otp];
  
//   // Only allow numeric input
//   if (text && !/^\d+$/.test(text)) {
//     return;
//   }

//   newOtp[index] = text;
//   setOtp(newOtp);

//   // Move to next input when a digit is entered
//   if (text.length === 1 && index < inputRefs.current.length - 1) {
//     inputRefs.current[index + 1]?.focus();
//   }

//   // Submit automatically when last digit is entered
//   if (newOtp.every((digit) => digit.length === 1)) {
//     Keyboard.dismiss();
//     verifyOTP(); // Optional: auto-submit when all digits are entered
//   }
// };

// const handleOtpChange = (text: string, index: number) => {
//   // Only allow numeric input
//   if (text && !/^\d+$/.test(text)) {
//     return;
//   }

//   // Update the OTP code
//   const updatedOtp = [...otp];
//   updatedOtp[index] = text;
//   setOtp(updatedOtp);

//   // Check if OTP is valid (all digits filled)
//   const isValid = updatedOtp.every(digit => digit.length === 1);
//   setIsOtpInvalid(isValid);

//   // Move to next input field if text is entered
//   if (text.length === 1 && index < inputRefs.current.length - 1) {
//     inputRefs.current[index + 1]?.focus();
//   }

//   // Dismiss keyboard and submit when last digit is entered
//   if (index === otp.length - 1 && text.length === 1) {
//     Keyboard.dismiss();
//     if (isValid) {
//       verifyOTP(); // Optional: auto-submit when all digits are entered
//     }
//   }
// };


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
  const isValid = updatedOtp.every(digit => digit.length === 1);
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

const handleKeyPress = ({ nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
  // Handle backspace to move to previous input
  if (key === 'Backspace' && !otp[index] && index > 0) {
    inputRefs.current[index - 1]?.focus();
  }
};

  // const verifyOTP = (code: string) => {
  //   // Implement OTP verification logic here
  //   console.log("Verifying OTP:", code);
  // };

// const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }, index: number) => {
//   if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
//     // Move focus to previous input on backspace when current is empty
//     inputRefs.current[index - 1]?.focus();
//   }
// };
 

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
                                            className="flex-1"
                                          >

<ScrollView 
      contentContainerStyle={{ flexGrow: 1 }} 
      keyboardShouldPersistTaps="handled"
    >                                  
                         <View className="flex-1 bg-white px-3 ">
      {/* Header */}
      <View className="bg-white flex-row items-center h-17 shadow-lg px-1 mb-8">
        
        <BackButton navigation={navigation} />
        {/* Title */}
        <Text style={{ fontSize: 18 }} className="font-bold text-center text-[#6C3CD1] flex-grow mr-9 text-xl ">
          OTP Verification
        </Text>
      </View>
     <View
      style = {{ paddingHorizontal: wp(5), paddingVertical: hp(1)}}
     className="flex-1">
      {/* Illustration */}
      <View className="flex items-center justify-center w-50 h-40 mb-3 pt-18 mx-12">
<Image
  source={require("../assets/images/4n_hand.webp")}
  style={{
    width: 170,
    height: 170,
    alignSelf: 'center',
  }}
  resizeMode="contain"
/>
</View>

    

      <Text className="text-black text-center mt-9 font-bold text-xl">
       Enter Verification Code.
      </Text>
      <Text className="text-[#808080] text-center mt-4">
      We have sent a Verification Code to your Customer’s mobile number
      </Text>

    
      {/* <View className="flex-row justify-center gap-3 mb-4 mt-1 px-4 ">
  {otp.map((digit, index) => (
    <TextInput
      key={index}
      ref={(el) => (inputRefs.current[index] = el as TextInput)}
      className={`w-12 h-12 text-lg text-center  rounded-lg 
        ${digit ? " bg-[#874DDB] text-[#FFFFFF]" : " bg-[#E7D7FF] text-pink-900"}`}
      keyboardType="numeric"
      maxLength={1}
      value={digit}
      onChangeText={(text) => handleOtpChange(text, index)}
      cursorColor={digit ? "#FFFFFF" : "#FFFFFF"}
                  selectionColor={digit ? "#FFFFFF" : "#874DDB"}
    />
  ))}
</View> */}
<View className="flex-row justify-center gap-3 mb-4 mt-1 px-4 ">
{otp.map((digit, index) => (
  <TextInput
    ref={(el) => (inputRefs.current[index] = el as TextInput)}
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
    key={`otp-input-${index}`}
  />
))}
</View>


<View className=" justify-center items-center bg-white  ">
  {/* Timer */}
  <Text className="text-black ">
    {timer > 0 ? `00:${timer < 10 ? `0${timer}` : timer}` : "Time expired"}
  </Text>

  {/* Resend OTP */}
 
  <View className="flex-row items-center justify-center mt-3">
  <Text className="text-black font-semibold">Didn’t receive the OTP ?</Text>
  <TouchableOpacity disabled={resendDisabled} onPress={handleResendOtp}>
  <Text className={`ml-2 font-semibold ${resendDisabled ? "text-gray-500" : "text-[#874DDB]"}`}>
    RESEND OTP
  </Text>
</TouchableOpacity>

 
</View>


  {/* Verify Button */}
  {!isKeyboardVisible &&
  <TouchableOpacity onPress={verifyOTP} disabled={loading}>
   <LinearGradient
   colors={["#6839CF", "#874DDB"]}
   className="py-3 px-14 items-center mt-[10%] mb-[5%] w-[57%] rounded-3xl h-15"
 >
   
     <Text className="text-center text-white font-bold">
          {loading ? "Verifying..." : "Verify"}
     </Text>
      </LinearGradient>
   </TouchableOpacity>

 }

 {/* Verify Button */}
{/* {!isKeyboardVisible &&
  <TouchableOpacity 
    onPress={verifyOTP} 
    disabled={loading || timer <= 0}
    style={{ opacity: (loading || timer <= 0) ? 0.5 : 1 }}
  >
    <LinearGradient
      colors={["#6839CF", "#874DDB"]}
      className="py-3 px-14 items-center mt-[10%] mb-[5%] w-[57%] rounded-3xl h-15"
    >
      <Text className="text-center text-white font-bold">
        {loading ? "Verifying..." : timer <= 0 ? "OTP Expired" : "Verify"}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
} */}
      
</View>
</View>
</View> 
</ScrollView>
    </KeyboardAvoidingView>
   
    
  );
};

export default OtpScreen;
