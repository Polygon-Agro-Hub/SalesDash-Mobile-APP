import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from 'react-native-dropdown-picker';
import { SelectList } from "react-native-dropdown-select-list";

type AddCustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddCustomersScreen">;

interface AddCustomersScreenProps {
  navigation: AddCustomersScreenNavigationProp;
}

const AddCustomersScreen: React.FC<AddCustomersScreenProps> = ({ navigation }) => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [houseNo, setHouseNo] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [buildingNo, setbuildingNo] = useState<string>("");
  const [floorNo, setfloorNo] = useState<string>("");
  const [unitNo, setunitNo] = useState<string>("");
  const [buildingName, setbuildingName] = useState<string>("");
  const [buildingType, setBuildingType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

 
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);


  

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];

  const handleRegister = async () => {
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
  
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
  
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
  
    try {
      // ✅ Step 1: Check for duplicate phone number or email in the backend
      const checkResponse = await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
        phoneNumber,
        email,
      });
  
      if (checkResponse.status === 400) {
        Alert.alert("Error", "Phone number or email already exists.");
        return;
      }
  
      // ✅ Step 2: Store customer data locally
      const customerData = {
        title: selectedCategory,
        firstName,
        lastName,
        phoneNumber,
        email,
        buildingType,
        houseNo,
        streetName,
        city,
        buildingNo,
        floorNo,
        unitNo,
        buildingName,
      };
      await AsyncStorage.setItem("pendingCustomerData", JSON.stringify(customerData));
  
      // ✅ Step 3: Generate or retrieve the customer ID (you can change this logic based on your requirements)
      const id = new Date().getTime().toString(); // Example: Using timestamp as the customer ID
  
      // ✅ Step 4: Send OTP and navigate to OTP screen
      await sendOTP();
      navigation.navigate("OtpScreen", { phoneNumber, id });
  
    } catch (error: any) {
      console.log("Error checking customer:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
  
  
  

  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }
    console.log("----check----",phoneNumber)
  
    try {
      setLoading(true);
  
      // Clean phone number, removing any non-numeric characters if needed
      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
  
      const apiUrl = "https://api.getshoutout.com/otpservice/send";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };
  
      const body = {
        source: "ShoutDEMO", // Ensure this is a valid source
        transport: "sms",    // Ensure the transport method is correct
        content: {
          sms: "Your code is {{code}}",  // OTP content message
        },
        destination: cleanedPhoneNumber, // Use the cleaned phone number
      };
  
      console.log("Request body:", body); // Log the request body
  
      const response = await axios.post(apiUrl, body, { headers });
  
      console.log("API response:", response.data); // Log full API response
  
      // Save the referenceId for future tracking
      await AsyncStorage.setItem("referenceId", response.data.referenceId);
  
      // Handle success response
      if (response.status === 200) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully.');
      } else {
        Alert.alert('Error', 'Failed to send OTP.');
      }
    } catch (error) {
      // Log the error response details for debugging
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', error.response ? error.response.data : error.message);
        Alert.alert('Error', `Error: ${error.response ? error.response.data.message : error.message}`);
      } else {
        console.log('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  


  



  const phoneRegex = /^\+?[0-9]{1,3}[0-9]{7,10}$/;



  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Validate phone number and email
  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validateEmail = (email: string) => emailRegex.test(email);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
       <KeyboardAvoidingView 
    behavior={Platform.OS ==="ios" ? "padding" : "height"}
  enabled 
  className="flex-1"
>
        <View className="flex-1 bg-white py-4 p-2">
          <View className="p-[-2]">
            <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
              <BackButton navigation={navigation} />
              <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
                New Customer Registration
              </Text>
            </View>
          </View>

          <ScrollView style={{ paddingHorizontal: wp(1) }}
          keyboardShouldPersistTaps="handled"
          >
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                  {/* <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full py-2 mt-1 justify-center justifyContent-flex-end">
                    <Picker
                      selectedValue={selectedCategory}
                      onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                      mode="dropdown"
                      style={{
                        height: 20, 
                        width: "100%",
                        color: "black",
                      }}
                    >
                      <Picker.Item label="Title" value="" style={{ fontSize: 8 }} />
                      <Picker.Item label="Mr" value="Mr" style={{ fontSize: 8 }} />
                      <Picker.Item label="Ms" value="Ms" style={{ fontSize: 8 }} />
                    </Picker>
                  </View> */}
                  <SelectList
  setSelected={setSelectedCategory} // Set the selected value
  data={[
    { key: 'Mr', value: 'Mr' },
    { key: 'Ms', value: 'Ms' },
  ]} // The options for the select list
  boxStyles={{
    backgroundColor: '#F6F6F6',
    borderColor: '#F6F6F6',
    borderRadius: 30,
    paddingVertical: 10, // Adjust padding if needed
  }}
  dropdownTextStyles={{
    color: 'black',
  }}
  search={false} // Disable search
  placeholder="Title" // Placeholder text
/>

                </View>

                <View className="flex-[2] ml-2">
                  <Text className="text-gray-700 mb-1">First Name</Text>
                  <TextInput
                    className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Last Name</Text>
                <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Phone Number</Text>
                <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                  placeholder="ex: +9477 XXXXXXX"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Email Address</Text>
                <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                  placeholder="Email Address"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Building Type</Text>
                {/* <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-2 mt-1 items-center justify-center">
                  <Picker
                    selectedValue={buildingType}
                    onValueChange={(itemValue) => setBuildingType(itemValue)}
                    style={{
                      height: 25,
                      width: "100%",
                    }}
                  >
                    <Picker.Item label="Select Building Type" value="" color="#999" style={{ fontSize: 14 }} />
                    {buildingOptions.map((option) => (
                      <Picker.Item key={option.key} label={option.value} value={option.value} />
                    ))}
                  </Picker>
                </View> */}
      <SelectList
        setSelected={setBuildingType} // Set the selected value
        data={buildingOptions} // The options for the select list
        // defaultOption={{ key: "", value: "" }} // Default option if nothing is selected
        boxStyles={{
          backgroundColor: 'white',
          borderColor: '#CFCFCF',
          borderRadius: 30,
        }}
        dropdownTextStyles={{
          color: '#000',
        }}
        search={false} // Enable search
        placeholder="Select Building Type" // Placeholder text
        
      />
              </View>

              {buildingType === "House" && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Building / House No</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Building / House No (e.g., 14/B)"
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Street Name</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                      onChangeText={setStreetName}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">City</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="City"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </>
              )}

              {buildingType === "Apartment" && (
                <>
                  <View className="mb-4">
                   <Text className="text-gray-700 mb-1">Apartment / Building No</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={buildingNo}
                      onChangeText={setbuildingNo}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Apartment / Building Name</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={ buildingName}
                      onChangeText={ setbuildingName}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Flat / Unit Number</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : Building B"
                      value={unitNo}
                      onChangeText={setunitNo}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Floor Number</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : 3rd Floor"
                      value={floorNo}
                      onChangeText={setfloorNo}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">House No</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : 14"
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Street Name</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                      onChangeText={setStreetName}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">City</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="City"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </>
              )}

              <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-4 rounded-lg items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15">
                <TouchableOpacity onPress={handleRegister}>
                  <Text className="text-center text-white font-bold">Register</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddCustomersScreen;
