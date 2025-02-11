import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView ,Image} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { Feather } from "@expo/vector-icons";
import BackButton from "./BackButton";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient"; // Gradient background

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScheduleScreen">;
type ScheduleScreenRouteProp = RouteProp<RootStackParamList, "ScheduleScreen">; // ✅ Add this

interface ScheduleScreenProps {
    navigation: ScheduleScreenNavigationProp;
    route: ScheduleScreenRouteProp; // ✅ Include the route prop
  }

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation, route }) => {
    const { totalPrice } = route.params;
  const [deliveryType, setDeliveryType] = useState("One Time");

  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]); 
const [selectedDate, setSelectedDate] = useState<string | null>(null);


  const [isDateSelected, setIsDateSelected] = useState(false); // Track if date is selected

  const deliveryOptions = [
    { key: "one_time", value: "One Time" },
    { key: "twice_week", value: "Twice a Week" },
    { key: "weekly", value: "Weekly" },
  ];

  const timeSlots = [
    { key: "morning", value: "Morning" },
    { key: "afternoon", value: "Afternoon" },
    { key: "evening", value: "Evening" },
  ];

  const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const toggleDaySelection = (day: string) => {
    setSelectedDays((prevSelectedDays) => {
      let updatedDays = [...prevSelectedDays];
  
      if (deliveryType === "weekly") {
        updatedDays = [day]; // ✅ Only one selection for Weekly
      } else if (deliveryType === "twice_week") {
        if (updatedDays.includes(day)) {
          updatedDays = updatedDays.filter((d) => d !== day); // ✅ Remove if already selected
        } else if (updatedDays.length < 2) {
          updatedDays.push(day); // ✅ Allow selecting up to two days
        } else {
          return prevSelectedDays; // ✅ Do not add more than 2
        }
      } else {
        updatedDays = [day]; // ✅ Only one selection for One Time
      }
  
      return updatedDays;
    });
  };
  
  
  
  
  
  
  const handleDateSelection = () => {
    setIsDateSelected(true);
  };
  

  return (
    <View className="flex-1 bg-white">
     
        {/* Header */}
        <View className="flex-row items-center shadow-md px-3 bg-white">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-8">Schedule</Text>
        </View>
  <View className="px-10 py-3">

        {/* Delivery Type Dropdown */}
        <Text className="text-[#000000] mb-2">Delivery Type</Text>
        <SelectList
  setSelected={(val: string) => {
    setDeliveryType(val);
    setSelectedDays([]); // ✅ Reset selected days when delivery type changes
  }}
  data={deliveryOptions}
  defaultOption={{ key: "one_time", value: "One Time" }}
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
  inputStyles={{
    color: deliveryType ? "#000000" : "#808080", // ✅ Black when selected, Gray when placeholder
  }}
  placeholder="Select Delivery Type"
/>


</View>
<View className="border-b border-[#F3F4F6] w-full my-4 mt-2 mb-2" />



<ScrollView className="px-10 mt-[-5]">


        {/* Conditionally render Schedule Date section */}
        {!isDateSelected && !selectedDate && (
          <>
            <Text className="text-[#000000] mt-4 mb-2">Schedule Date</Text>
            <TouchableOpacity
              onPress={handleDateSelection} // Update date on click
              className="flex-row items-center bg-[#F6F6F6] p-3 rounded-full"
            >
              <Text className="flex-1 text-[#7F7F7F]">{selectedDate || "Select Date"}</Text>
              {/* <Feather name="calendar" size={20} color="gray" /> */}
                 <Image source={require("../assets/images/Calendar.png")} className="w-8 h-8" resizeMode="contain" />

            </TouchableOpacity>
          </>
        )}

        {/* Conditionally render Select Day block only if calendar is clicked */}
        {isDateSelected && (
  <>
    <Text className="text-[#000000] mt-4 mb-2 text-center">
      {deliveryType === "twice_week" ? "Select 2 days" : "Select a day"}
    </Text>
    
    <View className="flex-row flex-wrap justify-center px-4">
      {weekdays.map((day) => (
        <TouchableOpacity
          key={day}
          onPress={() => toggleDaySelection(day)}
          className={`w-[44px] h-[44px] m- rounded-lg border flex items-center justify-center mx-1 my-1
            ${selectedDays.includes(day)
              ? "bg-[#EAE1FF] border-[#6839CF] shadow-md" // ✅ Selected style
              : "bg-white border-[#A3A3A3] shadow-sm"} 
            ${deliveryType === "twice_week" && selectedDays.length === 2 && !selectedDays.includes(day)
              ? "bg-white border-[#A3A3A3] shadow-sm" // ✅ Slightly faded unselected buttons when 2 are chosen
              : ""}`} 
        >
          <Text className={selectedDays.includes(day) ? "text-[#6C3CD1] font-bold" : "text-[#808080] font-medium"}>
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
)}




        {/* Time Slot Dropdown */}
        <Text className="text-[#000000] mt-4 mb-2">Schedule Time Slot</Text>
        <SelectList
  setSelected={(val: string) => setSelectedTimeSlot(val)}
  data={timeSlots}
  placeholder="Select Time Slot" // ✅ Placeholder text
  inputStyles={{
    color: "#7F7F7F", // ✅ Set placeholder text color
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

      {/* Confirm Button */}
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
        <Text className="text-lg font-semibold text-gray-800">Total : 
            
        <Text className="text-lg font-semibold text-[#5C5C5C]"> Rs.{totalPrice.toFixed(2)}</Text></Text>

         <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-6 rounded-full flex-row ">
        
        <TouchableOpacity className="flex-row "
        onPress={() => navigation.navigate("SelectPaymentMethod")}
        >
  <Text className="text-white font-semibold mr-1">Proceed</Text>
  <Image 
    source={require("../assets/images/Done.png")} 
    className="w-5 h-5" // ✅ Adjusted size
    resizeMode="contain" 
  />
</TouchableOpacity>
</LinearGradient>

      </View>
    </View>
  );
};

export default ScheduleScreen;
