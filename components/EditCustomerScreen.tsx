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
  console.log(id) 

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
    const [token, setToken] = useState<string>("");

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }
    };
    
    getToken();
  }, []);

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
      return { status: 400 }; 
    }
    console.log("----check----", phoneNumber)
  
    try {
      setLoading(true);
  
 
      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
  
      const apiUrl = "https://api.getshoutout.com/otpservice/send";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };
  
      const body = {
        source: "ShoutDEMO",
        transport: "sms",    
        content: {
          sms: "Your code is {{code}}",  
        },
        destination: cleanedPhoneNumber, 
      };
  
      console.log("Request body:", body); 
  
      const response = await axios.post(apiUrl, body, { headers });
  
      console.log("API response:", response.data); 
  
 
      await AsyncStorage.setItem("referenceId", response.data.referenceId);
  

      if (response.status === 200) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully.');
        return response; 
      } else {
        Alert.alert('Error', 'Failed to send OTP.');
        return { status: 400 }; 
      }
    } catch (error) {
    
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', error.response ? error.response.data : error.message);
        Alert.alert('Error', `Error: ${error.response ? error.response.data.message : error.message}`);
      } else {
        console.log('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
      return { status: 400 }; 
    } finally {
      setLoading(false);
    }
  };
  

  const handleRegister = async () => {
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      alert("Please fill in all required fields.");
      return;
    }
  
 
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
  
      if (phoneNumber !== originalPhoneNumber) {
        setOtpSent(false);  
  
 
        const otpResponse = await sendOTP();  
        if (otpResponse.status === 200) {
          
          await AsyncStorage.setItem("pendingCustomerData", JSON.stringify(customerData));
  
          navigation.navigate("OtpScreenUp", { phoneNumber ,id, token});
          console.log(id)
        } else {
          alert("Failed to send OTP. Please try again.");
        }
      } else {
    
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
      <KeyboardAvoidingView 
                   behavior={Platform.OS === "ios" ? "padding" : "height"}
                   enabled 
                   className="flex-1"
                 >
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
          keyboardShouldPersistTaps="handled"
          >
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                
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
    borderRadius: 9999, 
    paddingVertical: 0, 
    paddingHorizontal: 7,
    height: 0, 
  }}
  textStyle={{
    fontSize: 12, 
  
    textAlignVertical: "center",
  }}
  dropDownContainerStyle={{
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingTop: 6,
    maxHeight: 100, 
    overflow: "hidden",
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditCustomerScreen;
