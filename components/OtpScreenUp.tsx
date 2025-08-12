import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Keyboard, Alert, ScrollView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { useNavigation } from "@react-navigation/native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios, { AxiosError } from "axios";
import environment from "@/environment/environment";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type OtpScreenUpNavigationProp = StackNavigationProp<RootStackParamList, "OtpScreenUp">;

interface OtpScreenUpProps {
  navigation: OtpScreenUpNavigationProp;
}

// Type definition for API error responses
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

const OtpScreenUp: React.FC = () => {
  const navigation = useNavigation<OtpScreenUpNavigationProp>();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const route = useRoute();
  const { phoneNumber, id } = route.params as { phoneNumber: string, id: string };

  console.log("Received phone number:", phoneNumber);
  console.log("Customer ID:", id);

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
  }, []);

  const [isOtpInvalid, setIsOtpInvalid] = useState(false);

  // Helper to get auth token - add this if you need token-based authentication
  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem("authToken");
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

//   const verifyOTP = async () => {
//     const otpCode = otp.join("");
    
//     console.log('OTP code:', otpCode);
    
//     if (otpCode.length < 5) {
//       Alert.alert("Error", "Please enter a valid 5-digit OTP.");
//       setIsOtpInvalid(true);
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const referenceId = await AsyncStorage.getItem("referenceId");
//       console.log('Reference ID:', referenceId);
      
//       if (!referenceId) {
//         Alert.alert("Error", "No OTP reference found.");
//         return;
//       }
      
//       const url = "https://api.getshoutout.com/otpservice/verify";
//       const headers = {
//         Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
//         "Content-Type": "application/json",
//       };
      
//       const body = {
//         code: otpCode,
//         referenceId,
//       };
      
//       // Step 1: Verify OTP
//       const response = await axios.post(url, body, { headers });
//       console.log('OTP verification response:', response.data);
      
//       const { statusCode } = response.data;
      
//       if (statusCode === "1000") {
//         setIsVerified(true);
        
//         // Step 2: Get customer data from AsyncStorage
//         const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
//         if (!customerDataString) {
//           Alert.alert("Error", "No customer data found.");
//           return;
//         }
        
//         // Parse customer data
//         const parsedData = JSON.parse(customerDataString);
//         console.log('Customer Data (parsed from AsyncStorage):', parsedData);
        
//         // Make sure the data matches what the backend expects
//         const customerData = parsedData.customerData || {};
//         const buildingData = parsedData.buildingData || {};
        
//         // For debugging
//         console.log('Customer Data (extracted):', customerData);
//         console.log('Building Data (extracted):', buildingData);
        
//         // Get auth token if your API requires it
//         const authToken = await getAuthToken();
//         const apiHeaders = {
//           'Content-Type': 'application/json',
//           ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
//         };
        
//         // Step 3: Attempt to update or create customer
//         try {
//           let endpoint;
//           let method;
//           let data;
          
//           if (id) {
//             // Update existing customer
//             endpoint = `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`;
//             method = 'put';
//             // Match backend expected format - the backend function expects two separate objects
//             data = {
//               customerData,
//               buildingData
//             };
//             console.log("Updating customer at:", endpoint);
//           } else {
//             // Create new customer
//             endpoint = `${environment.API_BASE_URL}api/customer/add-customer`;
//             method = 'post';
//             // Match backend expected format
//             data = {
//               customerData,
//               buildingData
//             };
//             console.log("Creating customer at:", endpoint);
//           }
          
//           console.log("Sending data:", data);
          
//           // Make the API call
//           const customerResponse = await axios({
//             method,
//             url: endpoint,
//             headers: apiHeaders,
//             data
//           });
          
//           console.log('API response:', customerResponse.data);
          
//           if (customerResponse.status === 200 || customerResponse.status === 201) {
//             // Extract customer ID from response or use existing ID
//             const customerId = customerResponse.data?.customerId || id;
//             console.log("Customer ID (from response or params):", customerId);
            
