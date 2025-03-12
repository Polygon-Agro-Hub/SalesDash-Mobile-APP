import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

type View_CancelOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "View_CancelOrderScreen"
>;

interface View_CancelOrderScreenProps {
  navigation: View_CancelOrderScreenNavigationProp;
}

const View_CancelOrderScreen: React.FC<View_CancelOrderScreenProps> = ({
  navigation,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="bg-white flex-1">
        {/* Header */}
        <View className="flex-row items-center shadow-md px-3 bg-white ">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
            Order Status
          </Text>
        </View>

        {/* Order Status Timeline */}
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="p-5 mt-[-5] ml-6">
  <View className="border-l border-[#A6A6A6] pl-5 relative">
    {/* Order Placed */}
    <View className="flex-row items-center mb-12 ">
      <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
      <Text className="text-gray-700">Order Placed on 21th July 2024</Text>
    </View>

    {/* Payment Received */}
    <View className="flex-row items-center mb-12">
      <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
      <Text className="text-gray-700">Payment was received on 25th July 2024</Text>
    </View>

    {/* Order Processing */}
    <View className="flex-row items-center">
      <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
      <Text className="text-gray-700">Order is processing</Text>
    </View>
  </View>
</View>


          {/* Customer Information */}
          <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 ">
            <Text className="text-[#808FA2] font-semibold mb-2">Customer’s Name</Text>
            <Text className="text-[#000000]">Mr. Gayantha Perera</Text>

            <Text className="text-[#808FA2] font-semibold mt-3">Customer’s Phone Number</Text>
            <Text className="text-[#000000]">0781212500</Text>

            <Text className="text-[#808FA2] font-semibold mt-3">Building Type</Text>
            <Text className="text-[#000000]">House</Text>

            <Text className="text-[#808FA2] font-semibold mt-3">Address</Text>
            <Text className="text-[#000000]">11/B, Diyagama Rd, Homagama</Text>
          </View>

          {/* Payment Summary */}
          <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 mt-5">
            <Text className="text-[#212121] font-semibold">Payment Summary</Text>
            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3] ">Subtotal</Text>
              <Text className="text-[#212121] font-bold">Rs. 770.00</Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-[#8492A3]">Discount</Text>
              <Text className="text-[#8492A3]">Rs. 70.00</Text>
            </View>
            <View className="flex-row justify-between mt-2  pt-2">
              <Text className="font-semibold text-[#212121]">Grand Total</Text>
              <Text className="font-bold text-[#212121]">Rs. 480.00</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 mt-5">
            <Text className="text-[#212121] font-semibold">Payment Method</Text>
            <Text className="text-[#8492A3]">Online Payment</Text>
          </View>

          {/* Cancel Order Button */}
          <TouchableOpacity  className="mx-[25%] mt-8 mb-5 rounded-full">
      <LinearGradient
        colors={["#000000", "#323232"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="py-3 rounded-full items-center"
      >
        <Text className="text-white text-center font-semibold">Cancel Order</Text>
      </LinearGradient>
    </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <Navbar navigation={navigation} activeTab="ViewOrdersScreen" />
    </KeyboardAvoidingView>
  );
};

export default View_CancelOrderScreen;
