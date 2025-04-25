import React, {  useState } from "react";
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

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">;

interface AdditionalItem {
  discount: number;
  mpItemId: number;
  unitType: string;
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
      customerid?: string;
      
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
    isCustomPackage = "", 
    isSelectPackage = "",
    customerid = "",
    orderItems = []
  } = route.params || {};

  const [items, setItems] = useState<CartItem[]>(() => {
    return processInitialData(originalItems, orderItems);
  });
  
  const [total, setTotal] = useState(() => calculateInitialTotal(originalTotal, orderItems));
  const [subtotal, setSubtotal] = useState(() => calculateInitialSubtotal(originalSubtotal, orderItems));
  const [discount, setDiscount] = useState(() => calculateInitialDiscount(originalDiscount, orderItems));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
  // Calculate minimum date (2 days from today)
  const getMinimumSelectableDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2); // Add 2 days to current date
    return minDate;
  };

  // Set minimum date for selection
  const minimumDate = getMinimumSelectableDate();

  const DELIVERY_FEE = 350;
  const fullTotal = total + DELIVERY_FEE;
  
  const timeSlots = [
    { key: "Within 8-12 AM", value: "Within 8-12 AM" },
    { key: "Within 12-4 PM", value: "Within 12-4 PM" },
    { key: "Within 4-8 PM", value: "Within 4-8 PM" },
  ];
  
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
    // Initialize date picker with minimum date if not already selected
    if (!isDateSelected) {
      setDate(minimumDate);
    }
    setShowDatePicker(true);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      // Validate selected date is at least 2 days from today
      const today = new Date();
      const minSelectableDate = new Date(today);
      minSelectableDate.setDate(today.getDate() + 2);
      
      if (selectedDate >= minSelectableDate) {
        setDate(selectedDate);
        
        const day = selectedDate.getDate();
        const month = selectedDate.toLocaleString('en-US', { month: 'short' });
        const year = selectedDate.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;
        
        setSelectedDate(formattedDate);
        setIsDateSelected(true);
      } else {
        // Alert user if they somehow selected an invalid date
        Alert.alert(
          "Invalid Date", 
          "Please select a date at least 2 days from today."
        );
        
        // Reset to minimum date
        setDate(minimumDate);
      }
    }
  };
  
  const handleIOSDateConfirm = () => {
    // Validate selected date is at least 2 days from today for iOS
    const today = new Date();
    const minSelectableDate = new Date(today);
    minSelectableDate.setDate(today.getDate() + 2);
    
    if (date >= minSelectableDate) {
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;
      
      setSelectedDate(formattedDate);
      setIsDateSelected(true);
      setShowDatePicker(false);
    } else {
      Alert.alert(
        "Invalid Date", 
        "Please select a date at least 2 days from today."
      );
      
      // Reset to minimum date
      setDate(minimumDate);
    }
  };
  
  const handleTimeSlotSelection = (val: string) => {
    if (val !== selectedTimeSlot) {
      setSelectedTimeSlot(val);
      console.log("Selected time slot:", val);
    }
  };
  
  const handleProceed = () => {

    if (!selectedDate && !selectedTimeSlot ) {
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
      packageId: packageId,
      customerid: customerid,
      orderItems: orderItems
    });
    
    console.log("Data passed to payment:", {
      items, subtotal, discount, total, fullTotal, selectedDate, selectedTimeSlot, customerId,
      isSelectPackage, isCustomPackage, packageId
    });
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
            <Image source={require("../assets/images/Calendar.png")} className="w-8 h-8" resizeMode="contain" />
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
            minimumDate={minimumDate} // Set minimum date to 2 days from today
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
                  onChange={handleDateChange}
                  minimumDate={minimumDate} // Set minimum date to 2 days from today
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
              <Text className="font-semibold text-[#5C5C5C]">+ Rs.{DELIVERY_FEE.toFixed(2)}</Text>
            </View>
            
            {/* <View className="flex-row justify-between mt-2">
              <Text className="font-semibold text-lg">Full Total</Text>
              <Text className="font-bold text-lg">Rs.{fullTotal.toFixed(2)}</Text>
            </View> */}
            <View className="flex-row justify-between mt-2">
  <Text className="font-semibold text-lg">Full Total :</Text>
  <Text className="font-bold text-lg">
    Rs. {fullTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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