//             if (customerId) {
//               await AsyncStorage.setItem("latestCustomerId", customerId.toString());
//             }
            
//             Alert.alert(
//               "Success", 
//               id ? "Customer updated successfully." : "Customer created successfully."
//             );
            
//             // Navigate to success screen
//             // navigation.navigate("OtpSuccesfulScreen", {
//             //   customerId: customerId
//             // });
//             navigation.navigate("Main" as any, {
//   screen: "OtpSuccesfulScreen" as any,
//   params: {
//     customerId: customerId,
//  //   customerData: customerData, // You can pass the original data as well if needed
//   }
// });
//           } else {
//             throw new Error(customerResponse.data?.message || "Error processing customer data");
//           }
//         } catch (error) {
//           const apiError = error as AxiosError<ApiErrorResponse>;
          
//           console.error("Customer API error:", apiError);
          
//           // Extract error details
//           let errorMessage = "Failed to process customer data.";
          
//           if (apiError.response) {
//             // Server responded with a non-2xx status
//             console.log("API error response:", apiError.response.data);
//             console.log("API error status:", apiError.response.status);
            
//             // Format error message based on status code
//             if (apiError.response.status === 401) {
//               errorMessage = "Authentication failed. Please login again.";
//               // Optional: Redirect to login
//               // navigation.navigate("Login");
//             } else if (apiError.response.status === 400) {
//               errorMessage = apiError.response.data?.message || 
//                             apiError.response.data?.error || 
//                             "Invalid data provided.";
//             } else {
//               errorMessage = apiError.response.data?.message || 
//                             apiError.response.data?.error || 
//                             `Server error (${apiError.response.status})`;
//             }
//           } else if (apiError.request) {
//             // Request was made but no response received
//             errorMessage = "No response from server. Please check your internet connection.";
//           } else {
//             // Error in setting up the request
//             errorMessage = apiError.message || "An unknown error occurred";
//           }
          
//           Alert.alert("Error", errorMessage);
//         }
//       } else {
//         setIsOtpInvalid(true);
//         Alert.alert("Error", "Invalid OTP. Please try again.");
//       }
//     } catch (error) {
//       const otpError = error as Error | AxiosError;
//       console.log('Error during OTP verification:', otpError);
      
//       let errorMessage = "An error occurred during verification.";
      
//       if (axios.isAxiosError(otpError) && otpError.response) {
//         errorMessage = otpError.response.data?.message || errorMessage;
//       } else if ('message' in otpError) {
//         errorMessage = otpError.message;
//       }
      
//       Alert.alert("Error", errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };


// 1. Fixed verifyOTP function - Add timer check at the beginning
// const verifyOTP = async () => {
//   const otpCode = otp.join("");
  
//   console.log('OTP code:', otpCode);
  
//   if (otpCode.length < 6) {
//   //  Alert.alert("Error", "Please enter a valid 5-digit OTP.");
//     setIsOtpInvalid(true);
//     return;
//   }

//   // Check if timer has expired
//   if (timer <= 0) {
//     Alert.alert("Error", "OTP has expired. Please request a new one.");
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
    
//     // Rest of your verification logic remains the same...
//     const response = await axios.post(url, body, { headers });
//     console.log('OTP verification response:', response.data);
    
//     const { statusCode } = response.data;
    
//     if (statusCode === "1000") {
//       setIsVerified(true);
      
//       // Your existing customer data processing logic...
//       const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
//       if (!customerDataString) {
//         Alert.alert("Error", "No customer data found.");
//         return;
//       }
      
//       const parsedData = JSON.parse(customerDataString);
//       console.log('Customer Data (parsed from AsyncStorage):', parsedData);
      
//       const customerData = parsedData.customerData || {};
//       const buildingData = parsedData.buildingData || {};
      
