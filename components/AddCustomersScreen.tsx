import React, { useState,useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity,Keyboard,Platform, KeyboardAvoidingView,SafeAreaView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { AntDesign } from "@expo/vector-icons"; 
import { Picker } from "@react-native-picker/picker";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import BackButton from "./BackButton";

type AddCustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddCustomersScreen">;

interface AddCustomersScreenProps {
  navigation: AddCustomersScreenNavigationProp;
}

const AddCustomersScreen: React.FC<AddCustomersScreenProps> = ({ navigation }) => {
  const [buildingType, setBuildingType] = useState<string>("");
   const [selectedCategory, setSelectedCategory] = useState<string>("");

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];
   const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    
      useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
          setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
          setKeyboardVisible(false)
        );
    
        return () => {
          keyboardDidShowListener.remove();
          keyboardDidHideListener.remove();
        };
      }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
   
     <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1 bg-white"
            >
    <View className="flex-1 bg-white  py-4 p-2">
   
      {/* Header */}
      <View className="p-[-4]">
      <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
        {/* Back Button */}
        <BackButton navigation={navigation} />
        {/* Title */}
        <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
          New Customer Registration
        </Text>
      </View>
      </View>
      <ScrollView 
       style = {{ paddingHorizontal: wp(1)}}
      >
      <View className="p-3 px-6">
     
      <View className="mb-4 mt-4 flex-row justify-between">

  <View className="flex-[1] ">
    <Text className="text-gray-700 mb-1">Title</Text>
    <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full  py-2 mt-1  justify-center justifyContent-flex-end">
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        mode="dropdown"
        style={{
          height: 20, // Adjust height for better dropdown display
          width: "100%",
          color: "black",
        
      
        }}
        dropdownIconColor="#333"
        
      >
        <Picker.Item label="Title" value="" style={{ fontSize: 8 , paddingRight:-4}} />
        <Picker.Item label="Mr" value="Mr" style={{ fontSize: 8 , paddingRight:-4 }} />
        <Picker.Item label="Ms" value="Ms" style={{ fontSize: 8 , paddingRight:-4 }} />
       
      </Picker>
    </View>
  </View>

  {/* First Name Input (2/3 Width) */}
  <View className="flex-[2] ml-2">
    <Text className="text-gray-700 mb-1">First Name</Text>
    <TextInput
      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
      placeholder="First Name"
    />
  </View>
</View>

  
      {/* Last Name */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Last Name</Text>
        <TextInput
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
          placeholder="Last Name"
        />
      </View>
  
      {/* Phone Number */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Phone Number</Text>
        <TextInput
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
          placeholder="ex: 077 XXXXXXX"
          keyboardType="phone-pad"
        />
      </View>
  
      {/* Email */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Email Address</Text>
        <TextInput
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
          placeholder="Email Address"
          keyboardType="email-address"
        />
      </View>
  
      {/* Building Type Dropdown */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Building Type</Text>
        <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-2 mt-1 items-center justify-center">
        <Picker
    selectedValue={buildingType}
    onValueChange={(itemValue) => setBuildingType(itemValue)}
    style={{
    height: 25, // Increased height for better spacing
    width: "100%", // Ensure full width usage
 
  }}
>
  {/* Default Placeholder Item */}
  <Picker.Item label="Select Building Type" value="" color="#999" style={{fontSize:14}}/>

  {/* Dynamic Options */}
  {buildingOptions.map((option) => (
    <Picker.Item key={option.key} label={option.value} value={option.value} />
  ))}
</Picker>

          </View>
      </View>
  
      {/* Conditionally Render Fields Based on Building Type */}
      {buildingType === "House" && (
        <>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Building / House No</Text>
            <TextInput
             className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Building / House No (e.g., 14/B)"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Street Name</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Street Name"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">City</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="City"
            />
          </View>
        </>
      )}
  
      {buildingType === "Apartment" && (
        <>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Apartment / Building Name</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Apartment / Building Name"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Flat / Unit Number</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Flat / Unit Number"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Floor Number</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Floor Number"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">House No</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="House No"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">Street Name</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="Street Name"
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-700 mb-1">City</Text>
            <TextInput
              className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10 "
              placeholder="City"
            />
          </View>
        </>
      )}

</View>
  
      {/* Register Button */}
      
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-4 rounded-lg items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15">
             <TouchableOpacity 
             onPress={() => navigation.navigate("OtpScreen")}
             >
        <Text className="text-center text-white font-bold ">Register</Text>
      </TouchableOpacity>
            </LinearGradient>
     
    </ScrollView>
    </View>
   
    </KeyboardAvoidingView>
    
    
   
  
    {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </SafeAreaView>

  );
};

export default AddCustomersScreen;
