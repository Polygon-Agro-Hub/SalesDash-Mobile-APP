import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
//import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";
import { AntDesign } from "@expo/vector-icons";

type EditCustomerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EditCustomerScreen"
>;

interface EditCustomerScreenProps {
  navigation: EditCustomerScreenNavigationProp;
  route: any;  
}

const EditCustomerScreen: React.FC<EditCustomerScreenProps> = ({ navigation, route }) => {
  const { id , customerId,name, title} = route.params;
  console.log(id) 

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [houseNo, setHouseNo] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [buildingNo, setBuildingNo] = useState<string>("");
  const [floorNo, setFloorNo] = useState<string>("");
  const [unitNo, setUnitNo] = useState<string>("");
  const [buildingName, setBuildingName] = useState<string>("");
  const [buildingType, setBuildingType] = useState<string>("");
  const [originalBuildingType, setOriginalBuildingType] = useState<string>("");
  
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState<string>("");

  // For building type dropdown picker
  const [buildingTypeOpen, setBuildingTypeOpen] = useState(false);
  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }
    };
    
    getToken();
  }, []);

  // Helper function to convert null to empty string
  const nullToEmptyString = (value: any): string => {
    return value !== null && value !== undefined ? value : "";
  };

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
          console.log("Building Data:", buildingData);

          setSelectedCategory(customerData.title || "");
          setFirstName(customerData.firstName || "");
          setLastName(customerData.lastName || "");
          setPhoneNumber(customerData.phoneNumber || "");
          setEmail(customerData.email || "");
          setBuildingType(customerData.buildingType || "");
          setOriginalBuildingType(customerData.buildingType || "");
          setOriginalPhoneNumber(customerData.phoneNumber || "");
          
          if (buildingData) {
            if (customerData.buildingType === "House") {
              setHouseNo(nullToEmptyString(buildingData.houseNo));
              setStreetName(nullToEmptyString(buildingData.streetName));
              setCity(nullToEmptyString(buildingData.city));
            } else if (customerData.buildingType === "Apartment") {
              setBuildingNo(nullToEmptyString(buildingData.buildingNo));
              setBuildingName(nullToEmptyString(buildingData.buildingName));
              setUnitNo(nullToEmptyString(buildingData.unitNo));
              setFloorNo(nullToEmptyString(buildingData.floorNo));
              setHouseNo(nullToEmptyString(buildingData.houseNo));
              setStreetName(nullToEmptyString(buildingData.streetName));
              setCity(nullToEmptyString(buildingData.city));
            }
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
  
     // console.log("API response:", response.data); 
  
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

    setIsSubmitting(true); 
  
    try {
      // Only check phone number if it's changed
      if (phoneNumber !== originalPhoneNumber) {
        try {
          const checkResponse = await axios.post(
            `${environment.API_BASE_URL}api/customer/check-customer`,
            { phoneNumber }, // ONLY sending phoneNumber now
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
  
          // If server replies 400, phone already registered
          if (checkResponse.status === 400) {
            Alert.alert("Error", "This phone number is already registered.");
            return;
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
              Alert.alert("Error", "This phone number is already registered.");
              return;
            } else if (error.response?.status === 404) {
              console.log("(NOBRIDGE) INFO: Phone number not found, proceeding...");
              // Valid case — allow to continue.
            } else {
              console.error("(NOBRIDGE) ERROR checking phone:", error.response?.data);
              Alert.alert("Error", "Failed to verify phone number. Please try again.");
              return;
            }
          } else {
            console.error("(NOBRIDGE) Unknown error checking phone:", error);
            Alert.alert("Error", "Failed to verify phone number. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
      }
  
      // Create the customer data object
      const customerData = {
        title: selectedCategory,
        firstName,
        lastName,
        phoneNumber,
        email,
        buildingType,
      };
  
      // Create building data object based on the selected building type
      let buildingData = {};
  
      if (buildingType === "House") {
        buildingData = {
          houseNo: houseNo || "",
          streetName: streetName || "",
          city: city || ""
        };
      } else if (buildingType === "Apartment") {
        buildingData = {
          buildingNo: buildingNo || "",
          buildingName: buildingName || "",
          unitNo: unitNo || "",
          floorNo: floorNo || "",
          houseNo: houseNo || "",
          streetName: streetName || "",
          city: city || ""
        };
      }
  
      // If phone number has changed, send OTP
      if (phoneNumber !== originalPhoneNumber) {
        setOtpSent(false);  
        const otpResponse = await sendOTP();  
        if (otpResponse.status === 200) {
          await AsyncStorage.setItem("pendingCustomerData", JSON.stringify({ customerData, buildingData }));
          navigation.navigate("OtpScreenUp", { phoneNumber, id, token });
        } else {
          alert("Failed to send OTP. Please try again.");
        }
      } else {
        const dataToSend = {
          ...customerData,
          buildingData,
          originalBuildingType
        };
  
        const response = await axios.put(
          `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        if (response.status === 200) {
          Alert.alert("Success", "Customer updated successfully.");
          navigation.goBack();
        } else {
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
    } finally {
    setIsSubmitting(false); // Always reset submitting state when done
  }
  };
  ////
  
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [items, setItems] = useState([
    { key: 'Mr', label: "Mr", value: "Mr" },
    { key: 'Ms', label: "Ms", value: "Ms" },
     { key: 'Mrs', label: "Mrs", value: "Mrs" },
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
  
  // Handle building type change - clear irrelevant fields
  const handleBuildingTypeChange = (value: string) => {
    setBuildingType(value);
    
    // If building type changed, clear fields from the other type
    if (value !== originalBuildingType) {
      if (value === "House") {
        // Clear apartment fields
        setBuildingNo("");
        setBuildingName("");
        setUnitNo("");
        setFloorNo("");
        // Initialize house fields with empty strings if they're not set
        setHouseNo(houseNo || "");
        setStreetName(streetName || "");
        setCity(city || "");
      } else if (value === "Apartment") {
        // Initialize apartment fields with empty strings if they're not set
        setBuildingNo("");
        setBuildingName("");
        setUnitNo("");
        setFloorNo("");
        // Keep house fields as they may be needed for apartment too
      }
    }
  };

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
              {/* <BackButton navigation={navigation} /> */}
              <TouchableOpacity 
        style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
        onPress={() => navigation.navigate("ViewCustomerScreen" as any, { id: id, customerId:customerId, name: name, title:title })}
        >
         <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
           <AntDesign name="left" size={20} color="black" />
         </View>
       </TouchableOpacity> 
              <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
                Edit Customer Details 
              </Text>
            </View>
          </View>

          <ScrollView style={{ paddingHorizontal: wp(1) }}
          keyboardShouldPersistTaps="handled"
          className="mb-4"
          >
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                
                  <View className="mb-2">
  
              

<DropDownPicker
  open={open}
  value={selectedCategory}
  items={items}
  setOpen={setOpen}
  setValue={setSelectedCategory}
  setItems={setItems}
  placeholder="Select Title"
  style={{
    backgroundColor: '#F6F6F6',
    borderColor: '#F6F6F6',
    borderRadius: 30,
    minHeight: 40,
  }}
  textStyle={{
    fontSize: 12,
    textAlignVertical: "center",
  }}
  dropDownContainerStyle={{
    backgroundColor: '#ffffff',
    borderColor: '#F6F6F6',
    borderRadius: 10,
    zIndex: 1000,
  }}
  listMode="SCROLLVIEW"          
  scrollViewProps={{            
    nestedScrollEnabled: true,
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

              <View className="mb-4 ">
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

              <View className="mb-4 z-10">
                <Text className="text-gray-700 mb-1">Building Type</Text>
                <DropDownPicker
                  open={buildingTypeOpen}
                  value={buildingType}
                  items={buildingTypeItems}
                  setOpen={setBuildingTypeOpen}
                  setValue={(callback) => {
                    setBuildingType((val) => {
                      const newValue = callback(val);
                      handleBuildingTypeChange(newValue);
                      return newValue;
                    });
                  }}
                  setItems={setBuildingTypeItems}
                  placeholder="Select Building Type"
                  style={{
                    backgroundColor: '#F6F6F6',
                    borderColor: '#F6F6F6',
                    borderRadius: 30,
                    minHeight: 40,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#F6F6F6',
                    borderRadius: 10,
                    zIndex: 1000,
                  }}
                  textStyle={{
                    color: '#333',
                    fontSize: 14,
                    paddingLeft: 5,
                  }}
                  placeholderStyle={{
                    color: '#999',
                    fontSize: 14,
                  }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="SCROLLVIEW"        
  scrollViewProps={{            
    nestedScrollEnabled: true,
  }}
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
                      placeholder="Apartment / Building No"
                      value={buildingNo}
                      onChangeText={setBuildingNo}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Apartment / Building Name</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={buildingName}
                      onChangeText={setBuildingName}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Flat / Unit Number</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : Building B"
                      value={unitNo}
                      onChangeText={setUnitNo}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Floor Number</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : 3rd Floor"
                      value={floorNo}
                      onChangeText={setFloorNo}
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

 <TouchableOpacity 
  onPress={handleRegister}
  disabled={isSubmitting}
>
  <LinearGradient 
    colors={["#854BDA", "#6E3DD1"]} 
    className="py-3 px-4  items-center mt-6 mb-[15%] mr-[20%] ml-[20%] h-15 rounded-full"
  >
    {isSubmitting ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <Text className="text-center text-white font-bold">Save</Text>
    )}
  </LinearGradient>
</TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditCustomerScreen;