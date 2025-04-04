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
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RouteProp } from "@react-navigation/native";
import axios from "axios";
import environment from "@/environment/environment";
import { Feather } from "@expo/vector-icons";

type View_CancelOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "View_CancelOrderScreen"
>;
type View_CancelOrderScreenRouteProp = RouteProp<RootStackParamList, "View_CancelOrderScreen">;

interface View_CancelOrderScreenProps {
  navigation: View_CancelOrderScreenNavigationProp;
  route: View_CancelOrderScreenRouteProp;
}


interface Order {
  orderId: number;
  customerId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullSubTotal: string | null;
  fullDiscount: string | null;
  deleteStatus: string | null;
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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportOption, setSelectedReportOption] = useState<string | null>(null);
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${environment.API_BASE_URL}api/orders/get-order/${orderId}`);
        console.log("mkk", response.data);
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
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format date for timeline display (get only date)
  const formatDateShort = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `on ${date.getDate()}${getDaySuffix(date.getDate())} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  // Get the day suffix (st, nd, rd, th)
  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const isCancelDisabled = () => {
    if (!order) return true;
    return order.orderStatus === "On way" || order.orderStatus === "Delivered" || order.orderStatus === "Cancelled";
  };

  const handleCancelOrder = () => {
    if (isCancelDisabled()) {
      Alert.alert(
        "Cannot Cancel Order",
        "Orders that are on the way or delivered cannot be canceled."
      );
      return;
    }

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
          onPress: async () => {
            try {
              setLoading(true);
             
              Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
              navigation.goBack();
            } catch (err) {
              console.error("Error cancelling order:", err);
              Alert.alert("Error", "Failed to cancel the order. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReportStatus = () => {
    setReportModalVisible(true);
  };

  const handlePhoneCall = () => {

    Alert.alert(
      "Contact Customer",
      `Would you like to call ${order?.firstName} ${order?.lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call",
          onPress: () => {
    
            Alert.alert("Calling", `Calling ${order?.phoneNumber}...`);
          }
        }
      ]
    );
  };

  const handleConfirmReport = () => {
    if (!selectedReportOption) {
      Alert.alert("Please select an option", "You must select a report status option.");
      return;
    }

 
    setReportModalVisible(false);
    setShowStatusMessage(true);
    
   
    // setTimeout(() => {
    //   setShowStatusMessage(false);
    // }, 3000);
  };
  
 
  const isTimelineItemActive = (status: string) => {
    if (!order) return false;
    
    const orderStatuses = ["Ordered", "Processing", "On way", "Delivered"];
    const currentIndex = orderStatuses.indexOf(order.orderStatus);
    const itemIndex = orderStatuses.indexOf(status);
    
    return itemIndex <= currentIndex;
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="bg-white flex-1">
 
        <View className="flex-row items-center shadow-md px-4 py-3 bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
            Order Status
          </Text>
          <TouchableOpacity onPress={handleReportStatus} className="absolute right-4">
            <Feather name="phone" size={24} color="#6C3CD1" />
          </TouchableOpacity>
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
            {/* Status message */}
          
            
            {/* Order Status Timeline */}
            <View className="p-5 ml-6">
              <View className="border-l-2 border-[#D9D9D9] pl-5 relative">
                {/* Order Placed */}
                <View className="flex-row items-center mb-10">
                  <View 
                    className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("Ordered") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
                  />
                  <Text className="text-gray-800 font-medium">
                    Order Placed {formatDateShort(order.scheduleDate)}
                  </Text>
                </View>

                {/* Order in Processing */}
                <View className="flex-row items-center mb-10">
                  <View 
                    className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("Processing") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
                  />
                  <Text className="text-gray-800 font-medium">
                    Order is Processing
                  </Text>
                </View>

                {/* On the way */}
                <View className="flex-row items-center mb-10">
                  <View 
                    className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("On the way") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
                  />
                  <Text className="text-gray-800 font-medium">
                    Order is On the way
                  </Text>
                </View>

                {/* Order Delivered */}
                <View className="flex-row items-center">
                  <View 
                    className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("Delivered") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
                  />
                  <Text className="text-gray-800 font-medium">
                    Order is Delivered
                  </Text>
                </View>
              </View>
            </View>

            {/* Customer Information */}
            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
              <Text className="text-[#808FA2] font-medium mb-1">Customer's Name</Text>
              <Text className="text-black font-medium mb-3">{`${order.firstName} ${order.lastName}`}</Text>

              <Text className="text-[#808FA2] font-medium mb-1">Customer's Phone Number</Text>
              <Text className="text-black font-medium mb-3">{order.phoneNumber}</Text>

              <Text className="text-[#808FA2] font-medium mb-1">Building Type</Text>
              <Text className="text-black font-medium mb-3">{order.buildingType}</Text>

              <Text className="text-[#808FA2] font-medium mb-1">Address</Text>
              <Text className="text-black font-medium">{order.fullAddress}</Text>
            </View>

            {/* Payment Summary */}
            {order.fullTotal && (
              <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
                <Text className="text-black font-semibold mb-2">Payment Summary</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-[#8492A3]">Subtotal</Text>
                  <Text className="text-black font-medium">Rs.{parseFloat(order.fullSubTotal || "0").toFixed(2)}</Text>
                </View>
                {order.fullDiscount && parseFloat(order.fullDiscount) > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Discount</Text>
                    <Text className="text-[#8492A3]">Rs.{parseFloat(order.fullDiscount).toFixed(2)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between pt-2">
                  <Text className="font-semibold text-black">Grand Total</Text>
                  <Text className="font-bold text-black">
                    Rs.{(parseFloat(order.fullTotal) - (parseFloat(order.fullDiscount || "0"))).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Method */}
            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-6">
              <Text className="text-black font-semibold mb-1">Payment Method</Text>
              <Text className="text-[#8492A3]">
                {order.paymentMethod === "Credit Card" ? "Online Payment" : "Cash on Delivery"}
              </Text>
            </View>

            {showStatusMessage && (
              <View className="mx-4 mt-2 p-2 rounded-lg">
                <Text className="text-red-500 font-medium text-center">
                  {selectedReportOption}
                </Text>
              </View>
            )}

            {/* Report Status Button */}
            <TouchableOpacity 
            //  onPress={handleReportStatus}
              className="mx-5 mb-3 rounded-full px-8"
            >
              <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3 rounded-lg items-center"
              >
                <Text className="text-white text-center font-semibold">Report Status</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Order Button */}
            <TouchableOpacity 
              onPress={handleCancelOrder}
              disabled={isCancelDisabled()}
              className={`mx-5 mb-5 px-8 rounded-full ${isCancelDisabled() ? "opacity-70" : ""}`}
            >
              {isCancelDisabled() ? (
                <View className="bg-[#D9D9D9] py-3 rounded-lg items-center">
                  <Text className="text-black text-center font-semibold">Cancel Order</Text>
                </View>
              ) : (
                <View className="bg-[#000000] py-3 rounded-lg items-center">
                  <Text className="text-white text-center font-semibold">Cancel Order</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-gray-600">No order information found</Text>
          </View>
        )}
      </View>

      {/* Report Status Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-5 w-5/6 max-w-md">
            <View className="flex-row items-center shadow-md px-3 bg-white mb-5">
              <BackButton navigation={{ goBack: () => setReportModalVisible(false) }} />
              <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">
                Report Status
              </Text>
            </View>

            {/* Status Options */}
            <View className="mb-4">
              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 mb-2" 
                onPress={() => setSelectedReportOption("Answered & Confirmed")}
              >
                <Text className="text-black font-medium">Answered & Confirmed</Text>
                <View className={`w-6 h-6 border border-gray-400 rounded ${selectedReportOption === "Answered & Confirmed" ? "bg-[#6C3CD1]" : "bg-white"}`} />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 mb-2" 
                onPress={() => setSelectedReportOption("Answered & Not-Confirmed")}
              >
                <Text className="text-black font-medium">Answered & Not-Confirmed</Text>
                <View className={`w-6 h-6 border border-gray-400 rounded ${selectedReportOption === "Answered & Not-Confirmed" ? "bg-[#6C3CD1]" : "bg-white"}`} />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 mb-6" 
                onPress={() => setSelectedReportOption("Not-Answered")}
              >
                <Text className="text-black font-medium">Not-Answered</Text>
                <View className={`w-6 h-6 border border-gray-400 rounded ${selectedReportOption === "Not-Answered" ? "bg-[#6C3CD1]" : "bg-white"}`} />
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <TouchableOpacity 
              onPress={handleConfirmReport}
              className="mb-3 rounded-lg overflow-hidden"
            >
              <View className="bg-black py-3 rounded-lg items-center">
                <Text className="text-white text-center font-semibold">Confirm</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setReportModalVisible(false)}
              className="rounded-lg"
            >
              <View className="bg-gray-200 py-3 rounded-lg items-center">
                <Text className="text-black text-center font-semibold">Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
    </KeyboardAvoidingView>
  );
};

export default View_CancelOrderScreen;
