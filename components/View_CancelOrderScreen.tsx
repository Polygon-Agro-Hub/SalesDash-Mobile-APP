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
  Linking,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  reportStatus:string;
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

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

  

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `on ${date.getDate()}${getDaySuffix(date.getDate())} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  
  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };


  const isAfter6PM = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getHours() >= 18; 
  };


  const getActualStatus = () => {
    if (!order) return "";
    

    if (order.orderStatus === "Cancelled") {
      return "Cancelled";
    }
    
  
    if (order.orderStatus === "Ordered" && isAfter6PM(order.createdAt)) {
      return "Processing";
    }
    
    return order.orderStatus;
  };

  const isCancelDisabled = () => {
    if (!order) return true;
    return order.orderStatus === "On the way" || order.orderStatus === "Processing" || order.orderStatus === "Delivered" || order.orderStatus === "Cancelled";
  };

  const handlePhone = () => {
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

 

  const handleConfirmReport = async () => {
    if (!selectedReportOption) {
      Alert.alert("Please select an option", "You must select a report status option.");
      return;
    }
    
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
        
      if (!storedToken) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
  
      const apiUrl = `${environment.API_BASE_URL}api/orders/report-order/${orderId}`;
      const response = await axios.post(
        apiUrl, 
        { reportStatus: selectedReportOption }, 
        {
          headers: { 
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
  
      if (response.data.success) {
        setReportModalVisible(false);
        setShowStatusMessage(true);

      } else {
        Alert.alert("Error", response.data.message || "Failed to update report status");
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      Alert.alert("Error", "Failed to update report status. Please try again.");
    }
  };
  
 
const isTimelineItemActive = (status: string) => {
  if (!order) return false;
  const orderStatuses = ["Ordered", "Processing", "On the way", "Delivered"];
  const actualStatus = getActualStatus();
  

  if (actualStatus === "Cancelled") {
    return status === "Ordered" || status === "Cancelled";
  }
  

  const currentIndex = orderStatuses.indexOf(actualStatus);
  const itemIndex = orderStatuses.indexOf(status);
  

  if (itemIndex === -1) return false;
  
  return itemIndex <= currentIndex;
};

    const handleGetACall = () => {
      const phoneNumber = `tel:${order?.phoneNumber}`;
      Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
    };

    const handleCancelOrder = () => {
      if (isCancelDisabled()) {
        Alert.alert(
          "Cannot Cancel Order",
          "Orders that are on the way or delivered cannot be canceled."
        );
        return;
      }
    

      setCancelModalVisible(true);
    };
    console.log("=+=========",order?.reportStatus)
 

    const confirmCancelOrder = async () => {
      try {
        setLoading(true);
        

        const storedToken = await AsyncStorage.getItem("authToken");
        
        if (!storedToken) {
          Alert.alert("Error", "Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        

        const apiUrl = `${environment.API_BASE_URL}api/orders/cancel-order/${orderId}`;
        const response = await axios.post(apiUrl, {}, {
          headers: { 
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setCancelModalVisible(false);
          Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
          navigation.goBack();
        } else {
          Alert.alert("Error", response.data.message || "Failed to cancel the order.");
        }
      } catch (error: any) { 
        console.error("Error cancelling order:", error);
        
        let errorMessage = "Failed to cancel the order. Please try again.";
        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || errorMessage;
        }
        
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
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
          <TouchableOpacity onPress={handleGetACall} className="absolute right-4">
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
        
{/* Order Status Timeline */}

<View className="p-5 ml-6">
  <View className="border-l-2 border-[#D9D9D9] pl-5 relative">
    {/* Order Placed */}
    <View className="flex-row items-center mb-10">
      <View 
        className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("Ordered") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
      />
      <Text className="text-gray-800 font-medium">
        Order Placed {formatDateShort(order.createdAt)}
      </Text>
    </View>

    {/* Processing */}
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

    {/* Delivered - Last item in normal flow */}
    <View className={`flex-row items-center ${order.orderStatus === "Cancelled" ? "mb-10" : ""}`}>
      <View 
        className={`w-4 h-4 rounded-full absolute -left-7 ${isTimelineItemActive("Delivered") ? "bg-[#6C3CD1]" : "bg-[#D9D9D9]"}`} 
      />
      <Text className="text-gray-800 font-medium">
        Order is Delivered
      </Text>
    </View>

    {/* Order Cancelled - Show ONLY if order is cancelled */}
    {order.orderStatus === "Cancelled" && (
      <View className="flex-row items-center">
        <View 
          className="w-4 h-4 rounded-full absolute -left-7 bg-[#6C3CD1]"
        />
        <Text className="text-red-500 font-medium">
          Order is Cancelled
        </Text>
      </View>
    )}
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
            <Text className="text-red-500 font-medium text-center mb-2">{order.reportStatus}</Text>
            

            {/* Report Status Button - Only shown when not Ordered or Cancelled */}
{ order.orderStatus !== "Cancelled" && (
  <TouchableOpacity 
    onPress={handleReportStatus}
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
)}

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
  visible={cancelModalVisible}
  onRequestClose={() => setCancelModalVisible(false)}
>
  <View className="flex-1 justify-center items-center bg-black/50">
    <View className="bg-white rounded-lg p-5 w-5/6 max-w-md">
      <Text className="text-xl font-bold text-center mb-2">
        Are you sure?
      </Text>
      
      <Text className="text-center text-gray-600 mb-8">
        This will permanently delete the order placed by customer and cannot be undone.
      </Text>

      {/* Confirm Button */}
      <TouchableOpacity 
        onPress={confirmCancelOrder}
        className="mb-3 rounded-lg overflow-hidden"
      >
        <View className="bg-black py-3 rounded-lg items-center">
          <Text className="text-white text-center font-semibold">Confirm</Text>
        </View>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity 
        onPress={() => setCancelModalVisible(false)}
        className="rounded-lg"
      >
        <View className="bg-gray-200 py-3 rounded-lg items-center">
          <Text className="text-black text-center font-semibold">Cancel</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-5 w-5/6 max-w-md">
            

            {/* Status Options */}
            <View className="mb-4">
              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 mb-2" 
                onPress={() => setSelectedReportOption("Confirmed")}
              >
                <Text className="text-black font-medium">Confirmed</Text>
                <View className={`w-6 h-6 border border-gray-400 rounded ${selectedReportOption === "Confirmed" ? "bg-[#6C3CD1]" : "bg-white"}`} />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 mb-2" 
                onPress={() => setSelectedReportOption("Not-Confirmed")}
              >
                <Text className="text-black font-medium">Not-Confirmed</Text>
                <View className={`w-6 h-6 border border-gray-400 rounded ${selectedReportOption === "Not-Confirmed" ? "bg-[#6C3CD1]" : "bg-white"}`} />
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