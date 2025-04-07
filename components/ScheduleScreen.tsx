// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, ScrollView ,Image, KeyboardAvoidingView, Platform} from "react-native";
// import { SelectList } from "react-native-dropdown-select-list";
// import { Feather } from "@expo/vector-icons";
// import BackButton from "./BackButton";
// import { RouteProp } from "@react-navigation/native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "./types";
// import { Ionicons } from "@expo/vector-icons";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import { LinearGradient } from "expo-linear-gradient"; // Gradient background

// type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
// type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">; // ✅ Add this

// interface ScheduleScreenProps {
//     navigation: ScheduleScreenNavigationProp;
//     route: ScheduleScreenRouteProp; // ✅ Include the route prop
//   }

// const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation, route }) => {
//     const { totalPrice } = route.params;
//   const [deliveryType, setDeliveryType] = useState("One Time");

//   const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
//   const [selectedDays, setSelectedDays] = useState<string[]>([]); 
// const [selectedDate, setSelectedDate] = useState<string | null>(null);
// const [selectedMonth, setSelectedMonth] = useState("");
//   const [selectedWeek, setSelectedWeek] = useState("");


//   const [isDateSelected, setIsDateSelected] = useState(false); // Track if date is selected

//   const deliveryOptions = [
//     { key: "one_time", value: "One Time" },
//     { key: "twice_week", value: "Twice a Week" },
//     { key: "weekly", value: "Weekly" },
//   ];

//   const timeSlots = [
//     { key: "morning", value: "Withing 8-12 AM" },
//     { key: "afternoon", value: "Withing 12-4 PM" },
//     { key: "evening", value: "Withing 4-8 PM" },
//   ];

//   const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

//   const months = [
//     { key: "1", value: "January" },
//     { key: "2", value: "February" },
//     { key: "3", value: "March" },
//     { key: "4", value: "April" },
//     // Add more months as needed
//   ];

//   const weeks = [
//     { key: "1", value: "Week 1" },
//     { key: "2", value: "Week 2" },
//     { key: "3", value: "Week 3" },
//     { key: "4", value: "Week 4" },
//   ];

//   const toggleDaySelection = (day: string) => {
//     setSelectedDays((prevSelectedDays) => {
//       let updatedDays = [...prevSelectedDays];
  
//       if (deliveryType === "weekly") {
//         updatedDays = [day]; // ✅ Only one selection for Weekly
//       } else if (deliveryType === "twice_week") {
//         if (updatedDays.includes(day)) {
//           updatedDays = updatedDays.filter((d) => d !== day); // ✅ Remove if already selected
//         } else if (updatedDays.length < 2) {
//           updatedDays.push(day); // ✅ Allow selecting up to two days
//         } else {
//           return prevSelectedDays; // ✅ Do not add more than 2
//         }
//       } else {
//         updatedDays = [day]; // ✅ Only one selection for One Time
//       }
  
//       return updatedDays;
//     });
//   };
  
  
  
  
  
  
//   const handleDateSelection = () => {
//     setIsDateSelected(true);
//   };
  

//   return (
//      <KeyboardAvoidingView 
//             behavior={Platform.OS === "ios" ? "padding" : "height"}
//             enabled 
//             className="flex-1"
//             >
//     <View className="flex-1 bg-white">
     
//         {/* Header */}
//         <View className="flex-row items-center shadow-md px-3 bg-white">
//           <BackButton navigation={navigation} />
//           <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">Schedule</Text>
//         </View>
//   <View className="px-10 py-3">

//         {/* Delivery Type Dropdown */}
//         <Text className="text-[#000000] mb-2">Delivery Type</Text>
//         <SelectList
//   setSelected={(val: string) => {
//     setDeliveryType(val);
//     setSelectedDays([]); // ✅ Reset selected days when delivery type changes
//   }}
//   data={deliveryOptions}
//   defaultOption={{ key: "one_time", value: "One Time" }}
//   boxStyles={{
//     backgroundColor: "#F6F6F6",
//     padding: 12,
//     borderRadius: 30,
//     borderColor: "#F6F6F6",
//     borderWidth: 5,
//   }}
//   dropdownStyles={{
//     backgroundColor: "#F6F6F6",
//     borderRadius: 10,
//     borderColor: "#F6F6F6",
//   }}
//   inputStyles={{
//     color: deliveryType ? "#000000" : "#808080", // ✅ Black when selected, Gray when placeholder
//   }}
//   placeholder="Select Delivery Type"
// />


// </View>
// <View className="border-b border-[#F3F4F6] w-full my-4 mt-2 mb-2" />



// <ScrollView className="px-10 mt-[-5]" 
// keyboardShouldPersistTaps="handled"
// >


