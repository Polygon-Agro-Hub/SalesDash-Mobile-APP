import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

import { Picker } from "@react-native-picker/picker";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";

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

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];

  const handleRegister = async () => {
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      alert("Please fill in all required fields.");
      return;
    }
  
    // Validate phone number and email
    if (!validatePhoneNumber(phoneNumber)) {
      alert("Please enter a valid phone number.");
      return;
    }
  
    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

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
      buildingName
    };

    try {
      const response = await axios.post(`${environment.API_BASE_URL}api/customer/add-customer`, customerData);

      
      if (response.status === 200) {
        console.log("Customer registered successfully:", response.data);
        navigation.navigate("OtpScreen");
      } else {
        console.error("Failed to register customer:", response.data.error);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Error", `Failed to fetch user profile: ${error.message}`);
        console.error(error);
      } else {
        Alert.alert("Error", "An unknown error occurred");
        console.error("An unknown error occurred", error);
      }
    }
  };

  const phoneRegex = /^[+]?[0-9]{10}$/;


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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
        <View className="flex-1 bg-white py-4 p-2">
          <View className="p-[-4]">
            <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
              <BackButton navigation={navigation} />
              <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
                New Customer Registration
              </Text>
            </View>
          </View>

          <ScrollView style={{ paddingHorizontal: wp(1) }}>
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                  <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full py-2 mt-1 justify-center justifyContent-flex-end">
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
                  </View>
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
                  placeholder="ex: 077 XXXXXXX"
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
                <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-4 py-2 mt-1 items-center justify-center">
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
                </View>
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
        {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddCustomersScreen;
