// import React, {  useState } from "react";
// import { View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, Alert } from "react-native";
// import { SelectList } from "react-native-dropdown-select-list";
// import { Feather } from "@expo/vector-icons";
// import BackButton from "./BackButton";
// import { RouteProp } from "@react-navigation/native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "./types";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import { LinearGradient } from "expo-linear-gradient";
// import DateTimePicker from '@react-native-community/datetimepicker'; 

// type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
// type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">;

// interface AdditionalItem {
//   discount: number;
//   mpItemId: number;
//   unitType: string;
//   price: number;
//   quantity: number;
// }


// interface ScheduleScreenProps {
//   navigation: ScheduleScreenNavigationProp;
//   route: {
//     params: {
//       items?: Array<{
//         id: number;
//         name: string;
//         price: number;
//         normalPrice: number;
//         discountedPrice: number;
//         quantity: number;
//         selected: boolean;
//         unitType: string;
//         startValue: number;
//         changeby: number;
//       }>;
//       total?: number;
//       subtotal?: number;
//       discount?: number;
//       id?: string;
//       isCustomPackage?: string;
//       isSelectPackage?: string;
//       customerid?: string;
      
//       orderItems?: Array<{
//         additionalItems?: Array<AdditionalItem>;
//         isAdditionalItems: boolean;
//         customerid?: string; 
//         isModifiedMin: boolean;
//         isModifiedPlus: boolean;
//         modifiedMinItems: Array<{
//           additionalDiscount: number;
//           additionalPrice: number;
//           modifiedQuantity: number;
//           originalPrice: string;
//           originalQuantity: number;
//           packageDetailsId: number;
//         }>;
//         modifiedPlusItems: Array<{
//           additionalDiscount: number;
//           additionalPrice: number;
//           modifiedQuantity: number;
//           originalPrice: string;
//           originalQuantity: number;
//           packageDetailsId: number;
//         }>;
//         packageDiscount: number;
//         packageId: number;
        
//         packageTotal: number;
//       }>;
//     };
//   };
// }

// interface CartItem {
//   id: number;
//   name: string;
//   price: number;
//   normalPrice: number;
//   discountedPrice: number;
//   quantity: number;
//   selected: boolean;
//   unitType: string;
//   startValue: number;
//   changeby: number;
//   currentTotal?: number;
//   currentSubtotal?: number;
//   discount?: number;
// }


// const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation, route }) => {

//   const {
//     total: originalTotal = 0,
//     subtotal: originalSubtotal = 0,
//     discount: originalDiscount = 0,
//     items: originalItems = [],
//     id: customerId = "",
//     isCustomPackage = "", 
//     isSelectPackage = "",
//     customerid = "",
//     orderItems = []
//   } = route.params || {};

//   const [items, setItems] = useState<CartItem[]>(() => {
//     return processInitialData(originalItems, orderItems);
//   });
  
//   const [total, setTotal] = useState(() => calculateInitialTotal(originalTotal, orderItems));
//   const [subtotal, setSubtotal] = useState(() => calculateInitialSubtotal(originalSubtotal, orderItems));
//   const [discount, setDiscount] = useState(() => calculateInitialDiscount(originalDiscount, orderItems));
//   const [selectedTimeSlot, setSelectedTimeSlot] = useState("");  
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);
//   const [isDateSelected, setIsDateSelected] = useState(false);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [date, setDate] = useState(new Date());
  
//   // Calculate minimum date (2 days from today)
//   const getMinimumSelectableDate = () => {
//     const minDate = new Date();
//     minDate.setDate(minDate.getDate() + 2); // Add 2 days to current date
//     return minDate;
//   };

//   // Set minimum date for selection
//   const minimumDate = getMinimumSelectableDate();

//   const DELIVERY_FEE = 350;
//   const fullTotal = total + DELIVERY_FEE;
  
//   const timeSlots = [
//     { key: "Within 8-12 AM", value: "Within 8-12 AM" },
//     { key: "Within 12-4 PM", value: "Within 12-4 PM" },
//     { key: "Within 4-8 PM", value: "Within 4-8 PM" },
//   ];
  
