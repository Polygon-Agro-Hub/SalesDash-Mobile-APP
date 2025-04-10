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
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp } from "@react-navigation/native";

// Define types for the route parameters
type SelectPaymentMethodRouteProp = RouteProp<RootStackParamList, "SelectPaymentMethod">;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  price: number;
  quantity: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
}

interface SelectPaymentMethodProps {
  navigation: StackNavigationProp<RootStackParamList, "SelectPaymentMethod">;
  route: SelectPaymentMethodRouteProp & {
   
      params: {
        items?: Array<{
          id: number;
          name: string;
          price: number;
          normalPrice: number;
          discountedPrice: number;
          quantity: number;
          selected: boolean;
          customerId:string;
          unitType: string;
          startValue: number;
          changeby: number;
        }>;
        total?: number;
        subtotal?: number;
        discount?: number;
        id?: string;
        isCustomPackage?: string;
        isSelectPackage?: string;
        customerid?: string; // Add customerid at the top level of params
        
        orderItems?: Array<{
          additionalItems?: Array<AdditionalItem>;
          isAdditionalItems: boolean;
          customerid?: string; // Keep this too if needed in orderItems
          isModifiedMin: boolean;
          isModifiedPlus: boolean;
          modifiedMinItems: Array<{
            additionalDiscount: number;
            additionalPrice: number;
            modifiedQuantity: number;
            originalPrice: string;
            originalQuantity: number;
            packageDetailsId: number;
          }>;
          modifiedPlusItems: Array<{
            additionalDiscount: number;
            additionalPrice: number;
            modifiedQuantity: number;
            originalPrice: string;
            originalQuantity: number;
            packageDetailsId: number;
          }>;
          packageDiscount: number;
          packageId: number;
          
          packageTotal: number;
        }>;
      };
    };
  
}

const SelectPaymentMethod: React.FC<SelectPaymentMethodProps> = ({ navigation, route }) => {
  const { customerid, isCustomPackage, isSelectPackage} = route.params || {};
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Online Payment" | "Pay By Cash" | null>("Online Payment");

  //console.log("isCustomPackage",isCustomPackage);
 // console.log('isSelectPackage',isSelectPackage)
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

 //console.log("cusid=============", customerid)

 
const handleProceed = () => {
  if (!selectedMethod) {
    Alert.alert("Required", "Please select a payment method");
    return;
  }

  if (!route.params) {
    Alert.alert("Error", "Order data is missing");
    return;
  }

 
  const navigationData = {
    ...route.params,
    paymentMethod: selectedMethod,
   // customerId: customerId,
    isSelectPackage: isSelectPackage,
    isCustomPackage:isCustomPackage
  };


  console.log("Navigation data to OrderSummeryScreen:", JSON.stringify(navigationData, null, 2));
  console.log("Items:", navigationData.items);
  console.log("Subtotal:", navigationData.subtotal);
  console.log("Discount:", navigationData.discount);
  console.log("Total:", navigationData.total);
  console.log("Full Total:", navigationData.fullTotal);
  console.log("Selected Date:", navigationData.selectedDate);
  console.log("Selected Time Slot:", navigationData.selectedTimeSlot);
  console.log("Payment Method:", navigationData.paymentMethod);
  //console.log("cusid:", navigationData. customerId);
  console.log("isCustomPackage",isCustomPackage);
  console.log('isSelectPackage',isSelectPackage)

  navigation.navigate("OrderSummeryScreen" as any, navigationData);
};
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <ScrollView 
        className="bg-white flex-1"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center shadow-md px-3 bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
            Select Payment Method
          </Text>
        </View>

        {/* Payment Image */}
        <View className="flex items-center justify-center mt-3">
          <Image
            source={require("../assets/images/payment.png")}
            className="w-84 h-60"
            resizeMode="contain"
          />
        </View>

        {/* Payment Options */}
        <View className="flex-1 w-full items-center space-y-5 p-12 mt-[-10]">
     
          <TouchableOpacity
            onPress={() => setSelectedMethod("Online Payment")}
            className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${
              selectedMethod === "Online Payment" ? "bg-[#6C3CD1] border-[#6C3CD1]" : "bg-white border-[#5D5D5D]"
            }`}
          >
            <Text className={`text-lg ${selectedMethod === "Online Payment" ? "text-white font-bold" : "text-gray-700 font-medium"}`}>
              Online Payment 
            </Text>
            {selectedMethod === "Online Payment" && (
              <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <Image 
                  source={require("../assets/images/DonePurple.png")} 
                  className="w-5 h-5"
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>

     
          <TouchableOpacity
            onPress={() => setSelectedMethod("Pay By Cash")}
            className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${
              selectedMethod === "Pay By Cash" ? "bg-[#6C3CD1] border-[#6C3CD1]" : "bg-white border-[#5D5D5D]"
            }`}
          >
            <Text className={`text-lg ${selectedMethod === "Pay By Cash" ? "text-white font-bold" : "text-gray-700 font-medium"}`}>
              Pay By Cash
            </Text>
            {selectedMethod === "Pay By Cash" && (
              <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <Image 
                  source={require("../assets/images/DonePurple.png")} 
                  className="w-5 h-5"
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>


        <TouchableOpacity onPress={handleProceed}>
        <LinearGradient 
          colors={["#6839CF", "#874DDB"]} 
          className="py-3 px-4 rounded-lg items-center mb-[22%] mr-[25%] ml-[25%] rounded-3xl h-15"
        >
          
            <Text className="text-center text-white font-bold">Proceed</Text>
      
        </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SelectPaymentMethod;