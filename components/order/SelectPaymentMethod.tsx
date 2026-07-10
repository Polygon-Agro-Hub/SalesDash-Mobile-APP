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
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      isFinalizeImdt?: number | boolean;
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

const formatPrice = (amount: number) => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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
    isFinalizeImdt,
  } = route.params || {};

  // Normalize to a strict boolean so both `1` and `true` work
  const isImmediateFinalize = !!isFinalizeImdt;

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Cash" | "Card" | null>(
    isImmediateFinalize ? "Card" : previousSelectedMethod || "Cash",
  );

  const [creditBalance, setCreditBalance] = useState<number>(2000);
  const [deliveredTotal, setDeliveredTotal] = useState<number>(0);
  const [loadingCredit, setLoadingCredit] = useState(true);

  const orderTotal = fullTotal || total || 0;
  const userId = customerId || customerid || id;

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!userId) {
        setLoadingCredit(false);
        return;
      }
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const response = await axios.get(
          `${environment.API_BASE_URL}api/orders/delivered-total/${userId}`,
          storedToken
            ? { headers: { Authorization: `Bearer ${storedToken}` } }
            : undefined,
        );
        console.log("data", response.data);

        if (response.data?.success) {
          setCreditBalance(response.data.data.creditBalance);
          setDeliveredTotal(response.data.data.deliveredTotal);
        }
      } catch (error) {
        console.error("Error fetching credit balance:", error);

        setCreditBalance(2000);
      } finally {
        setLoadingCredit(false);
      }
    };
    fetchCreditBalance();
  }, [userId]);

  // Cash is disabled either when the order needs immediate finalization
  // (online payment only), or when the order total exceeds the credit balance.
  const isCashDisabled = isImmediateFinalize || orderTotal >= creditBalance;

  useEffect(() => {
    if (!loadingCredit && selectedMethod === "Cash" && isCashDisabled) {
      setSelectedMethod("Card");
    }
  }, [loadingCredit, isCashDisabled, selectedMethod]);

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

  const handleSelectCash = () => {
    if (isCashDisabled) return;
    setSelectedMethod("Cash");
  };

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
      isFinalizeImdt: route.params?.isFinalizeImdt,
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
          selectedAddress: route.params?.selectedAddress,
          deliveryCharge: route.params?.deliveryCharge,
          isFinalizeImdt: route.params?.isFinalizeImdt,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, route.params]),
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
            selectedAddress: route.params?.selectedAddress,
            deliveryCharge: route.params?.deliveryCharge,
            isFinalizeImdt: route.params?.isFinalizeImdt,
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
              {/* Banner image */}
              <View className="flex items-center justify-center mb-10">
                <Image
                  source={require("@/assets/images/order/payment.webp")}
                  className="w-84 h-60"
                  resizeMode="contain"
                />
              </View>

              {loadingCredit ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#6C3CD1" />
                </View>
              ) : (
                <View className="w-full items-center space-y-4 px-8">
                  {/* ── Card (Online Payment) option ── */}
                  <TouchableOpacity
                    onPress={() => setSelectedMethod("Card")}
                    className={`w-full py-5 px-5 rounded-xl flex-row items-center justify-between border ${
                      selectedMethod === "Card"
                        ? "bg-[#6C3CD1] border-[#6C3CD1]"
                        : "bg-white border-[#5D5D5D]"
                    }`}
                    style={{ marginBottom: 12 }}
                  >
                    <Text
                      className={`text-lg ${
                        selectedMethod === "Card"
                          ? "text-white font-bold"
                          : "text-gray-700 font-medium"
                      }`}
                    >
                      Online Payment
                    </Text>
                    {selectedMethod === "Card" ? (
                      <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                        <Feather name="check" size={18} color="#6C3CD0" />
                      </View>
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-gray-400" />
                    )}
                  </TouchableOpacity>

                  {/* ── Cash option (only shown when eligible and not an immediate-finalization order) ── */}
                  {!isCashDisabled && (
                    <TouchableOpacity
                      onPress={handleSelectCash}
                      activeOpacity={0.8}
                      className={`w-full py-5 px-5 rounded-xl flex-row items-center justify-between border ${
                        selectedMethod === "Cash"
                          ? "bg-[#6C3CD1] border-[#6C3CD1]"
                          : "bg-white border-[#5D5D5D]"
                      }`}
                      style={{ marginBottom: 4 }}
                    >
                      <Text
                        className={`text-lg ${
                          selectedMethod === "Cash"
                            ? "text-white font-bold"
                            : "text-gray-700 font-medium"
                        }`}
                      >
                        Pay By Cash
                      </Text>
                      {selectedMethod === "Cash" ? (
                        <View className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                          <Feather name="check" size={18} color="#6C3CD0" />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border-2 border-gray-400" />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* ── Restriction warning ── */}
                  {isCashDisabled && (
                    <View
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        backgroundColor: "#FFF5F5",
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: "#FECACA",
                        marginTop: 4,
                      }}
                    >
                      <MaterialIcons
                        name="info-outline"
                        size={16}
                        color="#DC2626"
                        style={{ marginRight: 8, marginTop: 1 }}
                      />
                      {isImmediateFinalize ? (
                        <Text
                          style={{
                            color: "#7F1D1D",
                            fontSize: 13,
                            flexShrink: 1,
                          }}
                        >
                          Immediate finalization requires online payment.
                        </Text>
                      ) : (
                        <Text
                          style={{
                            color: "#7F1D1D",
                            fontSize: 13,
                            flexShrink: 1,
                          }}
                        >
                          Cash payment is not available for orders equal to or
                          greater than{" "}
                          <Text style={{ color: "#DC2626", fontWeight: "700" }}>
                            Rs. {formatPrice(creditBalance)}.
                          </Text>
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* ── Proceed button ── */}
              <View style={{ marginTop: 40, alignItems: "center" }}>
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