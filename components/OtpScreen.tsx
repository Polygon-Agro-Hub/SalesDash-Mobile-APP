import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView,Platform,Keyboard } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { useNavigation } from "@react-navigation/native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import Navbar from "./Navbar";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";

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
  

  const handleResendOtp = () => {
    setOtp(["", "", "", "",""]);
    setTimer(60);
    setResendDisabled(true);
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
                      className="flex-1 bg-white"
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
    <Text className={`ml-2 font-semibold ${resendDisabled ? "text-[#874DDB]" : "text-[#874DDB]"}`}>
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
   <TouchableOpacity onPress={() => navigation.navigate("OtpSuccesfulScreen")}>
     <Text className="text-center text-white font-bold">Verify</Text>
   </TouchableOpacity>
 </LinearGradient>
 }
      
</View>
</View>
</View> 
{!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
    
  );
};

export default OtpScreen;