//       console.log('Customer Data (extracted):', customerData);
//       console.log('Building Data (extracted):', buildingData);
      
//       const authToken = await getAuthToken();
//       const apiHeaders = {
//         'Content-Type': 'application/json',
//         ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
//       };
      
//       try {
//         let endpoint;
//         let method;
//         let data;
        
//         if (id) {
//           endpoint = `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`;
//           method = 'put';
//           data = { customerData, buildingData };
//           console.log("Updating customer at:", endpoint);
//         } else {
//           endpoint = `${environment.API_BASE_URL}api/customer/add-customer`;
//           method = 'post';
//           data = { customerData, buildingData };
//           console.log("Creating customer at:", endpoint);
//         }
        
//         console.log("Sending data:", data);
        
//         const customerResponse = await axios({
//           method,
//           url: endpoint,
//           headers: apiHeaders,
//           data
//         });
        
//         console.log('API response:', customerResponse.data);
        
//         if (customerResponse.status === 200 || customerResponse.status === 201) {
//           const customerId = customerResponse.data?.customerId || id;
//           console.log("Customer ID (from response or params):", customerId);
          
//           if (customerId) {
//             await AsyncStorage.setItem("latestCustomerId", customerId.toString());
//           }
          
//           Alert.alert(
//             "Success", 
//             id ? "Customer updated successfully." : "Customer created successfully."
//           );
          
//           navigation.navigate("Main" as any, {
//             screen: "OtpSuccesfulScreen" as any,
//             params: {
//               customerId: customerId,
//             }
//           });
//         } else {
//           throw new Error(customerResponse.data?.message || "Error processing customer data");
//         }
//       } catch (error) {
//         // Your existing error handling logic...
//         const apiError = error as AxiosError<ApiErrorResponse>;
//         console.error("Customer API error:", apiError);
        
//         let errorMessage = "Failed to process customer data.";
        
//         if (apiError.response) {
//           console.log("API error response:", apiError.response.data);
//           console.log("API error status:", apiError.response.status);
          
//           if (apiError.response.status === 401) {
//             errorMessage = "Authentication failed. Please login again.";
//           } else if (apiError.response.status === 400) {
//             errorMessage = apiError.response.data?.message || 
//                           apiError.response.data?.error || 
//                           "Invalid data provided.";
//           } else {
//             errorMessage = apiError.response.data?.message || 
//                           apiError.response.data?.error || 
//                           `Server error (${apiError.response.status})`;
//           }
//         } else if (apiError.request) {
//           errorMessage = "No response from server. Please check your internet connection.";
//         } else {
//           errorMessage = apiError.message || "An unknown error occurred";
//         }
        
//         Alert.alert("Error", errorMessage);
//       }
//     } else {
//       setIsOtpInvalid(true);
//       Alert.alert("Error", "Invalid OTP. Please try again.");
//     }
//   } catch (error) {
//     const otpError = error as Error | AxiosError;
//     console.log('Error during OTP verification:', otpError);
    
//     let errorMessage = "An error occurred during verification.";
    
//     if (axios.isAxiosError(otpError) && otpError.response) {
//       errorMessage = otpError.response.data?.message || errorMessage;
//     } else if ('message' in otpError) {
//       errorMessage = otpError.message;
//     }
    
//     Alert.alert("Error", errorMessage);
//   } finally {
//     setLoading(false);
//   }
// };

