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



type OrderSummeryScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderSummeryScreen">;

interface OrderSummeryScreenProps {
  navigation: OrderSummeryScreenNavigationProp;
}

const OrderSummeryScreen: React.FC<OrderSummeryScreenProps> = ({ navigation }) => {

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
        
        {/* Scrollable Content */}
        
          {/* Header */}
          <View className="flex-row items-center shadow-md px-3 bg-white py-3">
            <BackButton navigation={navigation} />
            <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
              Order Summary
            </Text>
          </View>
          <ScrollView 
          showsVerticalScrollIndicator={true} 
          contentContainerStyle={{ paddingBottom: 20 }} 
          className="flex-1 px-4"
        >
  <View className="px-2">
  
          {/* Delivery Details */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
  <View className="flex-row items-center">
    
    {/* Left Side: Icon + Delivery Details (flex-1 ensures it takes remaining space) */}
    <View className="flex-row items-center space-x-2 flex-1">
      <Image source={require("../assets/images/delivery.png")} className="w-10 h-10" />
      
      <View>
      
        <View className="flex-row justify-between">
              <Text className="text-base font-semibold">Delivery - One Time</Text>
              <TouchableOpacity 
             // onPress={() => navigation.navigate("ScheduleScreen", { totalPrice })}

              className="border border-[#6C3CD1] px-3  rounded-full ml-12">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
        <Text className="text-[#808FA2] text-sm">Scheduled to 2024/12/18</Text>
        <Text className="text-[#808FA2] text-sm">Within 8-12 AM</Text>
      </View>
    </View>

    {/* Right Side: Edit Button (pushed to the right with ml-auto) */}
    

  </View>
</View>

  
          {/* Customer Info */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <Text className="text-[#808FA2] text-xs">Customer’s Name</Text>
            <Text className="text-black font-medium">Mr. Gayantha Perera</Text>
  
            <Text className="text-[#808FA2] text-xs mt-2">Customer’s Phone Number</Text>
            <Text className="text-black font-medium">0781212500</Text>
  
            <Text className="text-[#808FA2] text-xs mt-2">Building Type</Text>
            <Text className="text-black font-medium">House</Text>
  
            <Text className="text-[#808FA2] text-xs mt-2">Address</Text>
            <Text className="text-black font-medium">11/B, Diyagama Rd, Homagama</Text>
          </View>
  
          {/* Payment Summary */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
          <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Summery</Text>
              <TouchableOpacity 
              onPress={() => navigation.navigate("OrderScreen")}
              className="border border-[#6C3CD1] px-3 rounded-full">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#8492A3] font-medium">Subtotal</Text>
              <Text className="text-black font-medium mr-12">Rs.770.00</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#8492A3]">Discount</Text>
              <Text className="text-gray-500 mr-12">Rs.70.00</Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-black font-semibold">Grand Total</Text>
              <Text className="text-black font-semibold mr-12">Rs.480.00</Text>
            </View>
          </View>
  
          {/* Payment Method */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Method</Text>
              <TouchableOpacity 
              onPress={() => navigation.navigate("SelectPaymentMethod")}
              className="border border-[#6C3CD1] px-3 rounded-full">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[#8492A3] mt-1">Online Payment</Text>
          </View>
          </View>
  
          {/* Confirm Button */}
           <LinearGradient colors={["#6839CF", "#874DDB"]} className="py-3 px-4 rounded-lg items-center mt-[10%] mb-[10%] mr-[25%] ml-[25%] rounded-3xl h-15">
                                 <TouchableOpacity
                                 onPress={() => navigation.navigate("OrderConfirmedScreen")}
                                 >
                                   <Text className="text-center text-white font-bold">Confirm
                                   </Text>
                                 </TouchableOpacity>
                               </LinearGradient>
  
        </ScrollView>
  
        {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
      
      </KeyboardAvoidingView>
    );
  };

export default OrderSummeryScreen;
