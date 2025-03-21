import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RouteProp } from "@react-navigation/native";
import axios from "axios";
import environment from "@/environment/environment";

type View_CancelOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "View_CancelOrderScreen"
>;
type View_CancelOrderScreenRouteProp = RouteProp<RootStackParamList, "View_CancelOrderScreen">;

interface View_CancelOrderScreenProps {
  navigation: View_CancelOrderScreenNavigationProp;
  route: View_CancelOrderScreenRouteProp;
}

// Define the order interface based on the response
interface Order {
  orderId: number;
  customerId: number;
  deliveryType: string;
  scheduleDate: string;
  selectedDays: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullDiscount: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
}

const View_CancelOrderScreen: React.FC<View_CancelOrderScreenProps> = ({
  navigation, route
}) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${environment.API_BASE_URL}api/orders/get-order/${orderId}`);
        
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError("Failed to load order details");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("An error occurred while fetching order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            // Implement the API call to cancel the order here
            Alert.alert("Order Cancellation", "This feature is not implemented yet");
          }
        }
      ]
    );
  };
  
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

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6C3CD1" />
            <Text className="mt-2 text-gray-600">Loading order details...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-red-500">{error}</Text>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mt-4 bg-[#6C3CD1] px-4 py-2 rounded-lg"
            >
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : order ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Order Status Timeline */}
            <View className="p-5 mt-[-5] ml-6">
              <View className="border-l border-[#A6A6A6] pl-5 relative">
                {/* Order Placed */}
                <View className="flex-row items-center mb-12 ">
                  <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
                  <Text className="text-gray-700">Order Placed on {formatDate(order.createdAt)}</Text>
                </View>

                {/* Payment Status */}
                <View className="flex-row items-center mb-12">
                  <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
                  <Text className="text-gray-700">
                    {order.paymentStatus === 1 
                      ? `Payment was received on ${formatDate(order.createdAt)}`
                      : "Payment is pending"}
                  </Text>
                </View>

                {/* Order Processing */}
                <View className="flex-row items-center">
                  <View className="w-4 h-4 bg-[#6C3CD1] rounded-full absolute -left-7 border-4 border-[#F4EDFF]" />
                  <Text className="text-gray-700">Order is {order.orderStatus.toLowerCase()}</Text>
                </View>
              </View>
            </View>

            {/* Customer Information */}
            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 ">
              <Text className="text-[#808FA2] font-semibold mb-2">Customer's Name</Text>
              <Text className="text-[#000000]">{`${order.firstName} ${order.lastName}`}</Text>

              <Text className="text-[#808FA2] font-semibold mt-3">Customer's Phone Number</Text>
              <Text className="text-[#000000]">{order.phoneNumber}</Text>

              <Text className="text-[#808FA2] font-semibold mt-3">Building Type</Text>
              <Text className="text-[#000000]">{order.buildingType}</Text>

              <Text className="text-[#808FA2] font-semibold mt-3">Address</Text>
              <Text className="text-[#000000]">{order.fullAddress}</Text>
            </View>

            {/* Payment Summary */}
            {order.fullTotal && (
              <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 mt-5">
                <Text className="text-[#212121] font-semibold">Payment Summary</Text>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-[#8492A3] ">Subtotal</Text>
                  <Text className="text-[#212121] font-bold">Rs. {order.fullTotal}</Text>
                </View>
                {order.fullDiscount && parseFloat(order.fullDiscount) > 0 && (
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-[#8492A3]">Discount</Text>
                    <Text className="text-[#8492A3]">Rs. {order.fullDiscount}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mt-2 pt-2">
                  <Text className="font-semibold text-[#212121]">Grand Total</Text>
                  <Text className="font-bold text-[#212121]">
                    Rs. {(parseFloat(order.fullTotal) - (parseFloat(order.fullDiscount || "0"))).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Method */}
            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-5 p-4 mt-5">
              <Text className="text-[#212121] font-semibold">Payment Method</Text>
              <Text className="text-[#8492A3]">{order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}</Text>
            </View>

            {/* Cancel Order Button */}
            <TouchableOpacity 
              onPress={handleCancelOrder}
              className="mx-[25%] mt-8 mb-5 rounded-full"
            >
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
        ) : (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-gray-600">No order information found</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <Navbar navigation={navigation} activeTab="ViewOrdersScreen" />
    </KeyboardAvoidingView>
  );
};

export default View_CancelOrderScreen;