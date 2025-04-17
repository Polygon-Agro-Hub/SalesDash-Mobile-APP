import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  console.log("..",buildingType)
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({
    email: false,
    phoneNumber: false,
    firstName: false,
    lastName: false
  });
  const [firstNameError, setFirstNameError] = useState<string>("");
const [lastNameError, setLastNameError] = useState<string>("");
const [buildingTypeError, setBuildingTypeError] = useState<string>("");
const [titleError, setTitleError] = useState<string>("");



  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];
  
  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }
    console.log("----check----",phoneNumber)
  
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
      } else {
        Alert.alert('Error', 'Failed to send OTP.');
      }
    } catch (error) {

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
  

  const phoneRegex = /^\+947\d{8}$/;

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;


  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validateEmail = (email: string) => emailRegex.test(email);

  // Validate email when it changes


  useEffect(() => {
    if (touchedFields.title) {
      if (!selectedCategory) {
        setTitleError("Title is required");
      } else {
        setTitleError("");
      }
    }
  }, [selectedCategory, touchedFields.title]);
  
  useEffect(() => {
    if (touchedFields.email) {
      if (!email) {
        setEmailError("Email is required");
      } else if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  }, [email, touchedFields.email]);

  // Validate phone when it changes
  useEffect(() => {
    if (touchedFields.phoneNumber) {
      if (!phoneNumber) {
        setPhoneError("Phone number is required");
      } else if (!validatePhoneNumber(phoneNumber)) {
        setPhoneError("Please enter a valid phone number (format: +947XXXXXXXX)");
      } else {
        setPhoneError("");
      }
    }
  }, [phoneNumber, touchedFields.phoneNumber]);

  useEffect(() => {
    if (touchedFields.firstName) {
      if (!firstName) {
        setFirstNameError("First name is required");
      } else {
        setFirstNameError("");
      }
    }
  }, [firstName, touchedFields.firstName]);
  
  useEffect(() => {
    if (touchedFields.lastName) {
      if (!lastName) {
        setLastNameError("Last name is required");
      } else {
        setLastNameError("");
      }
    }
  }, [lastName, touchedFields.lastName]);
  
  useEffect(() => {
    if (touchedFields.buildingType) {
      if (!buildingType) {
        setBuildingTypeError("Building type is required");
      } else {
        setBuildingTypeError("");
      }
    }
  }, [buildingType, touchedFields.buildingType]);
  

  // Mark field as touched
  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  // const handleRegister = async () => {
  //   if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
  //     Alert.alert("Error", "Please fill in all required fields.");
  //     return;
  //   }
  
  //   if (!validatePhoneNumber(phoneNumber)) {
  //     Alert.alert("Error", "Please enter a valid phone number.");
  //     return;
  //   }
  
  //   if (!validateEmail(email)) {
  //     Alert.alert("Error", "Please enter a valid email address.");
  //     return;
  //   }
  
  //   try {
 
  //     const checkResponse = await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
  //       phoneNumber,
  //       email,
  //     });
  
  //     if (checkResponse.status === 400) {
  //       Alert.alert("Error", "Phone number or email already exists.");
  //       return;
  //     }
  

  //     const customerData = {
  //       title: selectedCategory,
  //       firstName,
  //       lastName,
  //       phoneNumber,
  //       email,
  //       buildingType,
  //       houseNo,
  //       streetName,
  //       city,
  //       buildingNo,
  //       floorNo,
  //       unitNo,
  //       buildingName,
  //     };
  //     await AsyncStorage.setItem("pendingCustomerData", JSON.stringify(customerData));
  
     
  //     const id = new Date().getTime().toString(); 
  

  //     await sendOTP();
  //     navigation.navigate("OtpScreen", { phoneNumber, id });
  
  //   } catch (error: any) {
  //     console.log("Error checking customer:", error);
  //     Alert.alert("Error", "Phone number or email already exists.");
  //   }
  // };

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
    const checkResponse = await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
      phoneNumber,
      email,
    });
    
    // Continue with registration if check passes
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
    const id = new Date().getTime().toString();
    await sendOTP();
    navigation.navigate("OtpScreen", { phoneNumber, id });
  } catch (error: any) {
    console.log("Error checking customer:", error);
    
    // Display "This email address is already registered" when phone number exists
    if (error.response && error.response.status === 400) {
      if (error.response.data.existingPhone) {
        Alert.alert("Error", "This phone Number is already registered.");
      } else if (error.response.data.existingEmail) {
        Alert.alert("Error", "This email address is already registered.");
      } else {
        Alert.alert("Error", "Your credentials already exists in our system.");
      }
    } else {
      Alert.alert("Error", "Registration failed. Please try again.");
    }
  }
};


  


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

          <ScrollView className="flex-1 " keyboardShouldPersistTaps="handled">
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title</Text>
                  <SelectList
  setSelected={setSelectedCategory} 
  data={[
    { key: 'Mr', value: 'Mr' },
    { key: 'Ms', value: 'Ms' },
  ]} 
  boxStyles={{
    backgroundColor: '#F6F6F6',
    borderColor: '#F6F6F6',
    borderRadius: 30,
    paddingVertical: 10, 
  }}
  dropdownTextStyles={{
    color: 'black',
  }}
  search={false} 
  placeholder="Title" 
