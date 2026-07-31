import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";

type OnlinePaymentNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OnlinePayment"
>;

interface OnlinePaymentProps {
  navigation: OnlinePaymentNavigationProp;
  route: any;
}

type DeliveryMethod = "app" | "sms";


const OnlinePayment: React.FC<OnlinePaymentProps> = ({ navigation, route }) => {
  const {
    id,
    customerId,
    name,
    title,
    number,
    isPackage,
    total,
    fullTotal,
    subtotal,
    discount,
    selectedDate,
    selectedTimeSlot,
    items,
    orderItems,
    rawPackageItems,
    rawAdditionalItems,
    selectedAddress,
    customerid,
    customerscreencustomerid,
    isFinalizeImdt,
    deliveryCharge,
  } = route.params || {};

  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod>("app");
  const [loading, setLoading] = useState(false);

  const handleSendPaymentRequest = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert(
          "Error",
          "Authentication token not found. Please log in again.",
        );
        setLoading(false);
        return;
      }

      const pendingOrderStr = await AsyncStorage.getItem("pendingOrderData");
      if (!pendingOrderStr) {
        Alert.alert("Error", "No pending order data found.");
        setLoading(false);
        return;
      }

      let pendingOrderPayload;
      try {
        pendingOrderPayload = JSON.parse(pendingOrderStr);
      } catch (e) {
        console.error("Error parsing pending order data:", e);
        Alert.alert("Error", "Failed to read the pending order.");
        setLoading(false);
        return;
      }

      if (pendingOrderPayload && pendingOrderPayload.orderData) {
        pendingOrderPayload.orderData.isPaySMS = selectedMethod === "sms" ? 1 : 0;
      }

      const orderResponse = await axios.post(
        `${environment.API_BASE_URL}api/orders/create-order`,
        pendingOrderPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!orderResponse.data.success) {
        Alert.alert(
          "Error",
          orderResponse.data.message || "Failed to create order",
        );
        setLoading(false);
        return;
      }

      await AsyncStorage.removeItem("pendingOrderData");
      const orderId = orderResponse.data.data.orderId;

      navigation.navigate("OnlinePaymentStatus" as any, {
        orderId,
        id,
        customerId,
        name,
        title,
        number,
        customerid,
        customerscreencustomerid,
        isPackage,
        total,
        subtotal,
        discount,
        selectedDate,
        selectedTimeSlot,
        paymentMethod: "Card",
        currentStep: 1,
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      let errorMessage = "Failed to create order. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMessage;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      {/* Header */}

      <CustomHeader
        title="Online Payment"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("OrderSummeryScreen" as any, {
            customerId,
            customerid: customerid || customerId,
            customerscreencustomerid,

            isPackage,
            total,
            fullTotal,
            subtotal,
            discount,
            selectedDate,
            selectedTimeSlot,

            items,
            orderItems,
            rawPackageItems,
            rawAdditionalItems,
            selectedAddress,
            deliveryCharge,
            isFinalizeImdt,

            paymentMethod: "Card",
          })
        }
      />

      {loading ? (
        <LoadingPage fullScreen={true} />
      ) : (
        <>
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Subtitle */}
        <Text
          style={{
            textAlign: "center",
            color: "#6B7280",
            fontSize: 13,
            lineHeight: 20,
            marginTop: 4,
            paddingHorizontal: 16,
          }}
        >
          To complete the payment, we'll send a secure payment link to your
          customer.
        </Text>

        {/* Illustration */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: 15,
            marginBottom: 15,
          }}
        >
          <Image
            source={require("@/assets/images/order/online-payment.webp")}
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
          />
        </View>

        {/* Question */}
        <Text
          style={{
            textAlign: "center",
            fontSize: 15,
            fontWeight: "600",
            color: "#1F2937",
            marginBottom: 16,
          }}
        >
          Does your customer have the{"\n"}
          <Text style={{ color: "#7B2FF7" }}>GoViMart Mobile App</Text>?
        </Text>

        {/* Option: App */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedMethod("app")}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            marginBottom: 12,
            backgroundColor: selectedMethod === "app" ? "#FAF5FF" : "#FFFFFF",
            borderColor: selectedMethod === "app" ? "#A855F7" : "#E5E7EB",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,

              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              marginTop: 6,
            }}
          >
            <Image
              source={require("@/assets/images/order/phone.webp")}
              className="w-14 h-14 "
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
              Yes, They have the GoViMart{"\n"}Mobile App
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              We'll send a payment request as a notification in the app.
            </Text>
          </View>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
              marginTop: 2,
              backgroundColor:
                selectedMethod === "app" ? "#7C3AED" : "transparent",
              borderColor: selectedMethod === "app" ? "#7C3AED" : "#D1D5DB",
            }}
          >
            {selectedMethod === "app" && (
              <Feather name="check" size={12} color="white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Option: SMS */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedMethod("sms")}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            marginBottom: 12,
            backgroundColor: selectedMethod === "sms" ? "#FAF5FF" : "#FFFFFF",
            borderColor: selectedMethod === "sms" ? "#A855F7" : "#E5E7EB",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,

              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              marginTop: 2,
            }}
          >
            <Image
              source={require("@/assets/images/order/sms.webp")}
              className="w-14 h-14 "
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
              No, Send SMS with Payment Link
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              We'll send a payment link via SMS.
            </Text>
          </View>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
              marginTop: 2,
              backgroundColor:
                selectedMethod === "sms" ? "#7C3AED" : "transparent",
              borderColor: selectedMethod === "sms" ? "#7C3AED" : "#D1D5DB",
            }}
          >
            {selectedMethod === "sms" && (
              <Feather name="check" size={12} color="white" />
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Send Button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSendPaymentRequest}
        >
          <LinearGradient
            colors={["#7B2FF7", "#5B1FC9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 25,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
              Send Payment Request
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default OnlinePayment;
