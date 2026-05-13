import React, { useCallback, useEffect, useState } from "react";
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
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import { Feather } from "@expo/vector-icons";

type SelectPaymentMethodRouteProp = RouteProp<
  RootStackParamList,
  "SelectPaymentMethod"
>;

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
      rawPackageItems?: Array<{ name: string; qty: string }>;
      rawAdditionalItems?: Array<{
        id: number;
        name: string;
        quantity: number;
        unit: string;
        pricePerKg: number;
        discountedPricePerKg: number;
        discount: number;
        totalAmount: number;
        selected: boolean;
        changeby?: string;
        startValue?: string;
      }>;
      total?: number;
      subtotal?: number;
      discount?: number;
      fullTotal?: number;
      id?: string;
      customerId?: string;
      title: string;
      name: string;
      number: string;
      customerscreencustomerid: string;
      isPackage?: number | string;
      packageId?: number;
      customerid?: string;
      selectedMethod?: "Card" | "Cash" | null;
      selectedDate?: string;
      selectedTimeSlot?: string;
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

const SelectPaymentMethod: React.FC<SelectPaymentMethodProps> = ({
  navigation,
  route,
}) => {
  const {
    customerid,
    customerId,
    isPackage,
    packageId,
    selectedMethod: previousSelectedMethod,
    items,
    subtotal,
    discount,
    total,
    fullTotal,
    selectedDate,
    selectedTimeSlot,
    orderItems,
    orderData,
    id,
    title,
    name,
    number,
    customerscreencustomerid,
    rawPackageItems,
    rawAdditionalItems,
  } = route.params || {};

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Cash" | "Card" | null>(
    previousSelectedMethod || "Cash",
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

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

    const navigationData = {
      ...route.params,
      paymentMethod: selectedMethod,
      isPackage: isPackage,

      customerId: customerId || customerid,
      customerid: customerid || customerId,
      packageId: packageId,
      orderData: orderData,
      id,
      title,
      name,
      number,
      customerscreencustomerid,
    };

    navigation.navigate("OrderSummeryScreen" as any, navigationData);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ScheduleScreen" as any, {
          items,
          subtotal,
          discount,
          number,
          id,
          title,
          name,
          customerscreencustomerid,
          total,
          fullTotal,
          selectedDate,
          timeDisplay: selectedTimeSlot,
          isPackage,
          packageId: route.params?.packageId,
          selectedTimeSlot,
          customerId,
          customerid: customerid?.toString() || customerId?.toString(),
          orderData,
          rawPackageItems,
          rawAdditionalItems,
          orderItems,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <CustomHeader
        title="Select Payment Method"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ScheduleScreen" as any, {
            items,
            subtotal,
            id,
            title,
            name,
            number,
            customerscreencustomerid,
            discount,
            total,
            fullTotal,
            selectedDate,
            timeDisplay: selectedTimeSlot,
            isPackage,
            packageId: route.params?.packageId,
            selectedTimeSlot,
            customerId,
            customerid: customerid?.toString() || customerId?.toString(),
            orderItems,
            orderData,
            rawPackageItems,
            rawAdditionalItems,
          })
        }
      />
      <View className="flex-1 bg-white items-center">
        <View className="flex-1 w-full max-w-[500px]">
          <ScrollView
            className="bg-white flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-1 justify-center">
          <View className="flex items-center justify-center mb-20">
            <Image
              source={require("@/assets/images/order/payment.webp")}
              className="w-84 h-60"
              resizeMode="contain"
            />
          </View>

          <View className="w-full items-center space-y-5 px-12 mt-5">
            <TouchableOpacity
              onPress={() => setSelectedMethod("Cash")}
              className={`w-full py-5 px-5 rounded-lg flex-row items-center justify-between border border-[#5D5D5D] ${selectedMethod === "Cash"
                  ? "bg-[#6C3CD1] border-[#6C3CD1]"
                  : "bg-white border-[#5D5D5D]"
                }`}
            >
              <Text
                className={`text-lg ${selectedMethod === "Cash" ? "text-white font-bold" : "text-gray-700 font-medium"}`}
              >
                Cash On Delivery
              </Text>
              {selectedMethod === "Cash" && (
                <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                  <Feather name="check" size={24} color="#6C3CD0" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 32,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "50%",
                borderRadius: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <TouchableOpacity
                onPress={handleProceed}
                activeOpacity={0.8}
                style={{ borderRadius: 24 }}
              >
                <LinearGradient
                  colors={["#6839CF", "#874DDB"]}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Proceed
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SelectPaymentMethod;
