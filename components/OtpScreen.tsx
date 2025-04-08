import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView,Platform,Keyboard, Alert, ScrollView } from "react-native";
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
import { useTranslation } from "react-i18next";



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
  //const [otpCode, setOtpCode] = useState<string>("");
  const [maskedCode, setMaskedCode] = useState<string>("XXXXX");
 // const [referenceId, setReferenceId] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const [otpCode, setOtpCode] = useState<string>("");

  //const [phoneNumber, setPhoneNumber] = useState('');
 // const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
 // const [referenceId, setReferenceId] = useState<string | null>(null);
  //const [timer, setTimer] = useState<number>(240);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [disabledResend, setDisabledResend] = useState<boolean>(true);
  const { t } = useTranslation();
  const [language, setLanguage] = useState("en");
  const [isOtpValid, setIsOtpValid] = useState<boolean>(false);

 
 // const phoneNumber = route.params?.phoneNumber;


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
    const storedToken = await AsyncStorage.getItem("authToken");  // Retrieve the authToken
    if (!storedToken) {
      Alert.alert("Error", "No authentication token found");
      return null;  // Return null if the token is not found
    }
    const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    return storedToken;  // Return the token if successfully fetched
  } catch (error) {
    Alert.alert("Error", "Failed to fetch user profile");
    console.error(error);
    return null;  // Return null if there's an error
  }
};

// const verifyOTP = async () => {
//   const otpCode = otp.join(""); // Join OTP array into a single string

//   if (otpCode.length < 5) {
//     Alert.alert("Error", "Please enter a valid 5-digit OTP.");
//     setIsOtpInvalid(true);
//     return;
//   }

//   try {
//     setLoading(true);
//     const referenceId = await AsyncStorage.getItem("referenceId");
//     console.log("Reference ID:", referenceId); // Log reference ID

//     // Get the authToken from AsyncStorage
//     const token = await getUserProfile();
//     if (!referenceId || !token) {
//       Alert.alert("Error", "Missing OTP reference or authentication token.");
//       return;
//     }

//     const url = "https://api.getshoutout.com/otpservice/verify";
//     const headers = {
//       Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
//       "Content-Type": "application/json",
//     };
//     console.log("Request Headers: before", headers);

//     const body = {
//       code: otpCode,
//       referenceId,
//     };

//     console.log("Request Headers: after", headers);

//     const response = await axios.post(url, body, { headers });
//     const { statusCode } = response.data;

//     if (statusCode === "1000") {
//       setIsVerified(true);
//       Alert.alert("Success", "OTP verified successfully.");

//       // Retrieve stored customer data
//       const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
//       console.log("Stored customer data:", customerDataString); // Log raw customer data

//       if (!customerDataString) {
//         Alert.alert("Error", "No customer data found.");
//         return;
//       }

//       let customerData;
//       try {
//         customerData = JSON.parse(customerDataString);
//         console.log("Parsed customer data:", customerData); // Log parsed customer data
//       } catch (e) {
//         console.error("Error parsing customer data:", e);
//         Alert.alert("Error", "Failed to parse customer data.");
//         return;
//       }