//   function processInitialData(originalItems: any[], orderItems: any[]) {
//     if (orderItems && orderItems.length > 0) {
//       const orderData = orderItems[0];
//       const processedItems: CartItem[] = [];
//       return processedItems;
//     } else if (originalItems && originalItems.length > 0) {
//       return originalItems;
//     }
//     return [];
//   }
  
//   function calculateInitialTotal(originalTotal: number, orderItems: any[]) {
//     if (orderItems && orderItems.length > 0) {
//       return orderItems[0].packageTotal || 0;
//     }
//     return originalTotal;
//   }
  
//   function calculateInitialSubtotal(originalSubtotal: number, orderItems: any[]) {
//     if (orderItems && orderItems.length > 0) {
//       const total = orderItems[0].packageTotal || 0;
//       const discount = orderItems[0].packageDiscount || 0;
//       return total + discount;
//     }
//     return originalSubtotal;
//   }
  
//   function calculateInitialDiscount(originalDiscount: number, orderItems: any[]) {
//     if (orderItems && orderItems.length > 0) {
//       return orderItems[0].packageDiscount || 0;
//     }
//     return originalDiscount;
//   }

//   const handleScheduleDateSelection = () => {
//     // Initialize date picker with minimum date if not already selected
//     if (!isDateSelected) {
//       setDate(minimumDate);
//     }
//     setShowDatePicker(true);
//   };
  
//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     setShowDatePicker(Platform.OS === 'ios');
    
//     if (selectedDate) {
//       // Validate selected date is at least 2 days from today
//       const today = new Date();
//       const minSelectableDate = new Date(today);
//       minSelectableDate.setDate(today.getDate() + 2);
      
//       if (selectedDate >= minSelectableDate) {
//         setDate(selectedDate);
        
//         const day = selectedDate.getDate();
//         const month = selectedDate.toLocaleString('en-US', { month: 'short' });
//         const year = selectedDate.getFullYear();
//         const formattedDate = `${day} ${month} ${year}`;
        
//         setSelectedDate(formattedDate);
//         setIsDateSelected(true);
//       } else {
//         // Alert user if they somehow selected an invalid date
//         Alert.alert(
//           "Invalid Date", 
//           "Please select a date at least 2 days from today."
//         );
        
//         // Reset to minimum date
//         setDate(minimumDate);
//       }
//     }
//   };
  
//   const handleIOSDateConfirm = () => {
//     // Validate selected date is at least 2 days from today for iOS
//     const today = new Date();
//     const minSelectableDate = new Date(today);
//     minSelectableDate.setDate(today.getDate() + 2);
    
//     if (date >= minSelectableDate) {
//       const day = date.getDate();
//       const month = date.toLocaleString('en-US', { month: 'short' });
//       const year = date.getFullYear();
//       const formattedDate = `${day} ${month} ${year}`;
      
//       setSelectedDate(formattedDate);
//       setIsDateSelected(true);
//       setShowDatePicker(false);
//     } else {
//       Alert.alert(
//         "Invalid Date", 
//         "Please select a date at least 2 days from today."
//       );
      
//       // Reset to minimum date
//       setDate(minimumDate);
//     }
//   };
  
//   const handleTimeSlotSelection = (val: string) => {
//     if (val !== selectedTimeSlot) {
//       setSelectedTimeSlot(val);
//       console.log("Selected time slot:", val);
//     }
//   };
  
//   const handleProceed = () => {

//     if (!selectedDate && !selectedTimeSlot ) {
//       Alert.alert("Required", "Please select a delivery date & time slot");
//       return;
//     }
//     if (!selectedDate) {
//       Alert.alert("Required", "Please select a delivery date");
//       return;
//     }
  
//     if (!selectedTimeSlot) {
//       Alert.alert("Required", "Please select a time slot");
//       return;
//     }
  
//     const packageId = orderItems && orderItems.length > 0 ? orderItems[0].packageId : undefined;
    
