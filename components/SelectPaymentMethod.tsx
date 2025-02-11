import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";

type SelectPaymentMethodNavigationProp = StackNavigationProp<RootStackParamList, "SelectPaymentMethod">;

interface SelectPaymentMethodProps {
  navigation: SelectPaymentMethodNavigationProp;
}

const SelectPaymentMethod: React.FC<SelectPaymentMethodProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"online" | "cash" | null>("online");

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <ScrollView className="bg-white flex-1 ">
        {/* Header */}
        <View className="flex-row items-center shadow-md px-3  bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
            Select Payment Method
          </Text>
        </View>

        {/* Payment Image */}
        <View className="flex items-center justify-center mt-3 ">
          <Image
            source={require("../assets/images/payment.png")}
            className="w-84 h-60"
            resizeMode="contain"
          />
        </View>

        {/* Payment Options */}
        <View className="flex-1 w-full items-center space-y-5 p-12 mt-[-10]">
  {/* Online Payment Option */}
  <TouchableOpacity
    onPress={() => setSelectedMethod("online")}
    className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${
      selectedMethod === "online" ? "bg-[#6C3CD1] border-[#6C3CD1]" : "bg-white border-[#5D5D5D]"
    }`}
  >
    <Text className={`text-lg ${selectedMethod === "online" ? "text-white font-bold" : "text-gray-700 font-medium"}`}>
      Online Payment
    </Text>
    {selectedMethod === "online" && (
      <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
        <Image 
          source={require("../assets/images/DonePurple.png")} 
          className="w-5 h-5" // ✅ Adjusted size
          resizeMode="contain"
        />
      </View>
    )}
  </TouchableOpacity>

  {/* Pay By Cash Option */}
  <TouchableOpacity
    onPress={() => setSelectedMethod("cash")}
    className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${
      selectedMethod === "cash" ? "bg-[#6C3CD1] border-[#6C3CD1]" : "bg-white border-[#5D5D5D]"
    }`}
  >
    <Text className={`text-lg ${selectedMethod === "cash" ? "text-white font-bold" : "text-gray-700 font-medium"}`}>
      Pay By Cash
    </Text>
    {selectedMethod === "cash" && (
      <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
        <Image 
          source={require("../assets/images/DonePurple.png")} 
          className="w-5 h-5" // ✅ Adjusted size
          resizeMode="contain"
        />
      </View>
    )}
  </TouchableOpacity>
</View>


       <LinearGradient colors={["#6839CF", "#874DDB"]} className="py-3 px-4 rounded-lg items-center mb-[22%] mr-[25%] ml-[25%] rounded-3xl h-15">
                       <TouchableOpacity
                       onPress={() => navigation.navigate("OrderSummeryScreen")}
                       >
                         <Text className="text-center text-white font-bold">Proceed
                         </Text>
                       </TouchableOpacity>
                     </LinearGradient>
      </ScrollView>

      {/* Bottom Navbar (hidden when keyboard is visible) */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default SelectPaymentMethod;