//       // Send customer data to the backend with the token in the header
//       const saveResponse = await axios.post(
//         `${environment.API_BASE_URL}api/customer/add-customer`,  // Correct the URL format
//         customerData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,  // Correctly pass token as authorization header
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (saveResponse.status === 200) {
//         Alert.alert("Success", "Customer registered successfully.");
//         navigation.navigate("OtpSuccesfulScreen");
//       } else {
//         Alert.alert("Error", `Failed to save customer: ${saveResponse.data.error}`);
//       }

//     } else {
//       setIsOtpInvalid(true);
//       Alert.alert("Error", "Invalid OTP. Please try again.");
//     }
//   } catch (error) {
//     Alert.alert("Error", "An error occurred while verifying OTP.");
//     console.error(error);
//   } finally {
//     setLoading(false);
//   }
// };

const verifyOTP = async () => {
  const otpCode = otp.join(""); // Join OTP array into a single string

  // Ensure OTP is a valid 5-digit code
  if (otpCode.length !== 5) {
    Alert.alert("Error", "Please enter a valid 5-digit OTP.");
    setIsOtpInvalid(true);
    return;
  }

  try {
    setLoading(true);
    const referenceId = await AsyncStorage.getItem("referenceId");
    console.log("Reference ID:", referenceId); // Log reference ID

    // Get the authToken from AsyncStorage
    const token = await getUserProfile();
    if (!referenceId || !token) {
      Alert.alert("Error", "Missing OTP reference or authentication token.");
      return;
    }

    // Step 1: Verify OTP using the API
    const otpVerificationUrl = "https://api.getshoutout.com/otpservice/verify";
    const otpHeaders = {
      Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`, // Use your correct API key
      "Content-Type": "application/json",
    };

    const otpBody = {
      code: otpCode,
      referenceId,
    };

    // Make the request to verify OTP
    const otpResponse = await axios.post(otpVerificationUrl, otpBody, { headers: otpHeaders });
    const { statusCode } = otpResponse.data;

    if (statusCode === "1000") {
      setIsVerified(true);
      Alert.alert("Success", "OTP verified successfully.");

      // Step 2: After OTP is verified, retrieve the customer data from AsyncStorage
      const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
      console.log("Stored customer data:", customerDataString); // Log raw customer data

      if (!customerDataString) {
        Alert.alert("Error", "No customer data found.");
        return;
      }

      let customerData;
      try {
        customerData = JSON.parse(customerDataString);
        console.log("Parsed customer data:", customerData); // Log parsed customer data
      } catch (e) {
        console.error("Error parsing customer data:", e);
        Alert.alert("Error", "Failed to parse customer data.");
        return;
      }

      // Step 3: Send customer data to the backend
      const saveCustomerUrl = `${environment.API_BASE_URL}api/customer/add-customer`;  // Correct URL format
      const saveResponse = await axios.post(
        saveCustomerUrl,
        customerData,
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Pass token as authorization header
            "Content-Type": "application/json",
          },
        }
      );
      console.log(saveResponse)

      // Step 4: Handle response from the backend
      if (saveResponse.status === 200) {
        Alert.alert("Success", "Customer registered successfully.");
        navigation.navigate("OtpSuccesfulScreen");
      } else {
        Alert.alert("Error", `Failed to save customer: ${saveResponse.data.error}`);
      }

    } else {
      setIsOtpInvalid(true);
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  } catch (error) {
    Alert.alert("Error", "An error occurred while verifying OTP.");
    console.error(error);
  } finally {
    setLoading(false);
  }
};




// const verifyOTP = async () => {
//   const otpCode = otp.join(""); // Join OTP array into a single string
//   console.log('OTP code:', otpCode);

//   if (otpCode.length < 5) {
//     Alert.alert("Error", "Please enter a valid 5-digit OTP.");
//     setIsOtpInvalid(true);
//     return;
//   }

//   try {
//     setLoading(true);
//     const referenceId = await AsyncStorage.getItem("referenceId");
//     console.log('Reference ID:', referenceId);

//     if (!referenceId) {
//       Alert.alert("Error", "No OTP reference found.");
//       return;
//     }

//     const url = "https://api.getshoutout.com/otpservice/verify";
//     const headers = {
//       Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
//       "Content-Type": "application/json",
//     };

//     const body = {
//       code: otpCode,
//       referenceId,
//     };

//     const response = await axios.post(url, body, { headers });
//     console.log('OTP verification response:', response.data);

//     const { statusCode } = response.data;

//     if (statusCode === "1000") {
//       setIsVerified(true);
//       Alert.alert("Success", "OTP verified successfully.");

//       // Retrieve stored customer data
//       const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
//       if (!customerDataString) {
//         Alert.alert("Error", "No customer data found.");
//         return;
//       }

//       const customerData = JSON.parse(customerDataString);
//       console.log('Customer Data:', customerData);

//       // Add the customer first
//       try {
//         const saveResponse = await axios.post(
//           `${environment.API_BASE_URL}api/customer/add-customer`,
//           customerData
//         );
//         console.log('Add customer response:', saveResponse);

//         if (saveResponse.status === 200 || saveResponse.status === 201) {
//           Alert.alert("Success", "Customer registered successfully.");
//         } else {
//           Alert.alert("Error", `Failed to save customer: ${saveResponse.data.error}`);
//         }
//       } catch (addError) {
//         console.error('Error adding customer:', addError);
//         Alert.alert("Error", "Failed to add customer.");
//       }

//       // After adding, check if the customer exists and update if needed
//       try {
//         const existingCustomerResponse = await axios.get(
//           `${environment.API_BASE_URL}api/customer/get-customer-data/${id}`
//         );
//         console.log('Existing customer response:', existingCustomerResponse);

//         if (existingCustomerResponse.status === 200 && existingCustomerResponse.data) {
//           // Customer exists, update their details
//           const updateResponse = await axios.put(
//             `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
//             customerData
//           );
//           console.log('Update response:', updateResponse);

//           if (updateResponse.status === 200) {
//             Alert.alert("Success", "Customer updated successfully.");
//           } else {
//             Alert.alert("Error", `Failed to update customer: ${id}`);
//           }
//         }
//       } catch (updateError) {
//         console.error('Error updating customer:', updateError);
//         Alert.alert("Error", "Failed to update customer.");
//       }

//       navigation.navigate("OtpSuccesfulScreen");
//     } else {
//       setIsOtpInvalid(true);
//       Alert.alert("Error", "Invalid OTP. Please try again.");
//     }
//   } catch (error) {
//     console.log('Error during OTP verification:', error);
//     Alert.alert("Error", "An error occurred while verifying OTP.");
//   } finally {
//     setLoading(false);
//   }
// };














const handleResendOtp = async () => {
  try {
    setOtp(["", "", "", "", ""]); // Clear OTP input
    setResendDisabled(true);
    setTimer(60); // Reset timer

    const apiUrl = "https://api.getshoutout.com/otpservice/send";
    const headers = {
      Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
      "Content-Type": "application/json",
    };

    const body = {
      source: "ShoutDEMO",
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
      setResendDisabled(false); // Allow user to try again
    }
  } catch (error) {
    Alert.alert("Error", "An error occurred while resending OTP.");
    setResendDisabled(false); // Allow user to try again
  }
};

// Timer Effect
useEffect(() => {
  if (timer > 0) {
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  } else {
    setResendDisabled(false); // Enable resend after timeout
  }
}, [timer]);



// const handleResendOtp = () => {
//   setOtp(["", "", "", "", ""]);  // Reset OTP fields
//   setTimer(60);  // Reset timer to 60 seconds
//   setResendDisabled(true);  // Disable resend button temporarily

//   // Re-enable the resend button after 60 seconds
//   setTimeout(() => setResendDisabled(false), 60000);
// };

// useEffect(() => {
//   if (timer > 0) {
//     const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
//     return () => clearInterval(interval);
//   } else {
//     setResendDisabled(false);
//   }
// }, [timer]);





  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  
    // Move to next input field if character entered
    if (text.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  
    // Check if all fields are filled, then dismiss the keyboard
    if (newOtp.every((digit) => digit.length === 1)) {
      Keyboard.dismiss();
    }
  };
  

  // const handleResendOtp = () => {
  //   setOtp(["", "", "", "",""]);
  //   setTimer(60);
  //   setResendDisabled(true);
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
        {/* Back Button */}
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
    source={require("../assets/images/4n_hand.png")}
    className="w-29 h-29 "
    resizeMode="contain"
  />
</View>

      {/* Instruction Text */}

      <Text className="text-black text-center mt-9 font-bold text-xl">
       Enter Verification Code.
      </Text>
      <Text className="text-[#808080] text-center mt-4">
      We have sent a Verification Code to your Customer’s mobile number
      </Text>

      {/* OTP Input Fields */}
      <View className="flex-row justify-center gap-3 mb-4 mt-1 px-4 ">
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
   <LinearGradient
   colors={["#6839CF", "#874DDB"]}
   className="py-3 px-14 rounded-lg items-center mt-[10%] mb-[5%] w-[57%] rounded-3xl h-15"
 >
   <TouchableOpacity onPress={verifyOTP} disabled={loading}>
     <Text className="text-center text-white font-bold">
       {loading ? "Verify" : "Verify"}
     </Text>
   </TouchableOpacity>
 </LinearGradient>
 }
      
</View>
</View>
</View> 
</ScrollView>
    </KeyboardAvoidingView>
   
    
  );
};

export default OtpScreen;