//     navigation.navigate("SelectPaymentMethod" as any, {
//       items: items,
//       subtotal: subtotal,
//       discount: discount,
//       total: total,
//       fullTotal: fullTotal,
//       selectedDate: selectedDate,
//       selectedTimeSlot: selectedTimeSlot,
//       customerId: customerId,
//       isSelectPackage: isSelectPackage,
//       isCustomPackage: isCustomPackage,
//       packageId: packageId,
//       customerid: customerid,
//       orderItems: orderItems
//     });
    
//     console.log("Data passed to payment:", {
//       items, subtotal, discount, total, fullTotal, selectedDate, selectedTimeSlot, customerId,
//       isSelectPackage, isCustomPackage, packageId
//     });
//   };
  
//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       enabled 
//       className="flex-1"
//     >
//       <View className="flex-1 bg-white">
//         {/* Header */}
//         <View className="flex-row items-center shadow-md px-3 bg-white">
//           <BackButton navigation={navigation} />
//           <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">Schedule</Text>
//         </View>
        
//         <View className="px-10 py-3">
//           {/* Delivery Type Dropdown */}
//           <Text className="text-[#000000] mb-2">Delivery Type</Text>
//           <TouchableOpacity 
//             className="flex-row items-center px-4 py-3 bg-gray-100 rounded-full"
//             activeOpacity={0.7}
//           >
//             <Text className="text-gray-700 font-semibold">One Time</Text>
//           </TouchableOpacity>
//         </View>
  
//         <ScrollView 
//           className="px-10 mt-[-5]" 
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Schedule Date section */}
//           <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
//           <TouchableOpacity
//             onPress={handleScheduleDateSelection}
//             className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
//           >
//             <Text className="flex-1 text-[#7F7F7F]">
//               {selectedDate || "Select Date"}
//             </Text>
//             <Image source={require("../assets/images/Calendar.png")} className="w-8 h-8" resizeMode="contain" />
//           </TouchableOpacity>
  
//           <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>
  
//           <SelectList
//             key="time-slot-select"
//             setSelected={handleTimeSlotSelection}
//             data={timeSlots}
//             save="value"
//             placeholder="Select Time Slot"
//             search={false}
//             defaultOption={
//               selectedTimeSlot 
//                 ? timeSlots.find(slot => slot.value === selectedTimeSlot) 
//                 : undefined
//             }
//             inputStyles={{
//               color: "#7F7F7F",
//             }}
//             boxStyles={{
//               backgroundColor: "#F6F6F6",
//               padding: 12,
//               borderRadius: 30,
//               borderColor: "#F6F6F6",
//               borderWidth: 5,
//             }}
//             dropdownStyles={{
//               backgroundColor: "#F6F6F6",
//               borderRadius: 10,
//               borderColor: "#F6F6F6",
//             }}
//           />
//         </ScrollView>
  
//         {/* Date Picker (conditionally rendered) */}
//         {showDatePicker && Platform.OS === 'android' && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="default"
//             onChange={handleDateChange}
//             minimumDate={minimumDate} // Set minimum date to 2 days from today
//           />
//         )}
  
//         {Platform.OS === 'ios' && showDatePicker && (
//           <Modal
//             visible={showDatePicker}
//             transparent={true}
//             animationType="slide"
//           >
//             <View className="flex-1 justify-end bg-black/50">
//               <View className="bg-white p-4 rounded-t-2xl">
//                 <View className="flex-row justify-between items-center mb-4">
//                   <Text className="text-lg font-bold text-[#6C3CD1]">Select Date</Text>
//                   <TouchableOpacity onPress={() => setShowDatePicker(false)}>
//                     <Feather name="x" size={24} color="#6C3CD1" />
//                   </TouchableOpacity>
//                 </View>
                
//                 <DateTimePicker
//                   value={date}
//                   mode="date"
//                   display="spinner"
//                   onChange={handleDateChange}
//                   minimumDate={minimumDate} // Set minimum date to 2 days from today
//                   style={{ height: 200, marginTop: -10 }}
//                 />
                