const verifyOTP = async () => {
  const otpCode = otp.join("");
  console.log("OTP code:", otpCode);

  if (otpCode.length !== 5) {
    setIsOtpInvalid(true);
   // Alert.alert("Error", "Please enter a valid 5-digit OTP.");
    return;
  }

  if (timer <= 0) {
    Alert.alert("Error", "OTP has expired. Please request a new one.");
    return;
  }

  try {
    setLoading(true);
    const referenceId = await AsyncStorage.getItem("referenceId");
    console.log("Reference ID:", referenceId);

    if (!referenceId) {
      Alert.alert("Error", "No OTP reference found. Please request a new OTP.");
      return;
    }

    const url = "https://api.getshoutout.com/otpservice/verify";
    const headers = {
      Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
      "Content-Type": "application/json",
    };

    const body = {
      code: otpCode,
      referenceId,
    };

    const response = await axios.post(url, body, { headers });
    console.log("OTP verification response:", response.data);

    const { statusCode } = response.data;

    if (statusCode === "1000") {
      console.log("OTP verified successfully");
      setIsVerified(true);

      const customerDataString = await AsyncStorage.getItem("pendingCustomerData");
      if (!customerDataString) {
        console.log("No pendingCustomerData found");
        Alert.alert("Error", "No customer data found.");
        return;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(customerDataString);
      } catch (error) {
        console.error("Failed to parse customer data:", error);
        Alert.alert("Error", "Invalid customer data format.");
        return;
      }

      const customerData = parsedData.customerData || {};
      const buildingData = parsedData.buildingData || {};
      console.log("Customer Data:", customerData);
      console.log("Building Data:", buildingData);

      const authToken = await getAuthToken();
      const apiHeaders = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      try {
        let endpoint;
        let method;
        let data;

        if (id) {
          endpoint = `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`;
          method = "put";
          data = { customerData, buildingData };
          console.log("Updating customer at:", endpoint);
        } else {
          endpoint = `${environment.API_BASE_URL}api/customer/add-customer`;
          method = "post";
          data = { customerData, buildingData };
          console.log("Creating customer at:", endpoint);
        }

        console.log("Sending data:", data);

        const customerResponse = await axios({
          method,
          url: endpoint,
          headers: apiHeaders,
          data,
        });

        console.log("Customer API response:", customerResponse.data);

        if (customerResponse.status === 200 || customerResponse.status === 201) {
          const customerId = customerResponse.data?.customerId || id;
          console.log("Customer ID:", customerId);

          if (customerId) {
            await AsyncStorage.setItem("latestCustomerId", customerId.toString());
          }

          // Alert.alert(
          //   "Success",
          //   id ? "Customer updated successfully." : "Customer created successfully."
          // );

          console.log("Navigating to OtpSuccesfulScreen with customerId:", customerId);
          navigation.navigate("Main", {
            screen: "OtpSuccesfulScreen",
            params: { customerId },
          });
        } else {
          throw new Error(customerResponse.data?.message || "Error processing customer data");
        }
      } catch (error) {
        const apiError = error as AxiosError<ApiErrorResponse>;
        console.error("Customer API error:", apiError);

        let errorMessage = "Failed to process customer data.";

        if (apiError.response) {
          console.log("API error response:", apiError.response.data);
          console.log("API error status:", apiError.response.status);

          if (apiError.response.status === 401) {
            errorMessage = "Authentication failed. Please login again.";
          } else if (apiError.response.status === 400) {
            errorMessage =
              apiError.response.data?.message ||
              apiError.response.data?.error ||
              "Invalid data provided.";
          } else {
            errorMessage =
              apiError.response.data?.message ||
              apiError.response.data?.error ||
              `Server error (${apiError.response.status})`;
          }
        } else if (apiError.request) {
          errorMessage = "No response from server. Please check your internet connection.";
        } else {
          errorMessage = apiError.message || "An unknown error occurred";
        }

        Alert.alert("Error", errorMessage);
      }
    } else {
      console.log("Invalid OTP, statusCode:", statusCode);
      setIsOtpInvalid(true);
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  } catch (error) {
    const otpError = error as Error | AxiosError;
    console.error("Error during OTP verification:", otpError);

    let errorMessage = "An error occurred during verification.";

    if (axios.isAxiosError(otpError) && otpError.response) {
      errorMessage = otpError.response.data?.message || errorMessage;
    } else if ("message" in otpError) {
      errorMessage = otpError.message;
    }

    Alert.alert("Error", errorMessage);
  } finally {
    console.log("Verification completed, loading set to false");
    setLoading(false);
  }
};

// 2. Fixed handleOtpChange function - Add timer check before auto-verification
const handleOtpChange = (text: string, index: number) => {
  const newOtp = [...otp];
  
  // Only allow numeric input
  if (text && !/^\d+$/.test(text)) {
    return;
  }

  newOtp[index] = text;
  setOtp(newOtp);

  // Move to next input when a digit is entered
  if (text.length === 1 && index < inputRefs.current.length - 1) {
    inputRefs.current[index + 1]?.focus();
  }

  // Submit automatically when last digit is entered, but only if timer hasn't expired
  if (newOtp.every((digit) => digit.length === 1)) {
    Keyboard.dismiss();
    // Only auto-submit if timer hasn't expired
    if (timer > 0) {
      verifyOTP();
    }
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
        setResendDisabled(false); 
      }
    } catch (error) {
      const resendError = error as Error | AxiosError;
      console.error("Error resending OTP:", resendError);
      
      let errorMessage = "Failed to resend OTP.";
      
      if (axios.isAxiosError(resendError) && resendError.response) {
        errorMessage = resendError.response.data?.message || errorMessage;
      } else if ('message' in resendError) {
        errorMessage = resendError.message;
      }
      
      Alert.alert("Error", errorMessage);
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

  //  const handleOtpChange = (text: string, index: number) => {
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
  
  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }, index: number) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move focus to previous input on backspace when current is empty
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
      className="flex-1"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
      >     
        <View className="flex-1 bg-white px-3">
          {/* Header */}
          <View className="bg-white flex-row items-center h-17 shadow-lg px-1 mb-8">
          
            <BackButton navigation={navigation} />
            {/* Title */}
            <Text style={{ fontSize: 18 }} className="font-bold text-center text-[#6C3CD1] flex-grow mr-9 text-xl">
              OTP Verification
            </Text>
          </View>
          <View
            style={{ paddingHorizontal: wp(5), paddingVertical: hp(1)}}
            className="flex-1"
          >
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

            {/* Instruction Text */}
            <Text className="text-black text-center mt-9 font-bold text-xl">
              Enter Verification Code
            </Text>
            <Text className="text-[#808080] text-center mt-4">
              We have sent a Verification Code to your Customer's mobile number
            </Text>

            {/* OTP Input Fields */}
            {/* <View className="flex-row justify-center gap-3 mb-4 mt-1 px-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el as TextInput)}
                  className={`w-12 h-12 text-lg text-center rounded-lg 
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
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el as TextInput)}
                  className={`w-12 h-12 text-lg text-center rounded-lg 
                    ${digit ? "bg-[#874DDB] text-[#FFFFFF]" : "bg-[#E7D7FF] text-pink-900"}`}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  cursorColor={digit ? "#FFFFFF" : "#FFFFFF"}
                  selectionColor={digit ? "#FFFFFF" : "#874DDB"}
                />
              ))}
            </View>

            <View className="justify-center items-center bg-white">
              {/* Timer */}
              <Text className="text-black">
                {timer > 0 ? `00:${timer < 10 ? `0${timer}` : timer}` : "Time expired"}
              </Text>

              {/* Resend OTP */}
              <View className="flex-row items-center justify-center mt-3">
                <Text className="text-black font-semibold">Didn't receive the OTP?</Text>
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
                  className="py-3 px-14  items-center mt-[10%] mb-[5%] w-[57%] rounded-3xl h-15"
                >
                 
                    <Text className="text-center text-white font-bold">
                      {loading ? "Verifying..." : "Verify"}
                    </Text>
                         </LinearGradient>
                  </TouchableOpacity>
           
              }
            </View>
          </View>
        </View> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OtpScreenUp;