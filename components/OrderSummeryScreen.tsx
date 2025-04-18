import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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

interface ModifiedPlusItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number;
  additionalPrice: number;
  additionalDiscount: number;
}

interface ModifiedMinItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number;
  additionalPrice: number;
  additionalDiscount: number;
}

interface AdditionalItem {
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
}

interface PackageItem {
  packageId: number;
  isModifiedPlus: boolean;
  isModifiedMin: boolean;
  isAdditionalItems: boolean;
  packageTotal: number;
  packageDiscount: number;
  modifiedPlusItems: ModifiedPlusItem[];
  modifiedMinItems: ModifiedMinItem[];
  additionalItems: AdditionalItem[];
  finalOrderPackageList?: Array<{
    productId: number;
    quantity: number;
    price: number | string;
    isPacking: number;
  }>;
}


interface OrderSummeryScreenProps {
  navigation: OrderSummeryScreenNavigationProp;
  route: OrderSummeryScreenRouteProp;
}


interface CustomerData {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  buildingType?: string;
  buildingDetails?: {
    buildingNo?: string;
    unitNo?: string;
    buildingName?: string;
    floorNo?: string;
    houseNo?: string;
    streetName?: string;
    city?: string;
  };
}

const OrderSummeryScreen: React.FC<OrderSummeryScreenProps> = ({ navigation, route }) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  

  const {
    items = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    fullTotal = 0,
    selectedDate = "",
    selectedTimeSlot = "",
    paymentMethod = "",
    customerId = "",
    customerid = "",
    isSelectPackage = 0,
    isCustomPackage = 0,
    orderItems = [] 
  } = route.params || {};
  

  const safeItems = Array.isArray(items) ? items : [];

const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  

  const timeDisplay = selectedTimeSlot || "Not set";

  const subTotalDeliveryPlus = 350 + subtotal;
  const totalDeliveryPlus = 350 + total;

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        

        const customerIdValue = customerId || route.params?.customerId || route.params?.customerid;
        
        if (!customerIdValue) {
          setError("No customer ID found");
          setLoading(false);
          return;
        }
        
        const storedToken = await AsyncStorage.getItem("authToken");
        
        if (!storedToken) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }
        
        const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdValue}`;
        
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        
        if (response.data.success) {
          setCustomerData(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch customer data");
        }
      } catch (error: any) {
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


    if (route.params?.customerId || route.params?.customerid) {
      fetchCustomerData();
    }
  }, [route.params]);

  const handleConfirmOrder = async () => {

    if (!customerId && !customerid) {
      Alert.alert("Error", "Customer information is missing");
      return;
    }
    
    setLoading(true);
    
    try {

      const storedToken = await AsyncStorage.getItem("authToken");
      
      if (!storedToken) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const subT = fullTotal + discount;
      console.log("...........",fullTotal)

      let orderPayload: any = {
        customerId: customerId || customerid,
        scheduleDate: selectedDate,
        selectedTimeSlot: selectedTimeSlot,
        paymentMethod: paymentMethod,
        fullTotal: subT,
        discount: discount,
        subtotal: fullTotal 
      };
      

      if (isSelectPackage === 1) {
        orderPayload.isSelectPackage = 1;
        orderPayload.isCustomPackage = 0;
        
        if (safeOrderItems.length > 0) {
          const packageItem = safeOrderItems[0]; 

          const packageSub = packageItem.packageTotal + packageItem.packageDiscount;
          
          orderPayload.packageId = packageItem.packageId;
          orderPayload.isModifiedPlus = packageItem.isModifiedPlus;
          orderPayload.isModifiedMin = packageItem.isModifiedMin;
          orderPayload.isAdditionalItems = packageItem.isAdditionalItems;
          orderPayload.packageTotal = packageSub ;
          orderPayload.packageDiscount = packageItem.packageDiscount;
          orderPayload.packageSubTotal = packageItem.packageTotal;
          
          // Add modifiedPlusItems if present
          if (packageItem.modifiedPlusItems && packageItem.modifiedPlusItems.length > 0) {
            orderPayload.modifiedPlusItems = packageItem.modifiedPlusItems;
          }
          
          // Add modifiedMinItems if present
          if (packageItem.modifiedMinItems && packageItem.modifiedMinItems.length > 0) {
            orderPayload.modifiedMinItems = packageItem.modifiedMinItems;
          }
          
          // Add additionalItems if present
          if (packageItem.additionalItems && packageItem.additionalItems.length > 0) {
            orderPayload.additionalItems = packageItem.additionalItems;
          }
      
          // Add finalOrderPackageList if present
          if (packageItem.finalOrderPackageList && packageItem.finalOrderPackageList.length > 0) {
            orderPayload.finalOrderPackageList = packageItem.finalOrderPackageList;
          }
        }
      }
   
      else if (isCustomPackage === 1) {
        orderPayload.isSelectPackage = 0;
        orderPayload.isCustomPackage = 1;
        

        orderPayload.items = safeItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitType: item.unitType || "kg",
          price: item.price,
          normalPrice: item.normalPrice,
          discountedPrice: item.discountedPrice
        }));
      } else {

        orderPayload.isSelectPackage = 0;
        orderPayload.isCustomPackage = 0;
        

        orderPayload.items = safeItems.map(item => ({
          itemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitType: item.unitType || "kg",
          price: item.price,
          discount: (item.normalPrice && item.discountedPrice) 
            ? item.normalPrice - item.discountedPrice 
            : 0
        }));
      }
      
      console.log("Sending order data to API:", JSON.stringify(orderPayload, null, 2));
      

      const apiUrl = `${environment.API_BASE_URL}api/orders/create-order`;
      const response = await axios.post(apiUrl, orderPayload, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
    
        console.log("Order created successfully:", response.data);
        
 
        navigation.navigate("OrderConfirmedScreen", {
          orderId: response.data.data.orderId,
          total: total,
          subtotal: subtotal,
          discount:discount,
          paymentMethod: paymentMethod,
          customerId: customerId || customerid as string,
          selectedDate: selectedDate,
          selectedTimeSlot: selectedTimeSlot,
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      let errorMessage = "Failed to create order";
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
   
      const address = customerData.buildingDetails ? 
        `${customerData.buildingDetails.buildingNo || ''} ${customerData.buildingDetails.unitNo || ''}, 
  ${customerData.buildingDetails.buildingName || ''}, 
  ${customerData.buildingDetails.floorNo ? 'Apartment ' + customerData.buildingDetails.floorNo + ', ' : ''}
  ${customerData.buildingDetails.houseNo ? 'House ' + customerData.buildingDetails.houseNo + ', ' : ''}
  ${customerData.buildingDetails.streetName || ''}, 
  ${customerData.buildingDetails.city || ''}` : 
        "No address found";

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
                        customerId, 
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
                  params: { customerId ,items } 
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
                  customerId 
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