//                 <View className="flex-row justify-between mt-2">
//                   <TouchableOpacity
//                     onPress={() => setShowDatePicker(false)}
//                     className="px-4 py-2"
//                   >
//                     <Text className="text-[#6C3CD1] font-semibold">Cancel</Text>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity
//                     onPress={handleIOSDateConfirm}
//                     className="px-4 py-2"
//                   >
//                     <Text className="text-[#6C3CD1] font-semibold">Confirm</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           </Modal>
//         )}
   
//         <View
//           className="bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg"
//           style={{
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: -4 },
//             shadowOpacity: 0.2,
//             shadowRadius: 8,
//             elevation: 10,
//             marginTop: -10,
//           }}
//         >
         
//           <View className="flex-1">
//             <View className="flex-row justify-between">
//               <Text className="text-[#5C5C5C]">Delivery Fee :</Text>
//               <Text className="font-semibold text-[#5C5C5C]">+ Rs.{DELIVERY_FEE.toFixed(2)}</Text>
//             </View>
            
//             {/* <View className="flex-row justify-between mt-2">
//               <Text className="font-semibold text-lg">Full Total</Text>
//               <Text className="font-bold text-lg">Rs.{fullTotal.toFixed(2)}</Text>
//             </View> */}
//             <View className="flex-row justify-between mt-2">
//   <Text className="font-semibold text-lg">Full Total :</Text>
//   <Text className="font-bold text-lg">
//     Rs. {fullTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//   </Text>
// </View>

//           </View>
  
//           <TouchableOpacity onPress={handleProceed}>
//             <LinearGradient 
//               colors={["#854BDA", "#6E3DD1"]} 
//               className="py-3 px-6 rounded-full flex-row items-center ml-4"
//             >
//               <Text className="text-white font-semibold mr-2">Proceed</Text>
//               <Image
//                 source={require("../assets/images/Done.png")}
//                 className="w-5 h-5"
//                 resizeMode="contain"
//               />
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default ScheduleScreen;

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, Alert } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { Feather } from "@expo/vector-icons";
import BackButton from "./BackButton";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker'; 
import environment from "@/environment/environment";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ActivityIndicator } from "react-native";

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  unitType: string;
  price: number;
  quantity: number;
}