/>

                </View>

                <View className="flex-[2] ml-2">
  <Text className="text-gray-700 mb-1">First Name</Text>
  <TextInput
    className={`bg-[#F6F6F6] border ${firstNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
    placeholder="First Name"
    value={firstName}
    onChangeText={(text) => {
      setFirstName(text);
      if (touchedFields.firstName && !text) {
        setFirstNameError("First name is required");
      } else if (touchedFields.firstName) {
        setFirstNameError("");
      }
    }}
    onBlur={() => handleFieldTouch("firstName")}
  />
  {firstNameError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{firstNameError}</Text>
  ) : null}
</View>
              </View>

              <View className="mb-4">
  <Text className="text-gray-700 mb-1">Last Name</Text>
  <TextInput
    className={`bg-[#F6F6F6] border ${lastNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
    placeholder="Last Name"
    value={lastName}
    onChangeText={(text) => {
      setLastName(text);
      if (touchedFields.lastName && !text) {
        setLastNameError("Last name is required");
      } else if (touchedFields.lastName) {
        setLastNameError("");
      }
    }}
    onBlur={() => handleFieldTouch("lastName")}
  />
  {lastNameError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{lastNameError}</Text>
  ) : null}
</View>

              <View className="mb-4">
              <Text className="text-gray-700 mb-1">Phone Number</Text>
              <TextInput
                className={`bg-[#F6F6F6] border ${phoneError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
                placeholder="ex: +9477 XXXXXXX"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onBlur={() => handleFieldTouch("phoneNumber")}
              />
              {phoneError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{phoneError}</Text>
              ) : null}
            </View>


              <View className="mb-4">
              <Text className="text-gray-700 mb-1">Email Address</Text>
              <TextInput
                className={`bg-[#F6F6F6] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
                placeholder="Email Address"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleFieldTouch("email")}
              />
              {emailError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{emailError}</Text>
              ) : null}
            </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Building Type</Text>
             
       <SelectList
        setSelected={setBuildingType} 
        data={buildingOptions} 
         defaultOption={{ key: "", value: "" }} 
       
        boxStyles={{
          backgroundColor: 'white',
          borderColor: '#CFCFCF',
          borderRadius: 30,
        }}
        dropdownTextStyles={{
          color: '#000',
        }}
        search={false} 
        placeholder="Select Building Type" 
        save="value"
        
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

              {/* <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="py-3 px-4 rounded-lg items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15">
                <TouchableOpacity onPress={handleRegister}>
                  <Text className="text-center text-white font-bold">Register</Text>
                </TouchableOpacity>
              </LinearGradient> */}
              
            <LinearGradient 
              colors={["#854BDA", "#6E3DD1"]} 
              className="py-3 px-4 rounded-lg items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15"
            >
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
