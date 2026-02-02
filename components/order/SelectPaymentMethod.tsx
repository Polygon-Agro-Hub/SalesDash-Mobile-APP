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
import { RootStackParamList } from "../types/types";
import BackButton from "../common/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp } from "@react-navigation/native";


type SelectPaymentMethodRouteProp = RouteProp<RootStackParamList, "SelectPaymentMethod">;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  price: number;
  quantity: number;
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
        customerId: string;
        unitType: string;
        startValue: number;
        changeby: number;
      }>;
      total?: number;
      subtotal?: number;
      discount?: number;
      fullTotal?: number; // ADD THIS
      id?: string;
      customerId?: string; // ADD THIS
      isPackage?: number | string; // UPDATE THIS
      packageId?: number; // ADD THIS
      customerid?: string;
      selectedMethod?: "Card" | "Cash" | null;
      selectedDate?: string; // ADD THIS
      selectedTimeSlot?: string; // ADD THIS
      
      // ADD THIS - Critical for package orders with additional items
      orderData?: {
        userId: number;
        isPackage: number;
        packageId: number | null;
        total: number;
        fullTotal: number;
        discount: number;
        additionalItems: Array<{
          productId: number;
          qty: number;
          unit: string;
          price: number;
          discount: number;
        }>;
      };
      
      orderItems?: Array<{
        additionalItems?: Array<AdditionalItem>;
        isAdditionalItems: boolean;
        customerid?: string;
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
  const { 
    customerid,
    customerId, // Extract this
    isPackage, 
    packageId, // Extract this
    selectedMethod: previousSelectedMethod,
    items,
    subtotal,
    discount,
    total,
    fullTotal,
    selectedDate,
    selectedTimeSlot,
    orderItems,
    orderData // Extract this - CRITICAL!
  } = route.params || {};
  
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Cash" | "Card" | null>(
    previousSelectedMethod || "Cash"
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleProceed = () => {
    if (!selectedMethod) {
      Alert.alert("Required", "Please select a payment method");
      return;
    }

    if (!route.params) {
      Alert.alert("Error", "Order data is missing");
      return;
    }

    // Preserve ALL previous params including orderData
    const navigationData = {
      ...route.params, // This spreads all params including orderData
      paymentMethod: selectedMethod,
      isPackage: isPackage,
      
      // Explicitly ensure these critical fields are included
      customerId: customerId || customerid,
      customerid: customerid || customerId,
      packageId: packageId, // Explicitly pass packageId
      orderData: orderData, // Explicitly pass orderData - CRITICAL!
    };


    navigation.navigate("OrderSummeryScreen" as any, navigationData);
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      style={{flex: 1}}
    >
      <ScrollView 
        className="bg-white flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center shadow-md px-3 bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
            Select Payment Method
          </Text>
        </View>

        <View className="flex items-center justify-center mt-3">
          <Image
            source={require("../../assets/images/payment.webp")}
            className="w-84 h-60"
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 w-full items-center space-y-5 p-12 mt-[-10]">
          <TouchableOpacity
            onPress={() => setSelectedMethod("Cash")}
            className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${
              selectedMethod === "Cash" ? "bg-[#6C3CD1] border-[#6C3CD1]" : "bg-white border-[#5D5D5D]"
            }`}
          >
            <Text className={`text-lg ${selectedMethod === "Cash" ? "text-white font-bold" : "text-gray-700 font-medium"}`}>
              Cash On Delivery
            </Text>
            {selectedMethod === "Cash" && (
              <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <Image 
                  source={require("../../assets/images/DonePurple.webp")} 
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
            className="py-3 px-4 items-center mb-[22%] mr-[25%] ml-[25%] rounded-3xl h-15"
          >
            <Text className="text-center text-white font-bold">Proceed</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SelectPaymentMethod;