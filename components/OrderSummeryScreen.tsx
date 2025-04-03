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
  Alert
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CartItem } from "./types";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import environment from "@/environment/environment";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type OrderSummeryScreenNavigationProp = StackNavigationProp<RootStackParamList, "OrderSummeryScreen">;
type OrderSummeryScreenRouteProp = RouteProp<RootStackParamList, "OrderSummeryScreen">;

interface OrderSummeryScreenProps {
  navigation: OrderSummeryScreenNavigationProp;
  route: OrderSummeryScreenRouteProp;
}

const OrderSummeryScreen: React.FC<OrderSummeryScreenProps> = ({ navigation, route }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
  
  // Extract all params from route
  const {
    items = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    fullTotal = 0,
    selectedDate = "",
    selectedTimeSlot = "",
    paymentMethod = "",
    id = ""
  } = route.params || {};

  console.log("cusid", id);

  // Format date for display
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : "Not set";
  
  // Format time slot for display
  const timeDisplay = selectedTimeSlot || "Not set";

  const subTotalDeliveryPlus = 350 + subtotal;
  const totalDeliveryPlus = 350 + total;

  console.log("subtotal-----------------",subTotalDeliveryPlus)
  console.log("total----------------------",totalDeliveryPlus)

 // Fetch customer data from backend
 useEffect(() => {
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(''); 
      
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
      console.log("k",id)
      const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${id}`;
      console.log("o",apiUrl)
      
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      
      if (response.data.success) {
        setCustomerData(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch customer data");
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
     
      if (error instanceof Error) {
        setError(error.message || "Failed to fetch customer data");
      } else {
        setError("Failed to fetch customer data");
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (id) {
    fetchCustomerData();
  }
}, [id]);

  useEffect(() => {
    // Log received data for debugging
    console.log("Received data in OrderSummeryScreen:", JSON.stringify(route.params, null, 2));
    console.log("Items:", items);
    console.log("Subtotal:", subtotal);
    console.log("Discount:", discount);
    console.log("Total:", total);
    console.log("Full Total:", fullTotal);
    console.log("Selected Date:", selectedDate);
    console.log("Selected Time Slot:", selectedTimeSlot);
    console.log("Payment Method:", paymentMethod);
    console.log("Customer Data:", customerData);
    
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [route.params, items, subtotal, discount, total, fullTotal, selectedDate, selectedTimeSlot, paymentMethod, customerData]);

  const handleConfirmOrder = () => {
    // Validate that we have all required data before proceeding
    if (!id) {
      // Show error message - customer ID is required
      Alert.alert("Error", "Customer information is missing");
      return;
    }
    
   
    navigation.navigate("OrderConfirmedScreen" as any, { 
      orderId: Math.floor(1000000 + Math.random() * 9000000), 
      total,
      paymentMethod,
      customerId: id, 
      items,
      selectedDate: formattedDate,
      selectedTimeSlot: timeDisplay
    });
    console.log("orderId")
  };

  // Get customer info from API or fallback to default
const getCustomerInfo = () => {
  if (loading) {
    return {
      name: "Loading...",
      phone: "Loading...",
      buildingType: "Loading...",
      address: "Loading..."
    };
  }
  
  if (customerData) {
    // Format address using the actual fields from the response
    const address = customerData.buildingDetails ? 
      `${customerData.buildingDetails.buildingNo || ''} ${customerData.buildingDetails.unitNo || ''}, 
${customerData.buildingDetails.buildingName || ''}, 
${customerData.buildingDetails.floorNo ? 'Apartment ' + customerData.buildingDetails.floorNo + ', ' : ''}
${customerData.buildingDetails.houseNo ? 'House ' + customerData.buildingDetails.houseNo + ', ' : ''}
${customerData.buildingDetails.streetName || ''}, 
${customerData.buildingDetails.city || ''}` : 
      "No address found";

    // Clean up the address by removing extra spaces and line breaks
    const cleanedAddress = address.replace(/\s+/g, ' ').trim();
    
    return {
      name: `${customerData.title || ''} ${customerData.firstName || ''} ${customerData.lastName || ''}`,
      phone: customerData.phoneNumber || "No phone",
      buildingType: customerData.buildingType || "Not specified",
      address: cleanedAddress
    };
  }
  
 
  return {
    name: "Guest User",
    phone: "Not available",
    buildingType: "Not specified",
    address: "Address not available"
  };
};
  const customerInfo = getCustomerInfo();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1 bg-white"
    >
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
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-2">
      
          <View className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center">
              
              <View className="flex-row items-center space-x-2 flex-1">
                <Image source={require("../assets/images/delivery.png")} className="w-10 h-10" />
                
                <View>
                  <View className="flex-row justify-between">
                    <Text className="text-base font-semibold">Delivery - One Time</Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate("ScheduleScreen" as any, { 
                        totalPrice: total,
                        id, 
                        items,
                        subtotal,
                        discount
                      })}
                      className="border border-[#6C3CD1] px-3 rounded-full ml-12">
                      <Text className="text-[#6C3CD1] font-medium">Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[#808FA2] text-sm">Scheduled to {selectedDate}</Text>
                  <Text className="text-[#808FA2] text-sm">Within {timeDisplay}</Text>
                </View>
              </View>
            </View>
          </View>
  
          {/* Customer Info */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <Text className="text-[#808FA2] text-xs">Customer's Name</Text>
            <Text className="text-black font-medium">{customerInfo.name}</Text>
  
            <Text className="text-[#808FA2] text-xs mt-2">Customer's Phone Number</Text>
            <Text className="text-black font-medium">{customerInfo.phone}</Text>
  
            <Text className="text-[#808FA2] text-xs mt-2">Building Type</Text>
            <Text className="text-black font-medium">{customerInfo.buildingType}</Text>
  
            {/* <Text className="text-[#808FA2] text-xs mt-2">Address</Text>
            <Text className="text-black font-medium">{customerInfo.address}</Text> */}
            <Text className="text-[#808FA2] text-xs mt-2">Address</Text>
{customerData && customerData.buildingDetails ? (
  <View>
    {customerData.buildingDetails.buildingNo && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.buildingNo},</Text>
    )}
    {customerData.buildingDetails.unitNo && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.unitNo},</Text>
    )}
    {customerData.buildingDetails.buildingName && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.buildingName},</Text>
    )}
    {customerData.buildingDetails.floorNo && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.floorNo},</Text>
    )}
    {customerData.buildingDetails.houseNo && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.houseNo},</Text>
    )}
    {customerData.buildingDetails.streetName && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.streetName},</Text>
    )}
    {customerData.buildingDetails.city && (
      <Text className="text-black font-medium"> {customerData.buildingDetails.city}</Text>
    )}
  </View>
) : (
  <Text className="text-black font-medium">Address not available</Text>
)}
          </View>
  
          {/* Payment Summary */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Summary</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("CratScreen" as any, { 
                  screen: "OrderScreen",
                  params: { id ,items } 
                })}
                className="border border-[#6C3CD1] px-3 rounded-full">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#8492A3] font-medium">Subtotal</Text>
              <Text className="text-black font-medium mr-12">
                Rs.{subTotalDeliveryPlus.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#8492A3]">Discount</Text>
              <Text className="text-gray-500 mr-12">
                Rs.{discount.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-black font-semibold">Grand Total</Text>
              <Text className="text-black font-semibold mr-12">
                Rs.{totalDeliveryPlus.toFixed(2)}
              </Text>
            </View>
          </View>
  
          {/* Payment Method */}
          <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Method</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("SelectPaymentMethod" as any, {
                  items,
                  subtotal,
                  discount, 
                  total,
                  fullTotal,
                  selectedDate,
                  selectedTimeSlot,
                  id 
                })}
                className="border border-[#6C3CD1] px-3 rounded-full">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[#8492A3] mt-1">{paymentMethod || "Not selected"}</Text>
          </View>
        </View>
  
        {/* Confirm Button */}
        <TouchableOpacity onPress={handleConfirmOrder}>
        <LinearGradient 
          colors={["#6839CF", "#874DDB"]} 
          className="py-3 px-4 rounded-lg items-center mt-[10%] mb-[10%] mr-[25%] ml-[25%] rounded-3xl h-15"
        >
      
            <Text className="text-center text-white font-bold">Confirm</Text>
     
        </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrderSummeryScreen;