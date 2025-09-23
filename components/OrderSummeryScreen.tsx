import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
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

interface ItemDetails {
  name: string;
  displayName: string;
  price: number;
  discount?:number;
  mpItemId?: number | null; // Add this property
  quantityType?: string; // Also add quantityType for better data handling
  unitType?: string; // Add unitType property
}

interface ModifiedMinItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number;
  additionalPrice: number;
  additionalDiscount: number;
}
// type ItemDetails = {
//   name: string;
//   displayName: string;
//   price: number;
//   mpItemId?: number | null; // Add this property
// };

interface AdditionalItem {
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
  // Add any other properties that might exist
  [key: string]: any; // This allows for dynamic properties if needed
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


interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [additionalItemDetails, setAdditionalItemDetails] = useState<Record<string, ItemDetails>>({});
const [packageItemDetails, setPackageItemDetails] = useState<Record<string, ItemDetails>>({});
const [packageDisplayName, setPackageDisplayName] = useState<string>("");
 const [deliveryFee, setDeliveryFee] = useState<number>(0);
 // const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
    isPackage = 0,

    orderItems = [] 
  } = route.params || {};
  

  const safeItems = Array.isArray(items) ? items : [];

  const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  

  const timeDisplay = selectedTimeSlot || "Not set";

 
  const totalDeliveryPlus = fullTotal;

   const subTotalDeliveryPlus = totalDeliveryPlus + discount;

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

 

// const handleConfirmOrder = async () => {
//     // Prevent multiple clicks
//     if (isSubmitting || isSubmitted) {
//       return;
//     }
    
//     // Set submitting state to show loading indicator
//     setIsSubmitting(true);

//     if (!customerId && !customerid) {
//       Alert.alert("Error", "Customer information is missing");
//       setIsSubmitting(false);
//       return;
//     }
    
//     try {
//       const storedToken = await AsyncStorage.getItem("authToken");
      
//       if (!storedToken) {
//         Alert.alert("Error", "Authentication token not found. Please log in again.");
//         setIsSubmitting(false);
//         return;
//       }

//       // Prepare the order payload in the required format
//       const orderData = {
//         userId: customerId || customerid,
//         isPackage: isPackage || 0,
//         total: fullTotal + discount,
//         fullTotal: fullTotal , // Assuming fullTotal is subtotal
//         discount: discount,
//         sheduleDate: selectedDate,
//         sheduleTime: selectedTimeSlot,
//         paymentMethod: paymentMethod,
//         isPaid: 1, // Assuming 1 means paid
//         status: 'confirmed',
//         items: isPackage === 0 
//           ? safeItems.map(item => ({
//               productId: item.id,
//               qty: item.qty === 'g' ? Number(item.qty) / 1000 : item.qty, // Convert g to kg
//               unit: item.unitType === 'g' ? 'g' : 'kg',
//               price: item.price,
//               discount: item.discount
//             }))
//           : [] // Handle package items differently
//       };

//       const orderPayload = {
//         orderData: orderData,
        
//       };

//       console.log("Sending order data to API:", JSON.stringify(orderPayload, null, 2));
      
//       const apiUrl = `${environment.API_BASE_URL}api/orders/create-order`;
//       const response = await axios.post(apiUrl, orderPayload, {
//         headers: { 
//           Authorization: `Bearer ${storedToken}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.data.success) {
//         setIsSubmitted(true);
//         setIsSubmitting(false);
        
//         console.log("Order created successfully:", response.data);
        
//         navigation.navigate("Main", {
//           screen: "OrderConfirmedScreen",
//           params: {
//             orderId: response.data.data.orderId,
//             total: total,
//             subtotal: fullTotal, // Using fullTotal as subtotal
//             discount: discount,
//             paymentMethod: paymentMethod,
//             userId: customerId || (customerid as string),
//             selectedDate: selectedDate,
//             selectedTimeSlot: selectedTimeSlot,
//           },
//         });
//       } else {
//         setIsSubmitting(false);
//         Alert.alert("Error", response.data.message || "Failed to create order");
//       }
//     } catch (error: any) {
//       console.error("Error creating order:", error);
//       setIsSubmitting(false);
      
//       let errorMessage = "Failed to create order";
//       if (error.response && error.response.data) {
//         errorMessage = error.response.data.message || errorMessage;
//       } else if (error instanceof Error) {
//         errorMessage = error.message;
//       }
      
//       Alert.alert("Error", errorMessage);
//     }
//   };


const handleConfirmOrder = async () => {
  if (isSubmitting || isSubmitted) {
    return;
  }

  setIsSubmitting(true);

  if (!customerId && !customerid) {
    Alert.alert("Error", "Customer information is missing");
    setIsSubmitting(false);
    return;
  }

  try {
    const storedToken = await AsyncStorage.getItem("authToken");

    if (!storedToken) {
      Alert.alert("Error", "Authentication token not found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    let orderPayload;

    if (isPackage === 0) {
      // Regular order with items
      const orderData = {
        userId: customerId || customerid,
        isPackage: 0,
        total: fullTotal + discount,
        fullTotal: fullTotal,
        discount: discount,
        sheduleDate: selectedDate,
        sheduleTime: selectedTimeSlot,
        paymentMethod: paymentMethod,
        isPaid: 0,
        status: 'confirmed',
        items: safeItems.map(item => ({
          productId: item.id,
          qty: item.qty === 'g' ? Number(item.qty) / 1000 : item.qty,
          unit: item.unitType === 'g' ? 'g' : 'kg',
          price: item.price,
          discount: item.discount
        }))
      };

      orderPayload = {
        orderData: orderData
      };
    } else {
      // Package order - use additionalItems from route.params
      const currentPackageItem = safeOrderItems[0] || {};
      
      // Get additional items from either orderData.additionalItems or directly from route.params
      const additionalItems = currentPackageItem.additionalItems || 
                            (route.params?.orderData?.additionalItems || []);

      // Create items array for the package order
      const packageItems = additionalItems.map((item: any) => ({
        productId: item.productId || item.id,
        qty: item.qty || item.quantity,
        unit: item.unit || 'kg',
        price: item.price,
        discount: item.discount
      }));

      const packageOrderData = {
        userId: customerId || customerid,
        isPackage: 1,
        packageId: currentPackageItem.packageId || route.params?.packageId,
        total: fullTotal + discount,
        fullTotal: fullTotal,
        discount: discount,
        sheduleDate: selectedDate,
        sheduleTime: selectedTimeSlot,
        transactionId: null,
        paymentMethod: paymentMethod,
        isPaid: 1,
        status: 'confirmed',
        items: packageItems
      };

      orderPayload = {
        orderData: packageOrderData
      };
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
      setIsSubmitted(true);
      setIsSubmitting(false);

      console.log("Order created successfully:", response.data);

      navigation.navigate("Main", {
        screen: "OrderConfirmedScreen",
        params: {
          orderId: response.data.data.orderId,
          isPackage:isPackage,
          total: total,
          subtotal: fullTotal,
          discount: discount,
          paymentMethod: paymentMethod,
          userId: customerId || (customerid as string),
          selectedDate: selectedDate,
          selectedTimeSlot: selectedTimeSlot,
        },
      }
    );
    } else {
      setIsSubmitting(false);
      Alert.alert("Error", response.data.message || "Failed to create order");
    }
  } catch (error: any) {
    console.error("Error creating order:", error);
    setIsSubmitting(false);

    let errorMessage = "Failed to create order";
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    Alert.alert("Error", errorMessage);
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



const fetchItemDetails = async () => {
  if (isPackage !== 1 || !safeOrderItems.length) return;
  
  const packageItem = safeOrderItems[0];
  
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) return;
    
    // Create objects to store the details
    const additionalDetails: Record<string, ItemDetails> = {};
    const packageItemDetails: Record<string, ItemDetails> = {};
    let packageDisplayName = "";
    
    // First, fetch the package details to get the display name
    if (packageItem.packageId) {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/packages/marketplace-package/${packageItem.packageId}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );
        
        if (response.data && response.data.data) {
          packageDisplayName = response.data.data.displayName  ;
          console.log(`Package ${packageItem.packageId} Details:`, response.data.data);
          console.log("99999999999999999999999999999999999999Package Display Name:", packageDisplayName);
        }

        
      } catch (error) {
       console.error(`Error fetching package ${packageItem.packageId} details:`, error);
        packageDisplayName = `Package ${packageItem.packageId}`;
      }
    }
    
    // Fetch details for package items from finalOrderPackageList
    // Use the new endpoint that fetches by packageId and item.id
 // Fetch details for package items from finalOrderPackageList
if (packageItem.finalOrderPackageList && packageItem.finalOrderPackageList.length > 0) {
  console.log("finalOrderPackageList structure:", JSON.stringify(packageItem.finalOrderPackageList, null, 2));
  
  for (const item of packageItem.finalOrderPackageList) {
    try {
      const productId = item.productId;
      
      if (!productId) {
        console.error("No productId found for item:", item);
        continue;
      }
      
      console.log(`Fetching details for packageId: ${packageItem.packageId}, productId: ${productId}`);
      
      // Use the endpoint that searches by productId (mpItemId)
      const response = await axios.get(
        `${environment.API_BASE_URL}api/packages/package-item-by-product/${packageItem.packageId}/${productId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data && response.data.data) {
        // Use the packagedetails table ID as the key (response.data.data.id)
        const itemIdKey = response.data.data.id.toString();
        
        packageItemDetails[itemIdKey] = {
          name: response.data.data.name || response.data.data.displayName || `Item ${response.data.data.id}`,
          displayName: response.data.data.displayName || response.data.data.name || `Item ${response.data.data.id}`,
          price: response.data.data.discountedPrice || response.data.data.normalPrice || 0,
          mpItemId: response.data.data.mpItemId // Store the marketplace item ID for reference
        };
        
        console.log(`Package Item ${response.data.data.id} Details:`, response.data.data);
      }
    } catch (error) {
      console.error(`Error fetching package item ${item.productId} details:`, error);
     
     
      
      // Set fallback data if API call fails
      // Use productId as the key since we don't have the packagedetails ID
      const itemIdKey = item.productId.toString();
      packageItemDetails[itemIdKey] = {
        name: `Item ${item.productId}`,
        displayName: `Item ${item.productId}`,
        price: 0,
        mpItemId: item.productId
      };
    }
  }
}
    
    // Fetch details for additional items (keep existing logic for marketplace items)
    if (packageItem.additionalItems && packageItem.additionalItems.length > 0) {
      for (const item of packageItem.additionalItems) {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/packages/marketplace-item/${item.id}`,
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          );
          
          if (response.data && response.data.data) {
            const itemIdKey = item.id.toString();

            console.log("daatatta-------",response.data)
            
            additionalDetails[itemIdKey] = {
              name: response.data.data.name || response.data.data.displayName || `Item ${item.id}`,
              displayName: response.data.data.displayName || response.data.data.name || `Item ${item.id}`,
              price: response.data.data.discountedPrice || response.data.data.normalPrice || 0
            };
            
            console.log(`Additional Item ${item.id} Details:`, response.data.data);
          }
        } catch (error) {
          console.error(`Error fetching additional item ${item.id} details:`, error);
          // Set fallback data if API call fails
          const itemIdKey = item.id.toString();
          additionalDetails[itemIdKey] = {
            name: `Item ${item.id}`,
            displayName: `Item ${item.id}`,
            price: 0
          };
        }
      }
    }
    
    // Update state variables
    setAdditionalItemDetails(additionalDetails);
    setPackageItemDetails(packageItemDetails);
    setPackageDisplayName(packageDisplayName);
    
  } catch (error) {
    console.error("Error fetching item details:", error);
  }
};

// Updated useEffect remains the same
useEffect(() => {
  if (isPackage === 1 && safeOrderItems.length > 0) {
    fetchItemDetails();
  }
}, [isPackage, safeOrderItems]);


 useEffect(() => {
  const fetchCustomerDataAndDeliveryFee = async () => {
    const customerIdValue = customerId || route.params?.customerId || route.params?.customerid;
    
    if (!customerIdValue) {
      console.log("No customer ID found");
      return;
    }

    try {
      console.log("Fetching customer data for userId:", customerIdValue);
      
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        console.log("No authentication token found");
        setError("No authentication token found");
        return;
      }
      
      // Fetch customer data
      const customerResponse = await axios.get(
        `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdValue}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      
      console.log("Customer API response:", customerResponse.data);
      
      if (customerResponse.data?.success) {
        const customerData = customerResponse.data.data;
        setCustomerData(customerData);
        
        // Extract city from customer data
        const customerCity = customerData.buildingDetails?.city;
        console.log("Customer city:", customerCity);
        
        if (customerCity) {
          try {
            // Fetch cities to get delivery charge
            const cityResponse = await axios.get<{ data: City[] }>(
              `${environment.API_BASE_URL}api/customer/get-city`,
              { headers: { Authorization: `Bearer ${storedToken}` }}
            );
            
            console.log("Cities API response:", cityResponse.data);
            
            if (cityResponse.data?.data) {
              const cityData = cityResponse.data.data.find(c => c.city === customerCity);
              if (cityData) {
                const fee = parseFloat(cityData.charge) || 0;
                setDeliveryFee(fee);
                console.log(`Setting delivery fee to ${fee} for city ${customerCity}`);
              } else {
                console.log(`City ${customerCity} not found in cities list`);
                setDeliveryFee(0); // Default fee if city not found
              }
            }
          } catch (cityError) {
            console.error("Error fetching cities:", cityError);
            setDeliveryFee(0); // Default fee on error
          }
        } else {
          console.log("No city found in customer data");
          setDeliveryFee(0); // Default fee if no city
        }
      } else {
        const errorMsg = customerResponse.data?.message || "Failed to fetch customer data";
        console.log("Customer API error:", errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log("Axios error details:", errorMsg);
        setError(errorMsg);
      } else {
        setError("Failed to fetch customer data");
      }
    } finally {
      setIsDataLoaded(true);
    }
  };

  // Only fetch if we have a customer ID
  if (customerId || route.params?.customerId || route.params?.customerid) {
    fetchCustomerDataAndDeliveryFee();
  }
}, [customerId, route.params?.customerId, route.params?.customerid]);

const formatPrice = (amount: number) => {
  // Check if the number has decimal places
  const hasDecimals = amount % 1 !== 0;
  
  if (hasDecimals) {
    // If has decimals, show them without .00
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  } else {
    // If no decimals, show .00
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }) + '.00';
  }
};


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className=" bg-white"
      style={{flex: 1}}
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
                <Image source={require("../assets/images/delivery.webp")} className="w-10 h-10" />
                
                <View>
                  <View className="flex-row justify-between">
                    <Text className="text-base font-semibold">Delivery - One Time</Text>
                <TouchableOpacity 
  onPress={() => {
    console.log("Navigating to ScheduleScreen with data:", {
      total,
      customerId,
      items,
      subtotal,
      discount,
      selectedDate,
      timeDisplay,
      isPackage,
      packageId:  route.params?.packageId,
      customerid,
      orderItems
    });

    navigation.navigate("ScheduleScreen" as any, {
      total,
      packageId:  route.params?.packageId,
      items,
      subtotal,
      discount,
      selectedDate,
      timeDisplay,
      isPackage,
    
     customerId,  // This is the numeric ID (7)
  customerid: customerid.toString() || customerId.toString(),
      orderItems
    });
  }}



                  //    className="border border-[#6C3CD1] px-3 rounded-full ml-12 py-[-2]"
                      >
                        <View className="border border-[#6C3CD1] px-3 rounded-full ml-11">
                      <Text className="text-[#6C3CD1] font-medium">Edit</Text>
                      </View>
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
  <View className="-m-1">
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
  
       
  

 


<View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
  <View className="flex-row justify-between">
    <Text className="text-black font-medium">Payment Summary</Text>
 
  
<TouchableOpacity 
  onPress={() => {
    // Create detailed logging objects based on the route being taken
   if (isPackage === 0) {
  // For Regular Items - CratScreen
  const regularItemsData = {
    route: "CratScreen (Regular Items)",
    ids: {
      customerId: customerId,
      customerid: customerid,
      resolvedId: customerId || customerid
    },
    selectedProducts: safeItems.map(item => ({
      id: item.id,
      name: item.name || `Item ${item.id}`, // Ensure name exists
      price: item.price,
      normalPrice: item.normalPrice || item.price + (item.discount || 0), // Calculate normal price
      discountedPrice: item.price, // discountedPrice is the actual price
      discount: item.discount || 0,
      quantity: item.qty, // Use qty from the item
      selected: false, // Start unselected for editing
      unitType: item.unitType || 'kg', // Default to kg
      startValue: item.startValue || 0.5, // Default increment value
      changeby: item.unitType === 'g' ? Number(item.qty) * 1000 : item.qty // Convert to grams if needed
    })),
    finances: {
      subtotal,
      discount,
      total,
      fullTotal
    },
    scheduling: {
      selectedDate,
      timeDisplay,
      selectedTimeSlot
    },
    paymentMethod
  };
  
  console.log("Navigation data to CratScreen:", JSON.stringify(regularItemsData, null, 2));
  
  navigation.navigate("CratScreen" as any, { 
    id: customerId || customerid,
    customerId: customerId || customerid,
    isPackage: 0,
    items: safeItems.map(item => ({
      id: item.id,
      name: item.name || `Item ${item.id}`,
      price: item.price,
      normalPrice: item.normalPrice || item.price + (item.discount || 0),
      discountedPrice: item.price,
      discount: item.discount || 0,
      qty: item.qty,
      unitType: item.unitType || 'kg',
      startValue: item.startValue || 0.5,
      quantity: item.qty
    })),
    selectedProducts: safeItems.map(item => ({
      id: item.id,
      name: item.name || `Item ${item.id}`,
      price: item.price,
      normalPrice: item.normalPrice || item.price + (item.discount || 0),
      discountedPrice: item.price,
      discount: item.discount || 0,
      quantity: item.qty,
      selected: false,
      unitType: item.unitType || 'kg',
      startValue: item.startValue || 0.5,
      changeby: item.unitType === 'g' ? Number(item.qty) * 1000 : item.qty
    })),
   // isPackage: 0,
    subtotal,
    discount,
    total,
    fullTotal,
    selectedDate,
    timeDisplay,
    selectedTimeSlot,
    paymentMethod,
    fromOrderSummary: true
  });
}
else if (isPackage === 1) {
  const currentOrderItem = safeOrderItems[0] || {};
  const additionalItems = route.params?.orderData?.additionalItems || [];
  
  // Create proper mapping for package items
  const packageItems = currentOrderItem.finalOrderPackageList?.map(item => ({
    id: item.productId,
    name: packageItemDetails[item.productId.toString()]?.displayName || `Item ${item.productId}`,
    quantity: item.quantity.toString(),
    quantityType: 'kg',
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
    discount: item.discount || 0
  })) || [];
  
  // FIXED: Map additional items with proper structure and correct price calculation
  const mappedAdditionalItems = additionalItems.map(item => {
    const itemDetail = additionalItemDetails[item.productId.toString()];
    const totalPrice = Number(item.price) || 0;
    const totalDiscount = Number(item.discount) || 0;
    const quantity = parseFloat(item.qty) || 1;
    const unit = item.unit || 'kg';
    
    // Convert quantity to kg for price calculation
    const quantityInKg = unit === 'kg' ? quantity : quantity / 1000;
    
    // Calculate price per kg from total price
    const pricePerKg = quantityInKg > 0 ? totalPrice / quantityInKg : 0;
    const discountPerKg = quantityInKg > 0 ? totalDiscount / quantityInKg : 0;
    const normalPricePerKg = pricePerKg + discountPerKg;
    
    return {
      productId: item.productId, // Keep the original productId
      mpItemId: item.productId,  // Marketplace item ID
      cropId: item.productId,    // Crop ID for reference
      name: itemDetail?.displayName || `Item ${item.productId}`,
      quantity: item.qty.toString(),
      quantityType: unit,
      // Now passing per-kg prices instead of total prices
      pricePerKg: normalPricePerKg, // Normal price per kg
      discountedPricePerKg: pricePerKg, // Discounted price per kg
      totalPrice: totalPrice, // Keep total price for reference
      discount: totalDiscount, // Total discount amount
      normalPrice: totalPrice + totalDiscount, // Total original price
      discountedPrice: totalPrice // Total price after discount
    };
  });

  const navigationData = {
    id: customerId || customerid,
    isPackage: 1,
    orderItems: safeOrderItems,
    packageId: currentOrderItem.packageId || route.params?.packageId,
    packageItems: packageItems,
    additionalItems: mappedAdditionalItems,
    subtotal,
    discount,
    total,
    fullTotal,
    selectedDate,
    selectedTimeSlot,
    timeDisplay,
    paymentMethod,
    isEdit: true,
    orderData: route.params?.orderData
  };

  console.log("Fixed navigation data for OrderScreen:", JSON.stringify(navigationData, null, 2));
  navigation.navigate("OrderScreen" as any, navigationData);
}else {
      // For Regular Items - CratScreen
      const regularItemsData = {
        route: "CratScreen (Regular Items)",
        ids: {
          customerId: customerId,
          customerid: customerid,
          resolvedId: customerId || customerid
        },
        selectedProducts: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          normalPrice: item.normalPrice || item.price,
          discountedPrice: item.discountedPrice || item.price,
          quantity: item.quantity,
          unitType: item.unitType || 'kg',
          startValue: item.startValue || 0.1,
          changeby: item.quantity
        })),
        // packageDetails: {
        //   isCustomPackage: 0,
        //   isSelectPackage: 0
        // },
        finances: {
          subtotal,
          discount,
          total,
          fullTotal
        },
        scheduling: {
          selectedDate,
          timeDisplay,
          selectedTimeSlot
        },
        paymentMethod
      };
      
      console.log("========== NAVIGATION DATA LOG ==========");
      console.log(JSON.stringify(regularItemsData, null, 2));
      console.log("=========================================");
      
      navigation.navigate("CratScreen" as any, { 
        id: customerId || customerid,
        customerId: customerId || customerid,
        items: safeItems,
        selectedProducts: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          normalPrice: item.normalPrice || item.price,
          discountedPrice: item.discountedPrice || item.price,
          quantity: item.quantity,
          selected: true, // Mark as selected
          unitType: item.unitType || 'kg',
          startValue: item.startValue || 0.1,
          changeby: item.quantity
        })),
    
        subtotal,
        discount,
        total,
        fullTotal,
        selectedDate,
        timeDisplay,
        selectedTimeSlot,
        paymentMethod,
        fromOrderSummary: true
      });
    }
  }}
  className="border border-[#6C3CD1] px-3 rounded-full"
>
      <Text className="text-[#6C3CD1] font-medium">Edit</Text>
    </TouchableOpacity>
  </View>
  
  {/* Rest of the payment summary remains the same */}
  {/* {isPackage === 1 && (
  <View className="flex-row justify-between mt-3">
  <Text className="text-[#8492A3] font-medium">Subtotal</Text>
  <Text className="text-black font-medium mr-14">
    Rs.{(subTotalDeliveryPlus - deliveryFee).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}
  </Text>
</View>
  )}

 {isPackage === 0 && (
  //  <View className="flex-row justify-between mt-3">
  //   <Text className="text-[#8492A3] font-medium">Subtotal</Text>
  //   <Text className="text-black font-medium mr-14">
  //     Rs.{(subTotalDeliveryPlus -180-deliveryFee).toFixed(2)}
  //   </Text>
  // </View>
  <View className="flex-row justify-between mt-3">
  <Text className="text-[#8492A3] font-medium">Subtotal</Text>
  <Text className="text-black font-medium mr-14">
    Rs.{(subTotalDeliveryPlus - 180 - deliveryFee).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    })}.00
  </Text>
</View>
  )}

 <View className="flex-row justify-between mt-2">
  <Text className="text-[#8492A3]">Discount</Text>
  <Text className="text-gray-500 mr-14">
    Rs.{discount.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    })}.00
  </Text>
</View>

   <View className="flex-row justify-between mt-2">
  <Text className="text-[#8492A3]">Delivery Fee</Text>
  <Text className="text-gray-500 mr-14">
    Rs.{deliveryFee.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    })}.00
  </Text>
</View>

{isPackage === 0 && (
  <View className="flex-row justify-between mt-2">
    <Text className="text-[#8492A3]">Service Fee</Text>
    <Text className="text-gray-500 mr-14">
      Rs.180.00
    </Text>
  </View>
)}
<View className="flex-row justify-between mt-2">
  <Text className="text-black font-semibold">Grand Total</Text>
  <Text className="text-black font-semibold mr-14">
    Rs.{totalDeliveryPlus.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    })}.00
  </Text>
</View> */}

 {isPackage === 1 && (
    <View className="flex-row justify-between mt-3">
      <Text className="text-[#8492A3] font-medium">Subtotal</Text>
      <Text className="text-black font-medium mr-14">
        Rs.{formatPrice(subTotalDeliveryPlus - deliveryFee)}
      </Text>
    </View>
  )}

  {isPackage === 0 && (
    <View className="flex-row justify-between mt-3">
      <Text className="text-[#8492A3] font-medium">Subtotal</Text>
      <Text className="text-black font-medium mr-14">
        Rs.{formatPrice(subTotalDeliveryPlus - 180 - deliveryFee)}
      </Text>
    </View>
  )}

  <View className="flex-row justify-between mt-2">
    <Text className="text-[#8492A3]">Discount</Text>
    <Text className="text-gray-500 mr-14">
      Rs.{formatPrice(discount)}
    </Text>
  </View>

  <View className="flex-row justify-between mt-2">
    <Text className="text-[#8492A3]">Delivery Fee</Text>
    <Text className="text-gray-500 mr-14">
      Rs.{formatPrice(deliveryFee)}
    </Text>
  </View>

  {isPackage === 0 && (
    <View className="flex-row justify-between mt-2">
      <Text className="text-[#8492A3]">Service Fee</Text>
      <Text className="text-gray-500 mr-14">
        Rs.180.00
      </Text>
    </View>
  )}

  <View className="flex-row justify-between mt-2">
    <Text className="text-black font-semibold">Grand Total</Text>
    <Text className="text-black font-semibold mr-14">
      Rs.{formatPrice(totalDeliveryPlus)}
    </Text>
  </View>
</View>
          {/* Payment Method */}
          {/* <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="text-black font-medium">Payment Method</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("SelectPaymentMethod" as any, {
  //                 items,
  //                 subtotal,
  //                 discount, 
  //                 total,
  //                 fullTotal,
   
  //     selectedDate,
  //     timeDisplay,
  //     isCustomPackage,
  //     isSelectPackage,
               
  //                 selectedTimeSlot,
  //                 customerId,  // This is the numeric ID (7)
  // customerid: customerid.toString() || customerId.toString(),
               total,
     
      items,
      subtotal,
      discount,
      selectedDate,
      timeDisplay,
      isCustomPackage,
      selectedTimeSlot,
      isSelectPackage,
     customerId,  // This is the numeric ID (7)
  customerid: customerid.toString() || customerId.toString(),
      orderItems,
      selectedMethod :paymentMethod
                })}
                className="border border-[#6C3CD1] px-3 rounded-full">
                <Text className="text-[#6C3CD1] font-medium">Edit</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[#8492A3] mt-1">{paymentMethod || "Not selected"}</Text>
          </View>
        </View> */}

        <View className="bg-white border border-gray-300 rounded-lg p-4 mt-3 shadow-sm">
  <View className="flex-row justify-between">
    <Text className="text-black font-medium">Payment Method</Text>
    <TouchableOpacity
      onPress={() => navigation.navigate("SelectPaymentMethod" as any, {
        // Pass all the data needed for a complete round trip
        items,
        subtotal,
        discount,
        total,
        fullTotal,
        selectedDate,
        timeDisplay,
        isPackage,
   packageId:  route.params?.packageId,
        selectedTimeSlot,
        customerId,
        customerid: customerid?.toString() || customerId?.toString(),
        orderItems,
        selectedMethod: paymentMethod 
      })}
      className="border border-[#6C3CD1] px-3 rounded-full"
    >
      <Text className="text-[#6C3CD1] font-medium">Edit</Text>
    </TouchableOpacity>
  </View>
  {/* <Text className="text-[#8492A3] mt-1">{paymentMethod || "Not selected"} Cash On Delivery</Text> */}
   <Text className="text-[#8492A3] mt-1">Cash On Delivery</Text>
</View>
</View>
  
        {/* Confirm Button with ActivityIndicator */}
        <TouchableOpacity 
          onPress={handleConfirmOrder}
          disabled={isSubmitting || isSubmitted}
          style={{ opacity: isSubmitted ? 0.6 : 1 }}
        >
          <LinearGradient 
            colors={["#6839CF", "#874DDB"]} 
            className="py-3 px-4  items-center mt-[10%] mb-[10%] mr-[25%] ml-[25%] rounded-3xl h-15"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-white font-bold">
                {isSubmitted ? "Order Confirmed" : "Confirm"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrderSummeryScreen;