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
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

type EditCustomerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EditCustomerScreen"
>;

interface EditCustomerScreenProps {
  navigation: EditCustomerScreenNavigationProp;
  route: any;  
}

const EditCustomerScreen: React.FC<EditCustomerScreenProps> = ({ navigation, route }) => {
  const { id } = route.params;
  console.log(id) // Get customerId from route params

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

  const [originalPhoneNumber, setOriginalPhoneNumber] = useState<string>("");

  const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];

  // Fetch customer data based on customerId
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/customer/get-customer-data/${id}`
        );
        if (response.status === 200) {
          const customerData = response.data.customer;
          const buildingData = response.data.building;

          console.log("Customer Data:", customerData); 

          setSelectedCategory(customerData.title);
          setFirstName(customerData.firstName);
          setLastName(customerData.lastName);
          setPhoneNumber(customerData.phoneNumber);
          setEmail(customerData.email);
          setBuildingType(customerData.buildingType);
          setOriginalPhoneNumber(customerData.phoneNumber);
          setSelectedCategory(customerData.title);

          if (customerData.buildingType === "House") {
            setHouseNo(buildingData.houseNo || "");
            setStreetName(buildingData.streetName || "");
            setCity(buildingData.city || "");
          } else if (customerData.buildingType === "Apartment") {
            setbuildingNo(buildingData.buildingNo || "");
            setbuildingName(buildingData.buildingName || "");
            setunitNo(buildingData.unitNo || "");
            setfloorNo(buildingData.floorNo || "");
            setHouseNo(buildingData.houseNo || "");
            setStreetName(buildingData.streetName || "");
            setCity(buildingData.city || "");
          }
        } else {
          Alert.alert("Error", "Failed to load customer data.");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load customer data.");
      }
    };

    fetchCustomerData();
  }, [id]);


  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number.');
      return { status: 400 }; // Return a mock response for error handling
    }
    console.log("----check----", phoneNumber)
  
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
        return response; // Return the response object
      } else {
        Alert.alert('Error', 'Failed to send OTP.');
        return { status: 400 }; // Return a failure response
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
      return { status: 400 }; // Return a failure response on error
    } finally {
      setLoading(false);
    }
  };
  

  const handleRegister = async () => {
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
      buildingName,
    };
  
    try {
      // If the phone number has changed, only send OTP and do not update backend yet
      if (phoneNumber !== originalPhoneNumber) {
        setOtpSent(false);  // Reset OTP sent state
  
        // Send OTP for verification
        const otpResponse = await sendOTP();  // Send OTP
        if (otpResponse.status === 200) {
          // Save customer data temporarily for OTP verification process
          await AsyncStorage.setItem("pendingCustomerData", JSON.stringify(customerData));
  
          // Navigate to OTP screen with the new phone number
          navigation.navigate("OtpScreenUp", { phoneNumber ,id});
          console.log(id)
        } else {
          alert("Failed to send OTP. Please try again.");
        }
      } else {
        // If the phone number hasn't changed, update the data in the backend
        const response = await axios.put(
          `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
          customerData
        );
  
        if (response.status === 200) {
          console.log("Customer updated successfully:", response.data);
          Alert.alert("Success", "Customer updated successfully.");
          navigation.goBack();
        } else {
          console.error("Failed to update customer:", response.data.error);
          Alert.alert("Error", "Failed to update customer. Please try again.");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Error", `Failed to update customer: ${error.message}`);
        console.error(error);
      } else {
        Alert.alert("Error", "An unknown error occurred");
        console.error("An unknown error occurred", error);
      }
    }
  };
  
  
  

  const [open, setOpen] = useState(false);
const [selectedCategory, setSelectedCategory] = useState("");
const [items, setItems] = useState([
  { label: "Mr", value: "Mr" },
  { label: "Ms", value: "Ms" },
]);


  const phoneRegex = /^\+?[0-9]{1,3}[0-9]{7,10}$/;
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

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
            <View className="bg-white flex-row items-center h-17 shadow-lg px-1 ">
              <BackButton navigation={navigation} />
              <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
                Edit Customer Details 
           
              </Text>
            </View>
          </View>

          <ScrollView style={{ paddingHorizontal: wp(1) }}
          
          >
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                  {/* <View className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full py-2 mt-1 justify-center justifyContent-flex-end"> */}
               
                  <View className="mb-4">
  
                  <DropDownPicker
  open={open}
  value={selectedCategory}
  items={items}
  setOpen={setOpen}
  setValue={setSelectedCategory}
  setItems={setItems}
  placeholder="Select Title"
  style={{
    backgroundColor: "#F6F6F6", 
    borderColor: "#F6F6F6", 
    borderRadius: 9999, // Equivalent to rounded-full
    paddingVertical: 8, // Reduced padding
    justifyContent: "flex-end", // Align content to the bottom
    height: 40, // Set a specific height for the picker
  }}
  dropDownContainerStyle={{
    backgroundColor: "#ffffff", 
    borderRadius: 10, 
    paddingTop: 10,
    height: 140, // Set a height for the dropdown menu
  }} 
/>



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
                      value={buildingName}
                      onChangeText={setbuildingName}
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

              <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-4 rounded-lg items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15">
                <TouchableOpacity onPress={handleRegister}
                >
                  <Text className="text-center text-white font-bold">Save</Text>
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

export default EditCustomerScreen;