interface City {
  id: number;
 city:string;
 charge:string;
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


interface OrderData {
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
}

interface ScheduleScreenProps {
  navigation: ScheduleScreenNavigationProp;
  route: {
    params: {
      packageId: number | null | undefined;
      // Original cart items structure
      items?: Array<{
        id: number;
        name: string;
        price: number;
        normalPrice: number;
        discountedPrice: number;
        quantity: number;
        selected: boolean;
        unitType: string;
        startValue: number;
        changeby: number;
      }>;
      total?: number;
      subtotal?: number;
      discount?: number;
      id?: string;
      isPackage?: string;
      
      // New orderData structure
      orderData?: OrderData;
      
      customerid?: string;
      selectedDate?: string;
      timeDisplay?: string;
      
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

interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
  currentTotal?: number;
  currentSubtotal?: number;
  discount?: number;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation, route }) => {

  const {
    total: originalTotal = 0,
    subtotal: originalSubtotal = 0,
    discount: originalDiscount = 0,
    items: originalItems = [],
    id: customerId = "",
    isPackage = "", 
    orderData, // New orderData parameter
    customerid = "",
    orderItems = [],
    selectedDate: previousSelectedDate = null,
    timeDisplay: previousTimeSlot = null
  } = route.params || {};

  const [items, setItems] = useState<CartItem[]>(() => {
    return processInitialData(originalItems, orderItems);
  });

      const [openCityDropdown, setOpenCityDropdown] = useState(false);
    const [cityItems, setCityItems] = useState<{label: string, value: string}[]>([]);
 const [token, setToken] = useState<string>("");
   const [customerData, setCustomerData] = useState<CustomerData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

  // Updated state initialization to handle orderData
  const [total, setTotal] = useState(() => {
    if (orderData) {
      return orderData.total;
    }
    return calculateInitialTotal(originalTotal, orderItems);
  });
  
  const [subtotal, setSubtotal] = useState(() => {
    if (orderData) {
      return orderData.fullTotal; // Use fullTotal as subtotal for orderData
    }
    return calculateInitialSubtotal(originalSubtotal, orderItems);
  });
  
  const [discount, setDiscount] = useState(() => {
    if (orderData) {
      return orderData.discount;
    }
    return calculateInitialDiscount(originalDiscount, orderItems);
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState(previousTimeSlot || "");  
  const [selectedDate, setSelectedDate] = useState<string | null>(previousSelectedDate || null);
  const [isDateSelected, setIsDateSelected] = useState(!!previousSelectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [date, setDate] = useState(() => {
    if (previousSelectedDate) {
      const parts = previousSelectedDate.split(' ');
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const monthStr = parts[1];
        const year = parseInt(parts[2]);
        
        const months = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        if (!isNaN(day) && !isNaN(year) && monthStr in months) {
          const newDate = new Date(year, months[monthStr as keyof typeof months], day);
          if (!isNaN(newDate.getTime())) {
            return newDate;
          }
        }
      }
    }
    return new Date();
  });

  console.log("ispackage--------", isPackage);
  console.log("orderData--------", orderData);

  // Calculate minimum date (2 days from today)
  // const getMinimumSelectableDate = () => {
  //   const minDate = new Date();
  //   minDate.setDate(minDate.getDate() + 3);
  //   return minDate;
  // };

  // const minimumDate = getMinimumSelectableDate();

  const getMinimumSelectableDate = () => {
  const today = new Date(); // Current date and time 
  const currentHour = today.getHours(); // Get the current hour before modifying the date
  
  console.log("current hour:", currentHour); // Log current hour for debugging

  const minDate = new Date(today); // Create a new date object for minDate
  
  // If the current time is between 6 PM and 6 AM
  if (currentHour >= 18 || currentHour < 6) {
    minDate.setDate(today.getDate() + 4); // Set the minimum date to 4 days from today
  } else {
    minDate.setDate(today.getDate() + 3); // Set the minimum date to 3 days from today
  }

  return minDate;
};

const minimumDate = getMinimumSelectableDate();




   useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        
        const customerIdi = route.params?.customerid || customerId;

        console.log("fbkad",customerIdi)
        
        if (!customerIdi) {
          console.log("No customer ID found in route params");
          setError("No customer ID found");
          setLoading(false);
          return;
        }
        
        const storedToken = await AsyncStorage.getItem("authToken");
        
        if (!storedToken) {
          console.log("No authentication token found");
          setError("No authentication token found");
          setLoading(false);
          return;
        }
        
        // Fetch customer data
        const apiUrl = `${environment.API_BASE_URL}api/orders/get-customer-data/${customerIdi}`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        
        console.log("Full API response:", response.data);
        
        if (response.data && response.data.success) {
          console.log("Customer data received:", response.data.data);
          setCustomerData(response.data.data);
          
          // Fetch cities to get delivery charge
          const cityResponse = await axios.get<{ data: City[] }>(
            `${environment.API_BASE_URL}api/customer/get-city`,
            { headers: { Authorization: `Bearer ${storedToken}` }}
          );
          
          if (cityResponse.data && cityResponse.data.data) {
            const customerCity = response.data.data.buildingDetails?.city;
            if (customerCity) {
              const cityData = cityResponse.data.data.find(c => c.city === customerCity);
              if (cityData) {
                const fee = parseFloat(cityData.charge) || 0;
                setDeliveryFee(fee);
                console.log(`Setting delivery fee to ${fee} for city ${customerCity}`);
              }
            }
          }
        } else {
          const errorMsg = response.data?.message || "Failed to fetch customer data";
          console.log("API error:", errorMsg);
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
        setLoading(false);
      }
    };

    if (customerid || customerId) {
      console.log("Fetching data for customer ID:", route.params?.customerid || customerId);
      fetchCustomerData();
    } else {
      console.log("No customer ID in route params");
    }
  }, [route.params]);

