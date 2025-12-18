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
  userId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  total: string;
    discount: string,
    fullTotal: string,
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  reportStatus: string;
  status:string;
//  fullTotal: string | null;
  fullSubTotal: string | null;
  fullDiscount: string | null;
  deleteStatus: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
  // Additional fields from API response
//  discount?: string;
  invoiceNumber?: string;
  sheduleDate?: string;
  sheduleTime?: string;
  sheduleType?: string;
  title?: string;
//  total?: string;
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
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

const View_CancelOrderScreen: React.FC<View_CancelOrderScreenProps> = ({
  navigation, route
}) => {
  const { orderId, userId ,status } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportOption, setSelectedReportOption] = useState<string | null>(null);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isPackage , setIsPackage] = useState();
   const [returnReason, setReturnReason] = useState<string | null>(null);
   const [isHoldOrder, setIsHoldOrder] = useState<boolean>(false);

  console.log("Route params:", route.params);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${environment.API_BASE_URL}api/orders/get-order/${orderId}`);
        console.log("Order API response:", response.data);
        
        if (response.data.success) {
          setOrder(response.data.data);
          
          // Extract city from fullAddress and fetch delivery fee
          const orderData = response.data.data;
          console.log("ispackagehjdjjdkdkd",orderData.isPackage)
          if (orderData.fullAddress) {
            await fetchDeliveryFee(orderData.fullAddress, orderData.userId || userId);
            setIsPackage(orderData.isPackage)
          }
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


  useEffect(() => {
  const fetchHoldStatus = async () => {
    console.log("Fetching hold status for orderId:", orderId);
    
    // Check hold status for ALL orders, not just those with status "Hold"
    // An order might have been held and then resumed to "On the way" or "Delivered"
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      
      if (!storedToken) {
        console.log("No authentication token found for hold status");
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-hold-reason/${orderId}`,
        { headers: { Authorization: `Bearer ${storedToken}` }}
      );
      
      console.log("Hold status API response:", response.data);
      
      if (response.data.success && response.data.data) {
        // Set isHoldOrder to true if the order was ever held (isHold from backend)
        setIsHoldOrder(response.data.data.isHold);
        console.log("Order hold history - isHold:", response.data.data.isHold);
      } else {
        // If no hold data found, set to false
        setIsHoldOrder(false);
      }
    } catch (error) {
      console.error("Error fetching hold status:", error);
      // On error, default to false to prevent UI issues
      setIsHoldOrder(false);
    }
  };

  fetchHoldStatus();
}, [orderId]);

  const fetchDeliveryFee = async (fullAddress: string, customerUserId?: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      
      if (!storedToken) {
        console.log("No authentication token found");
        return;
      }

      // First fetch customer data to get the correct city
      if (customerUserId || userId) {
        const customerData = await fetchCustomerData(customerUserId || userId);
        
        // Use city from customer data if available
        if (customerData && customerData.buildingDetails?.city) {
          const cityName = customerData.buildingDetails.city;
          console.log("Using city from customer data:", cityName);
          
          // Fetch cities to get delivery charge
          const cityResponse = await axios.get<{ data: City[] }>(
            `${environment.API_BASE_URL}api/customer/get-city`,
            { headers: { Authorization: `Bearer ${storedToken}` }}
          );
          
          console.log("Cities API response:", cityResponse.data);
          
          if (cityResponse.data && cityResponse.data.data) {
            const cityData = cityResponse.data.data.find(c => 
              c.city.toLowerCase() === cityName.toLowerCase()
            );
            
            if (cityData) {
              const fee = parseFloat(cityData.charge) || 0;
              console.log(`Setting delivery fee to ${fee} for city ${cityName}`);
              setDeliveryFee(fee);
            } else {
              console.log(`City ${cityName} not found in cities list`);
              console.log("Available cities:", cityResponse.data.data.map(c => c.city));
            }
          }
          return;
        }
      }

      // Fallback: Extract city from fullAddress if customer data fails
      const addressParts = fullAddress.split(', ');
      let cityName = '';
      
      if (addressParts.length >= 2) {
        cityName = addressParts[addressParts.length - 2].trim();
      }
      
      console.log("Fallback: Extracted city from address:", cityName);
      
      if (cityName) {
        // Fetch cities to get delivery charge
        const cityResponse = await axios.get<{ data: City[] }>(
          `${environment.API_BASE_URL}api/customer/get-city`,
          { headers: { Authorization: `Bearer ${storedToken}` }}
        );
        
        if (cityResponse.data && cityResponse.data.data) {
          const cityData = cityResponse.data.data.find(c => 
            c.city.toLowerCase() === cityName.toLowerCase()
          );
          
          if (cityData) {
            const fee = parseFloat(cityData.charge) || 0;
            console.log(`Setting delivery fee to ${fee} for city ${cityName}`);
            setDeliveryFee(fee);
          }
        }
      }
      
    } catch (error) {
      console.error("Error fetching delivery fee:", error);
    }
  };

  const fetchCustomerData = async (customerUserId: number): Promise<CustomerData | null> => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      
      if (!storedToken) {
        console.log("No authentication token found");
        return null;
      }
      
      // Fetch customer data
      const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${customerUserId}`;
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      
      console.log("Customer data API response:", response.data);
      
      if (response.data && response.data.success) {
        console.log("Customer data received:", response.data.data);
        setCustomerData(response.data.data);
        return response.data.data;
      } else {
        const errorMsg = response.data?.message || "Failed to fetch customer data";
        console.log("Customer API error:", errorMsg);
        return null;
      }
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log("Customer data Axios error:", errorMsg);
      }
      return null;
    }
  };

  console.log("Current delivery fee:", deliveryFee);


    useEffect(() => {
    const fetchReturnReason = async () => {

      console.log("retun reqon000000000000")
      if (status === "Return") {
        try {
          const storedToken = await AsyncStorage.getItem("authToken");
          
          if (!storedToken) {
            console.log("No authentication token found for return reason");
            return;
          }
console.log("before----------------")
          const response = await axios.get(
            `${environment.API_BASE_URL}api/orders/get-return-reason/${orderId}`,
            { headers: { Authorization: `Bearer ${storedToken}` }}
          );
          
          console.log("Return reason API response:", response.data);
          
          if (response.data.success && response.data.data) {
            setReturnReason(response.data.data.returnReason);
          }
        } catch (error) {
          console.error("Error fetching return reason:", error);
          // Don't show error to user, just log it
        }
      }
    };

    fetchReturnReason();
  }, [orderId, status]);


  console.log("/////////////////",isHoldOrder)

  

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
    

    if (status === "Cancelled") {
      return "Cancelled";
    }
    
  
    if (status === "Ordered" && isAfter6PM(order.createdAt)) {
      return "Processing";
    }
    
    return status;
  };

  // const isCancelDisabled = () => {
  //   if (!order) return true;
  //   return status === "On the way" || status === "Processing" || status === "Delivered" || status === "Cancelled";
  // };
  const isCancelDisabled = () => {
  if (!order) return true;
  
    
  // Get the actual status using the same logic as getActualStatus
  const actualStatus = getActualStatus();
    console.log("-----------actuacl status-------", status)
  
  // Disable cancel button for these statuses
  return actualStatus === "On the way" || 
         actualStatus === "Processing" || 
         actualStatus === "Out For Delivery" ||
         actualStatus === "Collected" ||
         actualStatus === "Delivered" || 
         actualStatus === "Return"||
         actualStatus === "Cancelled";
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


  const handlesubtotal = () => {
    if (order && order.fullTotal) {
      // Convert string to number before addition
      const subtotal = parseFloat(order.fullTotal) + 350;
      setSubtotal(subtotal);
    }
  };

  console.log(subtotal)
 

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
  
 
// const isTimelineItemActive = (status: string) => {
//   if (!order) return false;
//   const orderStatuses = ["Ordered", "Processing", "Out For Delivery", "Collected","On the way", "Delivered","Hold", "Return"];
//   const actualStatus = getActualStatus();
  

//   if (actualStatus === "Cancelled") {
//     return status === "Ordered" || status === "Cancelled";
//   }
  

//   const currentIndex = orderStatuses.indexOf(actualStatus);
//   const itemIndex = orderStatuses.indexOf(status);
  

//   if (itemIndex === -1) return false;
  
//   return itemIndex <= currentIndex;
// };
const isTimelineItemActive = (status: string) => {
  if (!order) return false;
  
  const orderStatuses = [
    "Ordered", 
    "Processing", 
    "Out For Delivery", 
    "Collected",
    "On the way", 
    "Hold",
    "Delivered"
  ];
  
  const actualStatus = getActualStatus();
  
  // Handle Cancelled orders - only show Ordered and Cancelled as active
  if (actualStatus === "Cancelled") {
    return status === "Ordered" || status === "Cancelled";
  }
  
  // Handle Return orders - show all steps up to and including Return
  if (actualStatus === "Return") {
    return status !== "Delivered" && status !== "Cancelled";
  }
  
  // Special handling for Hold status
  if (status === "Hold") {
    // Show Hold as active if:
    // 1. Current status is "Hold"
    // 2. Status is "On the way" AND isHoldOrder is true (was held, then resumed)
    // 3. Status is "Delivered" AND isHoldOrder is true (was held during delivery)
    return actualStatus === "Hold" || 
           (actualStatus === "On the way" && isHoldOrder) ||
           (actualStatus === "Delivered" && isHoldOrder);
  }
  
  // For Delivered status with hold history
  if (status === "Delivered" && isHoldOrder && actualStatus === "Delivered") {
    return true;
  }
  
  // Standard timeline progression
  const currentIndex = orderStatuses.indexOf(actualStatus);
  const itemIndex = orderStatuses.indexOf(status);
  
  if (itemIndex === -1) return false;
  
  return itemIndex <= currentIndex;
};

    // const handleGetACall = () => {
    //   const phoneNumber = `tel:${order?.phoneNumber}`;
    //   Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
    // };

  const handleGetACall = () => {
  // Get phone number from customer data first, fallback to order data
  const phoneNumber = customerData?.phoneNumber || order?.phoneNumber;
  
  if (!phoneNumber) {
    Alert.alert("Error", "Phone number not available");
    return;
  }

  // Clean the phone number - remove all non-digit characters except '+'
  let cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');

  // If number starts with +, use as-is (already international format)
  if (cleanedNumber.startsWith('+')) {
    // Ensure it's a valid international number
    if (cleanedNumber.length < 10) { // +94 + 9 digits
      Alert.alert("Error", "Invalid international phone number format");
      return;
    }
  } 
  // If number starts with 94 (without +), add +
  else if (cleanedNumber.startsWith('94')) {
    cleanedNumber = `+${cleanedNumber}`;
  }
  // If number starts with 0 (local format), convert to international
  else if (cleanedNumber.startsWith('0')) {
    cleanedNumber = `+94${cleanedNumber.substring(1)}`;
  }
  // Otherwise assume it's a local number without 0
  else {
    cleanedNumber = `+94${cleanedNumber}`;
  }

  // Final validation - should be +94 followed by 9 digits
  if (!/^\+94\d{9}$/.test(cleanedNumber)) {
    Alert.alert("Error", "Invalid phone number format");
    return;
  }

  console.log("Dialing:", cleanedNumber); // For debugging
  
  const telUrl = `tel:${cleanedNumber}`;
  Linking.openURL(telUrl).catch((err) => {
    console.error("Error opening dialer", err);
    Alert.alert("Error", "Could not open phone dialer");
  });
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

const formatPrice = (price: string | number): string => {
  return parseFloat(price.toString()).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};


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
      className="bg-white"
      style={{flex: 1}}
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
        className={`p-1.5 rounded-full absolute -left-8 ${isTimelineItemActive("Ordered") ? "bg-[#6C3CD1]  border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Order Placed {formatDateShort(order.createdAt)}
      </Text>
    </View>

    {/* Processing */}
    <View className="flex-row items-center mb-10">
      <View 
        className={`p-1.5 rounded-full  absolute -left-8 ${isTimelineItemActive("Processing") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Order is Processing
      </Text>
    </View>
    <View className="flex-row items-center mb-10">
      <View 
        className={`p-1.5 rounded-full  absolute -left-8 ${isTimelineItemActive("Out For Delivery") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Order is Out for Delivery
      </Text>
    </View>


     <View className="flex-row items-center mb-10">
      <View 
        className={`p-1.5 rounded-full  absolute -left-8 ${isTimelineItemActive("Collected") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Driver has Collected the order
      </Text>
    </View>

    

    {/* On the way */}
    <View className="flex-row items-center mb-10">
      <View 
        className={`p-1.5 rounded-full  absolute -left-8 ${isTimelineItemActive("On the way") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Order is On the way
      </Text>
    </View>

    {/* Delivered - Last item in normal flow */}
     <View className={`flex-row items-center ${status === "Cancelled" ? "mb-10" : ""}`}>
    {status !== "Return" &&  status !== "Hold" &&  !isHoldOrder &&(
   
         <View className={`flex-row items-center`}>
      
      <View 
        className={`p-1.5 rounded-full  absolute -left-8 ${isTimelineItemActive("Delivered") ? "bg-[#6C3CD1] border-4 border-[#F4EDFF]" : "bg-[#D9D9D9] border-4 border-[#EDEDED]"}`} 
      />
      <Text className="text-[#5E5E5E] font-medium">
        Order is Delivered
      </Text>
    </View>
    )}
    </View>

    {status === "Return" && (
      <View className="flex-row items-center">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className=" font-medium text-[#5E5E5E]">
          Order marked as Return
        </Text>
      </View>
    )}



      {(status === "Hold" || (status === "On the way" && isHoldOrder) || (status === "Delivered" && isHoldOrder)) && (
      <View className="flex-row items-center mb-10">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Driver marked order as Hold
        </Text>
      </View>
    )}

    { status === "Hold" && (
    
      <View className="flex-row items-center mb-10">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#CDCDCD] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
         Order is On the way
        </Text>
      </View>
    )}

        {status === "Hold" && (
    
      <View className="flex-row items-center">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#CDCDCD] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Order is Delivered
        </Text>
      </View>
    )}



   {isHoldOrder && status === "On the way" && (
      <View className="flex-row items-center mb-10">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Order is On the way
        </Text>
      </View>
    )}

     {isHoldOrder && status === "On the way" && (
    
      <View className="flex-row items-center">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#CDCDCD] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Order is Delivered
        </Text>
      </View>
    )}

       {isHoldOrder && status === "Delivered" && (
      <View className="flex-row items-center mb-10">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Order is On the way
        </Text>
      </View>
    )}

    
   {isHoldOrder && status === "Delivered" && (
    
      <View className="flex-row items-center">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className="text-[#5E5E5E] font-medium">
          Order is Delivered
        </Text>
      </View>
    )}
    {/* Order Cancelled - Show ONLY if order is cancelled */}
    {status === "Cancelled" && (
      <View className="flex-row items-center">
        <View 
          className="p-1.5 rounded-full absolute -left-8 bg-[#6C3CD1] border-4 border-[#F4EDFF]"
        />
        <Text className="text-red-500 font-medium">
          Order is Cancelled
        </Text>
      </View>
    )}

    
  </View>

  {status === "Return" && returnReason && (
                <View className="mt-[-7] ml-2 p-4 ">
                  <Text className=" font-semibold mb-1 text-[#5E5E5E]">Reason: <Text className="text-black"> "{returnReason}"</Text></Text>
                
                </View>
              )}
</View>

            {/* Customer Information */}
          <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
  <Text className="text-[#808FA2] font-medium mb-1">Customer's Name</Text>
  <Text className="text-black font-medium mb-3">
    {customerData ? 
      `${customerData.title || ''}. ${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Not Available' :
      `${order.title || ''}  ${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Not Available'
    }
  </Text>

  <Text className="text-[#808FA2] font-medium mb-1">Customer's Mobile Number</Text>
  <Text className="text-black font-medium mb-3">
    {customerData?.phoneNumber || order.phoneNumber || 'Not Available'}
  </Text>

  <Text className="text-[#808FA2] font-medium mb-1">Building Type</Text>
  <Text className="text-black font-medium mb-3">
    {customerData?.buildingType || order.buildingType || 'Not Available'}
  </Text>

  {/* <Text className="text-[#808FA2] font-medium mb-1">Address</Text>
  <Text className="text-black font-medium">
    {customerData?.buildingDetails ? 
      `${customerData.buildingDetails.houseNo || ''} ${customerData.buildingDetails.streetName || ''}, ${customerData.buildingDetails.city || ''}`.trim() || order.fullAddress || 'Not Available' :
      order.fullAddress || 'Not Available'
    }
  </Text> */}
  <Text className="text-[#808FA2] font-medium mb-1">Address</Text>
  <Text className="text-black font-medium">
    {customerData?.buildingDetails ? 
      (() => {
        const buildingType = customerData?.buildingType || order.buildingType;
        
        if (buildingType === "Apartment") {
          return `${customerData.buildingDetails.buildingNo || ''}, ${customerData.buildingDetails.buildingName || ''}, ${customerData.buildingDetails.unitNo || ''}, ${customerData.buildingDetails.floorNo || ''}, ${customerData.buildingDetails.houseNo || ''}, ${customerData.buildingDetails.streetName || ''}, ${customerData.buildingDetails.city || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim() || order.fullAddress || 'Not Available';
        } else if (buildingType === "House") {
          return `${customerData.buildingDetails.houseNo || ''}, ${customerData.buildingDetails.streetName || ''}, ${customerData.buildingDetails.city || ''}`.trim() || order.fullAddress || 'Not Available';
        } else {
          return order.fullAddress || 'Not Available';
        }
      })() :
      order.fullAddress || 'Not Available'
    }
  </Text>
</View>
            {/* Payment Summary */}
            {order.fullTotal && (
              <View className="bg-white border border-gray-200 rounded-lg shadow-sm mx-4 p-4 mb-4">
                <Text className="text-black font-semibold mb-2">Payment Summary</Text>
                {/* <View className="flex-row justify-between mb-2">
  <Text className="text-[#8492A3]">Subtotal</Text>
  <Text className="text-black font-medium">
    Rs.{(parseFloat(order.total || "0") -deliveryFee ).toFixed(2)}
  </Text>
</View> */}

 {isPackage === 1 && (
  <View className="flex-row justify-between mb-2">
    <Text className="text-[#8492A3]">Subtotal</Text>
    <Text className="text-[#8492A3]">
       Rs.{formatPrice(parseFloat(order.total || "0") -deliveryFee )}
    </Text>
  </View>
  )}

{isPackage === 0 && (
  <View className="flex-row justify-between mb-2">
    <Text className="text-[#8492A3]">Subtotal</Text>
    <Text className="text-[#8492A3]">
      Rs.{new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(order.total || "0") - deliveryFee - 180)}
    </Text>
  </View>
  
)}

        {order.discount && parseFloat(order.discount) > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Discount</Text>
                    <Text className="text-[#8492A3]">Rs.{formatPrice(order.discount)}</Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-2">
                    <Text className="text-[#8492A3]">Delivery</Text>
                    <Text className="text-[#8492A3]">Rs.{formatPrice(deliveryFee)}</Text>
                  </View>
                  {isPackage === 0 && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-[#8492A3]">Service Fee</Text>
                      <Text className="text-[#8492A3]">
                        Rs.180.00
                      </Text>
                    </View>
                  )}
                <View className="flex-row justify-between pt-2">
                  <Text className="font-semibold text-black">Grand Total</Text>
                  <Text className="font-bold text-black">
                  Rs.{formatPrice(order.fullTotal || "0")}
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
{ status !== "Cancelled" && (
  <TouchableOpacity 
    onPress={handleReportStatus}
    className="mx-5 mb-3 rounded-full px-14"
  >
    <LinearGradient
      colors={["#6839CF", "#874DDB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="py-3 rounded-full items-center"
    >
      <Text className="text-white text-center font-semibold">Report Status</Text>
    </LinearGradient>
  </TouchableOpacity>
)}

            {/* Cancel Order Button */}
            <TouchableOpacity 
              onPress={handleCancelOrder}
              disabled={isCancelDisabled()}
              className={`mx-5 mb-5 px-14 rounded-full ${isCancelDisabled() ? "opacity-70" : ""}`}
            >
              {isCancelDisabled() ? (
                <View className="bg-white py-3 rounded-full items-center">
                  <Text className="text-white text-center font-semibold">Cancel Order</Text>
                </View>
              ) : (
                <View className="bg-[#000000] py-3 rounded-full items-center">
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