//       <Text className="text-black mb-2">Valid Period</Text>
//       <View className="flex-row items-center space-x-2">
//         {/* Month Selector */}
//         <SelectList
//   setSelected={(val: string) => setSelectedMonth(val)} 
//   data={months}
//   placeholder="Select Month"
//   boxStyles={{
//     borderColor: "#F6F6F6",
//     backgroundColor: "#F6F6F6",
//     borderRadius: 40,
//     padding: 10,
//     width: 130,
//   }}
// />

//         <Text className="text-lg ml-5">+</Text>

//         {/* Week Selector */}
//         <SelectList
//   setSelected={(val: string) => setSelectedWeek(val)} 
//   data={weeks}
//   placeholder="Select Week"
//   boxStyles={{
//     borderColor: "#F6F6F6",
//     backgroundColor: "#F6F6F6",
//     borderRadius: 40,
//     padding: 10,
//     width: 130,
//     marginLeft:5,
//   }}
// />
//       </View>




//         {/* Conditionally render Schedule Date section */}
//         {!isDateSelected && !selectedDate && (
//           <>
//             <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
//             <TouchableOpacity
//               onPress={handleDateSelection} // Update date on click
//               className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
//             >
//               <Text className="flex-1 text-[#7F7F7F]">{selectedDate || "Select Date"}</Text>
//               {/* <Feather name="calendar" size={20} color="gray" /> */}
//                  <Image source={require("../assets/images/Calendar.png")} className="w-8 h-8" resizeMode="contain" />

//             </TouchableOpacity>
//           </>
//         )}

//         {/* Conditionally render Select Day block only if calendar is clicked */}
//         {isDateSelected && (
//   <>
//     <Text className="text-[#000000] mt-4 mb-2 text-center">
//       {deliveryType === "twice_week" ? "Select 2 days" : "Select a day"}
//     </Text>
    
//     <View className="flex-row flex-wrap justify-center px-4">
//       {weekdays.map((day) => (
//         <TouchableOpacity
//           key={day}
//           onPress={() => toggleDaySelection(day)}
//           className={`w-[44px] h-[44px] m- rounded-lg border flex items-center justify-center mx-1 my-1
//             ${selectedDays.includes(day)
//               ? "bg-[#EAE1FF] border-[#6839CF] shadow-md" // ✅ Selected style
//               : "bg-white border-[#A3A3A3] shadow-sm"} 
//             ${deliveryType === "twice_week" && selectedDays.length === 2 && !selectedDays.includes(day)
//               ? "bg-white border-[#A3A3A3] shadow-sm" // ✅ Slightly faded unselected buttons when 2 are chosen
//               : ""}`} 
//         >
//           <Text className={selectedDays.includes(day) ? "text-[#6C3CD1] font-bold" : "text-[#808080] font-medium"}>
//             {day}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   </>
// )}




//         {/* Time Slot Dropdown */}
//         <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>
//         <SelectList
//   setSelected={(val: string) => setSelectedTimeSlot(val)}
//   data={timeSlots}
//   placeholder="Select Time Slot" // ✅ Placeholder text
//   inputStyles={{
//     color: "#7F7F7F", // ✅ Set placeholder text color
//   }}
//   boxStyles={{
//     backgroundColor: "#F6F6F6",
//     padding: 12,
//     borderRadius: 30,
//     borderColor: "#F6F6F6",
//     borderWidth: 5,
//   }}
//   dropdownStyles={{
//     backgroundColor: "#F6F6F6",
//     borderRadius: 10,
//     borderColor: "#F6F6F6",
//   }}
// />

//       </ScrollView>

//       {/* Confirm Button */}
//       <View
//         className="bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg"
//         style={{
//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: -4 },
//           shadowOpacity: 0.2,
//           shadowRadius: 8,
//           elevation: 10,
//           marginTop: -10,
//         }}
//       >
//         <Text className="text-lg font-semibold text-gray-800">Total : 
            
//         <Text className="text-lg font-semibold text-[#5C5C5C]"> Rs.{totalPrice.toFixed(2)}</Text></Text>

//          <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-6 rounded-full flex-row ">
        
//         <TouchableOpacity className="flex-row "
//         onPress={() => navigation.navigate("SelectPaymentMethod")}
//         >
//   <Text className="text-white font-semibold mr-1">Proceed</Text>
//   <Image 
//     source={require("../assets/images/Done.png")} 
//     className="w-5 h-5" // ✅ Adjusted size
//     resizeMode="contain" 
//   />
// </TouchableOpacity>
// </LinearGradient>

//       </View>
//     </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default ScheduleScreen;


import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, Alert } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { Feather } from "@expo/vector-icons";
import BackButton from "./BackButton";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker'; // Using the official DateTimePicker

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  price: number;
  quantity: number;
}