  const fullTotal = total + deliveryFee;


  
  const timeSlots = [
    { key: "Within 8-12 PM", value: "Within 8-12 PM" },
    { key: "Within 12-4 PM", value: "Within 12-4 PM" },
    { key: "Within 4-8 PM", value: "Within 4-8 PM" },
  ];

  useEffect(() => {
    if (previousSelectedDate) {
      setSelectedDate(previousSelectedDate);
      setIsDateSelected(true);
    }
    
    if (previousTimeSlot) {
      setSelectedTimeSlot(previousTimeSlot);
    }
  }, [previousSelectedDate, previousTimeSlot]);
  
  function processInitialData(originalItems: any[], orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      const orderData = orderItems[0];
      const processedItems: CartItem[] = [];
      return processedItems;
    } else if (originalItems && originalItems.length > 0) {
      return originalItems;
    }
    return [];
  }
  
  function calculateInitialTotal(originalTotal: number, orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      return orderItems[0].packageTotal || 0;
    }
    return originalTotal;
  }
  
  function calculateInitialSubtotal(originalSubtotal: number, orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      const total = orderItems[0].packageTotal || 0;
      const discount = orderItems[0].packageDiscount || 0;
      return total + discount;
    }
    return originalSubtotal;
  }
  
  function calculateInitialDiscount(originalDiscount: number, orderItems: any[]) {
    if (orderItems && orderItems.length > 0) {
      return orderItems[0].packageDiscount || 0;
    }
    return originalDiscount;
  }

  const handleScheduleDateSelection = () => {
    if (!isDateSelected) {
      setDate(minimumDate);
    }
    setShowDatePicker(true);
  };

  // const getSelectableDates = () => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
    
  //   const minDate = new Date(today);
  //   minDate.setDate(today.getDate() + 3);
    
  //   return { minDate };
  // };

  // const { minDate } = getSelectableDates();
  const getSelectableDates = () => {
  const today = new Date();
    const currentHour = today.getHours(); // Get the current hour before resetting to midnight
  
  console.log("current hour:", currentHour);
  today.setHours(0, 0, 0, 0); // Reset to midnight
  

  
  const minDate = new Date(today);
  
  // If the current time is between 6 PM and 6 AM
  if (currentHour >= 18 || currentHour < 6) {
    minDate.setDate(today.getDate() + 4); // Set the minimum date to 4 days from today
  } else {
    minDate.setDate(today.getDate() + 3); // Set the minimum date to 3 days from today
    console.log("hit")
  }

  return { minDate };
};

const { minDate } = getSelectableDates();


  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const selectedWithoutTime = new Date(selectedDate);
      selectedWithoutTime.setHours(0, 0, 0, 0);
      
      console.log(`Selected date: ${selectedWithoutTime.toDateString()}`);
      console.log(`Min date: ${minDate.toDateString()}`);
      console.log(`Is >= min: ${selectedWithoutTime >= minDate}`);
      
      if (selectedWithoutTime.getTime() >= minDate.getTime()) {
        setDate(selectedDate);
        
        const day = selectedDate.getDate();
        const month = selectedDate.toLocaleString('en-US', { month: 'short' });
        const year = selectedDate.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;
        
        setSelectedDate(formattedDate);
        setIsDateSelected(true);
      } else {
        const minDay = minDate.getDate();
        const minMonth = minDate.toLocaleString('en-US', { month: 'short' });
        
        Alert.alert(
          "Invalid Date", 
          `Please select a date between ${minDay} ${minMonth} (inclusive)`
        );
        
        setDate(minDate);
      }
    }
  };

  const handleIOSDateConfirm = () => {
    const dateWithoutTime = new Date(date);
    dateWithoutTime.setHours(0, 0, 0, 0);
    
    if (dateWithoutTime.getTime() >= minDate.getTime()) {
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;
      
      setSelectedDate(formattedDate);
      setIsDateSelected(true);
      setShowDatePicker(false);
    } else {
      const minDay = minDate.getDate();
      const minMonth = minDate.toLocaleString('en-US', { month: 'short' });
      
      Alert.alert(
        "Invalid Date", 
        `Please select a date between ${minDay} ${minMonth} (inclusive)`
      );
      
      setDate(minDate);
    }
  };
  
  const handleTimeSlotSelection = (val: string) => {
    if (val !== selectedTimeSlot) {
      setSelectedTimeSlot(val);
      console.log("Selected time slot:", val);
    }
  };
  
  // Helper function to convert time slot to 24-hour format
  const convertTimeSlotTo24Hour = (timeSlot: string): string => {
    switch (timeSlot) {
      case "Within 8-12 PM":
        return "10:00"; // Middle of the range
      case "Within 12-4 PM":
        return "14:00"; // Middle of the range
      case "Within 4-8 PM":
        return "18:00"; // Middle of the range
      default:
        return "12:00"; // Default fallback
    }
  };
  
//   const handleProceed = () => {
//     if (!selectedDate && !selectedTimeSlot) {
//       Alert.alert("Required", "Please select a delivery date & time slot");
//       return;
//     }
//     if (!selectedDate) {
//       Alert.alert("Required", "Please select a delivery date");
//       return;
//     }
  
//     if (!selectedTimeSlot) {
//       Alert.alert("Required", "Please select a time slot");
//       return;
//     }

//     // Convert selected time slot to 24-hour format
//     const scheduleTime = convertTimeSlotTo24Hour(selectedTimeSlot);
    
//     // Prepare the data to pass to SelectPaymentMethod
//     const packageId = orderItems && orderItems.length > 0 ? orderItems[0].packageId : 
//                      (orderData ? orderData.packageId : undefined);
    
//     const navigationParams = {
//       items: items,
//       subtotal: subtotal,
//       discount: discount,
//       total: total,
//       fullTotal: fullTotal,
//       selectedDate: selectedDate,
//       selectedTimeSlot: selectedTimeSlot,
//       customerId: customerId,
//       isPackage: isPackage,
//       packageId: packageId,
//       customerid: customerid,
//       orderItems: orderItems,
      
//       // Add the formatted schedule data
//       sheduleDate: selectedDate, // Using the same format as your requirement
//       sheduleTime: scheduleTime, // 24-hour format time
      
//       // Include orderData if it exists (for the first navigation flow)
//       ...(orderData && { orderData: orderData })
//     };
    
//     navigation.navigate("SelectPaymentMethod" as any, navigationParams);
    
//     console.log("Data passed to payment:", navigationParams);
//     console.log("Schedule Date:", selectedDate);
//     console.log("Schedule Time (24hr):", scheduleTime);
//     console.log("Time Slot:", selectedTimeSlot);
//   };
//   useEffect(() => {
//   console.log('Route params:', route.params);
// }, []);