interface ScheduleScreenProps {
  navigation: ScheduleScreenNavigationProp;
  route: {
    params: {
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
      isCustomPackage?: string;
      isSelectPackage?: string;
      customerid?: string; // Add customerid at the top level of params
      
      orderItems?: Array<{
        additionalItems?: Array<AdditionalItem>;
        isAdditionalItems: boolean;
        customerid?: string; // Keep this too if needed in orderItems
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
  // Extract data from both possible parameter structures
  const {
    // Original structure
    total: originalTotal = 0,
    subtotal: originalSubtotal = 0,
    discount: originalDiscount = 0,
    items: originalItems = [],
    id: customerId = "",
    isCustomPackage = "", 
    isSelectPackage = "",
    customerid = "",
    // New structure
    orderItems = []
  } = route.params;

  // Calculate totals based on which data structure is provided
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
 // const { customerid } = route.params || {};
  
  // State for scheduling
  const [deliveryType, setDeliveryType] = useState("One Time");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [isDateSelected, setIsDateSelected] = useState(false);
 // const customerid = orderItems?.[0]?.customerid || "";
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  

  console.log("._____________________",customerid )

  // Process the data based on what's available
  useEffect(() => {
    // Only process data if it hasn't been processed yet or if dependencies change significantly
    // This prevents continuous re-rendering
    const shouldProcessData = 
      (orderItems && orderItems.length > 0 && items.length === 0) || 
      (originalItems && originalItems.length > 0 && items.length === 0);
    
    if (!shouldProcessData) {
      return; // Skip processing if data is already processed
    }
    
    if (orderItems && orderItems.length > 0) {
      // Process new order items structure
      const orderData = orderItems[0]; // Assuming the first item in array
      
      // Create a unified item structure from the order data
      const processedItems: CartItem[] = [];
      
      // Process modified plus items
      if (orderData.modifiedPlusItems && orderData.modifiedPlusItems.length > 0) {
        orderData.modifiedPlusItems.forEach(item => {
          processedItems.push({
            id: item.packageDetailsId,
            
            name: `Modified Plus Item ${item.packageDetailsId}`,
            price: parseFloat(item.originalPrice) + item.additionalPrice,
            normalPrice: parseFloat(item.originalPrice),
            discountedPrice: parseFloat(item.originalPrice) + item.additionalPrice - item.additionalDiscount,
            quantity: item.originalQuantity + item.modifiedQuantity,
            selected: true,
            unitType: "",
            startValue: item.originalQuantity,
            changeby: item.modifiedQuantity,
            discount: item.additionalDiscount,
            
          });
        });
      }
      
      // Process modified min items
      if (orderData.modifiedMinItems && orderData.modifiedMinItems.length > 0) {
        orderData.modifiedMinItems.forEach(item => {
          processedItems.push({
            id: item.packageDetailsId,
            name: `Modified Min Item ${item.packageDetailsId}`,
            price: parseFloat(item.originalPrice) - item.additionalPrice,
            normalPrice: parseFloat(item.originalPrice),
            discountedPrice: parseFloat(item.originalPrice) - item.additionalPrice + item.additionalDiscount,
            quantity: item.originalQuantity - item.modifiedQuantity,
            selected: true,
            unitType: "",
           
            startValue: item.originalQuantity,
            changeby: -item.modifiedQuantity,
            discount: item.additionalDiscount
          });
        });
      }
      
      // Process additional items
      if (orderData.additionalItems && orderData.additionalItems.length > 0) {
        // Make sure we're handling the correct structure
        orderData.additionalItems.forEach((item: any) => {
          processedItems.push({
            id: item.mpItemId,
            name: `Additional Item ${item.mpItemId}`,
            price: item.price,
            normalPrice: item.price,
            discountedPrice: item.price - item.discount,
            quantity: item.quantity,
            selected: true,
            unitType: "",
            startValue: 0,
            changeby: item.quantity,
            discount: item.discount
          });
        });
      }
      
      // Set state in a batch to prevent multiple renders
      const newTotal = orderData.packageTotal || 0;
      const newDiscount = orderData.packageDiscount || 0;
      const newSubtotal = newTotal + newDiscount;
      
      setItems(processedItems);
      setTotal(newTotal);
      setSubtotal(newSubtotal);
      setDiscount(newDiscount);
      
    } else if (originalItems && originalItems.length > 0) {
      // Use original structure
      setItems(originalItems);
      setTotal(originalTotal);
      setSubtotal(originalSubtotal);
      setDiscount(originalDiscount);
    }
  }, [orderItems, originalItems]);



  const DELIVERY_FEE = 350;
  const fullTotal = total + DELIVERY_FEE;

  const timeSlots = [
    { key: "Withing 8-12 AM", value: "Withing 8-12 AM" },
    { key: "Withing 12-4 PM", value: "Withing 12-4 PM" },
    { key: "Withing 4-8 PM", value: "Withing 4-8 PM" },
  ];

  console.log("Current selected time slot:", selectedTimeSlot);
  console.log("Current items:", items);
  console.log("Current total:", total);

  const toggleDaySelection = (day: string) => {
    setSelectedDays((prevSelectedDays) => {
      let updatedDays = [...prevSelectedDays];
  
      if (deliveryType === "weekly") {
        updatedDays = [day]; // Only one selection for Weekly
      } else if (deliveryType === "twice_week") {
        if (updatedDays.includes(day)) {
          updatedDays = updatedDays.filter((d) => d !== day); // Remove if already selected
        } else if (updatedDays.length < 2) {
          updatedDays.push(day); // Allow selecting up to two days
        } else {
          return prevSelectedDays; // Do not add more than 2
        }
      } else {
        updatedDays = [day]; // Only one selection for One Time
      }
  
      return updatedDays;
    });
  };
  
  // Show date picker
  const handleDateSelection = () => {
    setShowDatePicker(true);
  };
  
  const handleConfirm = () => {
    // Validate required fields
    if (!selectedDate) {
      Alert.alert("Required", "Please select a delivery date");
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert("Required", "Please select a time slot");
      return;
    }

    if (items.length > 0) {
      // Include packageId if available from orderItems
      const packageId = orderItems && orderItems.length > 0 ? orderItems[0].packageId : undefined;
      
      navigation.navigate("SelectPaymentMethod" as any, {
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: total,
        fullTotal: fullTotal,
        selectedDate: selectedDate,
        selectedTimeSlot: selectedTimeSlot,
        customerId: customerId,
        isSelectPackage: isSelectPackage,
        isCustomPackage: isCustomPackage,
        packageId: packageId, // Pass package ID if available
        customerid:customerid,
        // Pass additional data as needed
        orderItems: orderItems // Optional: Pass the original orderItems if needed downstream
      });
      console.log("Data passed to payment:", {
        items, subtotal, discount, total, fullTotal, selectedDate, selectedTimeSlot, customerId,
        isSelectPackage, isCustomPackage, packageId
      });
    } else {
      Alert.alert("Error", "Please select at least one item");
    }
  };
  
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); 
    
    if (selectedDate) {
      setDate(selectedDate);
      
      const day = selectedDate.getDate();
      const month = selectedDate.toLocaleString('en-US', { month: 'short' });
      const year = selectedDate.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;
      
      setSelectedDate(formattedDate);
      setIsDateSelected(true);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center shadow-md px-3 bg-white">
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
            <Text className="text-gray-700">{deliveryType}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="px-10 mt-[-5]" 
          keyboardShouldPersistTaps="handled"
        >
          {/* Schedule Date section */}
          <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
          <TouchableOpacity
            onPress={handleDateSelection}
            className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
          >
            <Text className="flex-1 text-[#7F7F7F]">{selectedDate || "Select Date"}</Text>
            <Image source={require("../assets/images/Calendar.png")} className="w-8 h-8" resizeMode="contain" />
          </TouchableOpacity>

          <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>

<SelectList
  key="time-slot-select"
  setSelected={(val: string) => {
    if (val !== selectedTimeSlot) {
      setSelectedTimeSlot(val);
    }
  }}
  data={timeSlots}
  save="value"
  placeholder="Select Time Slot"
  search={false}
  defaultOption={
    selectedTimeSlot 
      ? timeSlots.find(slot => slot.value === selectedTimeSlot) 
      : undefined // Use undefined instead of null
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
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()} 
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
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  style={{ height: 200, marginTop: -10 }}
                />
                
                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="px-4 py-2"
                  >
                    <Text className="text-[#6C3CD1] font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      const day = date.getDate();
                      const month = date.toLocaleString('en-US', { month: 'short' });
                      const year = date.getFullYear();
                      const formattedDate = `${day} ${month} ${year}`;
                      
                      setSelectedDate(formattedDate);
                      setIsDateSelected(true);
                      setShowDatePicker(false);
                    }}
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
              <Text className="text-gray-500">Delivery Fee</Text>
              <Text className="font-medium">+ Rs.350.00</Text>
            </View>
            
            <View className="flex-row justify-between mt-2">
              <Text className="font-semibold text-lg">Full Total</Text>
              <Text className="font-bold text-lg">Rs.{fullTotal.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleConfirm}>
            <LinearGradient 
              colors={["#854BDA", "#6E3DD1"]} 
              className="py-3 px-6 rounded-full flex-row items-center ml-4"
            >
              <Text className="text-white font-semibold mr-2">Proceed</Text>
              <Image
                source={require("../assets/images/Done.png")}
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