const handleProceed = () => {
  if (!selectedDate && !selectedTimeSlot) {
    Alert.alert("Required", "Please select a delivery date & time slot");
    return;
  }
  if (!selectedDate) {
    Alert.alert("Required", "Please select a delivery date");
    return;
  }

  if (!selectedTimeSlot) {
    Alert.alert("Required", "Please select a time slot");
    return;
  }

  // Convert selected time slot to 24-hour format
  const scheduleTime = convertTimeSlotTo24Hour(selectedTimeSlot);
  
  // Get packageId from the correct source
  const packageId = route.params?.packageId || 
                   (orderItems && orderItems.length > 0 ? orderItems[0].packageId : 
                   (orderData ? orderData.packageId : undefined));
  
  // Prepare the data to pass to SelectPaymentMethod
  const navigationParams = {
    items: items,
    subtotal: subtotal,
    discount: discount,
    total: total,
    fullTotal: fullTotal,
    selectedDate: selectedDate,
    selectedTimeSlot: selectedTimeSlot,
    customerId: customerId,
    isPackage: isPackage,
    packageId: packageId, // Now correctly passing packageId
    customerid: customerid,
    orderItems: orderItems,
    
    // Add the formatted schedule data
    sheduleDate: selectedDate,
    sheduleTime: scheduleTime,
    
    // Include orderData if it exists
    ...(orderData && { orderData: orderData })
  };
  
  navigation.navigate("SelectPaymentMethod" as any, navigationParams);
  
  console.log("Data passed to payment:", navigationParams);
};


 if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#6C3CD1" />
        <Text className="mt-4 text-gray-600">Loading delivery information...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-[#6C3CD1] px-6 py-3 rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      style={{flex: 1}}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center  px-3 bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">Schedule</Text>
        </View>
        
        <View className="px-10 py-3">
          {/* Delivery Type Dropdown */}
          <Text className="text-[#000000] mb-2">Delivery Type</Text>
          <TouchableOpacity 
            className="flex-row items-center px-4 py-3 bg-gray-100 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-gray-700 font-semibold">One Time</Text>
          </TouchableOpacity>
        </View>
  
        <ScrollView 
          className="px-10 mt-[-5]" 
          keyboardShouldPersistTaps="handled"
        >
          {/* Schedule Date section */}
          <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
          <TouchableOpacity
            onPress={handleScheduleDateSelection}
            className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
          >
            <Text className="flex-1 text-[#7F7F7F]">
              {selectedDate || "Select Date"}
            </Text>
            <Image source={require("../assets/images/Calendar.webp")} className="w-8 h-8" resizeMode="contain" />
          </TouchableOpacity>
  
          <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>
  
          <SelectList
            key="time-slot-select"
            setSelected={handleTimeSlotSelection}
            data={timeSlots}
            save="value"
            placeholder="Select Time Slot"
            search={false}
            defaultOption={
              selectedTimeSlot 
                ? timeSlots.find(slot => slot.value === selectedTimeSlot) 
                : undefined
            }
            inputStyles={{
              color: "#7F7F7F",
            }}
            boxStyles={{
              backgroundColor: "#F6F6F6",
              padding: 12,
              borderRadius: 30,
              borderColor: "#F6F6F6",
              borderWidth: 5,
            }}
            dropdownStyles={{
              backgroundColor: "#F6F6F6",
              borderRadius: 10,
              borderColor: "#F6F6F6",
            }}
          />
        </ScrollView>
  
        {/* Date Picker (conditionally rendered) */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate} 
          />
        )}
  
        {Platform.OS === 'ios' && showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white p-4 rounded-t-2xl">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-[#6C3CD1]">Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Feather name="x" size={24} color="#6C3CD1" />
                  </TouchableOpacity>
                </View>
                
                        <DateTimePicker
                        value={date}
                        mode="date"
                        display="inline"
                        style={{ width: 320, height: 260 }}
                        minimumDate={minimumDate}
                        onChange={handleDateChange}
                      />
                
                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="px-4 py-2"
                  >
                    <Text className="text-[#6C3CD1] font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleIOSDateConfirm}
                    className="px-4 py-2"
                  >
                    <Text className="text-[#6C3CD1] font-semibold">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
   
        <View
          className="bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
            marginTop: -10,
          }}
        >
          <View className="flex-1">
            <View className="flex-row justify-between">
              <Text className="text-[#5C5C5C]">Delivery Fee :</Text>
               <Text className="font-semibold text-[#5C5C5C]">
        + Rs.{deliveryFee.toFixed(2)}
      </Text>
            </View>
            
            <View className="flex-row justify-between mt-2">
              <Text className="font-semibold text-lg">Full Total :</Text>
              <Text className="font-bold text-lg">
                Rs.{fullTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
  
          <TouchableOpacity onPress={handleProceed}>
            <LinearGradient 
              colors={["#854BDA", "#6E3DD1"]} 
              className="py-3 px-6 rounded-full flex-row items-center ml-4"
            >
              <Text className="text-white font-semibold mr-2">Proceed</Text>
              <Image
                source={require("../assets/images/Done.webp")}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ScheduleScreen;