import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
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

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

const EditCustomerScreen: React.FC<EditCustomerScreenProps> = ({ navigation, route }) => {
  const { id, customerId, name, title } = route.params;
  
  // Form state
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
  
  // UI & Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState<string>("");
  const [touchedFields, setTouchedFields] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
    buildingType: false,
    title: false
  });
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [buildingTypeError, setBuildingTypeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");

  // Dropdown states
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [items, setItems] = useState([
    { key: 'Rev', label: "Rev", value: 'Rev' },
    { key: 'Mr', label: "Mr", value: "Mr" },
    { key: 'Ms', label: "Ms", value: "Ms" },
    { key: 'Mrs', label: "Mrs", value: "Mrs" },
  ]);
  const [buildingTypeOpen, setBuildingTypeOpen] = useState(false);
  const [openCityDropdown, setOpenCityDropdown] = useState(false);
  const [cityItems, setCityItems] = useState<{label: string, value: string}[]>([]);
  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);

  // Validation regex
  const phoneRegex = /^\+947\d{8}$/;
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const nameRegex = /^[A-Z][a-z]*$/;

  // Helper functions
  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validateEmail = (email: string) => emailRegex.test(email);
  const validateName = (name: string) => nameRegex.test(name);
  
  const formatNameInput = (text: string) => {
    if (!text) return text;
    const filteredText = text.replace(/[^a-zA-Z]/g, '');
    return filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase();
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Required Field Indicator Component
  const RequiredField = ({ children }: { children: React.ReactNode }) => (
    <Text className="text-gray-700 mb-1">
      {children} <Text className="">*</Text>
    </Text>
  );

  // Validation effects
  useEffect(() => {
    if (touchedFields.firstName) {
      if (!firstName) {
        setFirstNameError("First name is required");
      } else if (!validateName(firstName)) {
        setFirstNameError("First name must start with a capital letter");
      } else {
        setFirstNameError("");
      }
    }
  }, [firstName, touchedFields.firstName]);

  useEffect(() => {
    if (touchedFields.lastName) {
      if (!lastName) {
        setLastNameError("Last name is required");
      } else if (!validateName(lastName)) {
        setLastNameError("Last name must start with a capital letter");
      } else {
        setLastNameError("");
      }
    }
  }, [lastName, touchedFields.lastName]);

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

  useEffect(() => {
    if (touchedFields.buildingType) {
      if (!buildingType) {
        setBuildingTypeError("Building type is required");
      } else {
        setBuildingTypeError("");
      }
    }
  }, [buildingType, touchedFields.buildingType]);

  useEffect(() => {
    if (touchedFields.title) {
      if (!selectedCategory) {
        setTitleError("Title is required");
      } else {
        setTitleError("");
      }
    }
  }, [selectedCategory, touchedFields.title]);

  // Fetch initial data
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) setToken(storedToken);
    };
    
    getToken();
  }, []);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/customer/get-customer-data/${id}`
        );
        
        if (response.status === 200) {
          const customerData = response.data.customer;
          const buildingData = response.data.building;

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
              setHouseNo(buildingData.houseNo || "");
              setStreetName(buildingData.streetName || "");
              setCity(buildingData.city || "");
            } else if (customerData.buildingType === "Apartment") {
              setBuildingNo(buildingData.buildingNo || "");
              setBuildingName(buildingData.buildingName || "");
              setUnitNo(buildingData.unitNo || "");
              setFloorNo(buildingData.floorNo || "");
              setHouseNo(buildingData.houseNo || "");
              setStreetName(buildingData.streetName || "");
              setCity(buildingData.city || "");
            }
          }
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load customer data.");
      }
    };

    fetchCustomerData();
  }, [id]);

  useEffect(() => {
    const fetchCity = async () => {
      try {
        const response = await axios.get<{ data: City[] }>(
          `${environment.API_BASE_URL}api/customer/get-city`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data?.data) {
          setCityItems(response.data.data.map(city => ({
            label: city.city,
            value: city.city
          })));
        }
      } catch (error) {
        console.error("City fetch error:", error);
      }
    };

    if (token) fetchCity();
  }, [token]);

  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number.');
      return { status: 400 };
    }

    try {
      setLoading(true);
      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");

      const response = await axios.post(
        "https://api.getshoutout.com/otpservice/send",
        {
          source: "ShoutDEMO",
          transport: "sms",
          content: { sms: "Your code is {{code}}" },
          destination: cleanedPhoneNumber,
        },
        { headers: { Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}` } }
      );

      await AsyncStorage.setItem("referenceId", response.data.referenceId);

      if (response.status === 200) {
        setOtpSent(true);
        return response;
      }
      return { status: 400 };
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send OTP.');
      return { status: 400 };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Mark all fields as touched to show errors
    setTouchedFields({
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
      buildingType: true,
      title: true
    });

    // Validate required fields
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // Validate formats
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number (format: +947XXXXXXXX).");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Validate building-specific fields
    if (buildingType === "House" && (!houseNo || !streetName || !city)) {
      Alert.alert("Error", "Please fill in all required house fields.");
      return;
    }

    if (buildingType === "Apartment" && (!buildingNo || !buildingName || !unitNo || !floorNo || !houseNo || !streetName || !city)) {
      Alert.alert("Error", "Please fill in all required apartment fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Only check phone number if it's changed
      if (phoneNumber !== originalPhoneNumber) {
        const checkResponse = await axios.post(
          `${environment.API_BASE_URL}api/customer/check-customer`,
          { phoneNumber },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (checkResponse.status === 400) {
          Alert.alert("Error", "This phone number is already registered.");
          return;
        }

        // Send OTP if phone number changed
        const otpResponse = await sendOTP();
        if (otpResponse.status !== 200) {
          Alert.alert("Error", "Failed to send OTP. Please try again.");
          return;
        }
      }

      // Prepare data
      const customerData = {
        title: selectedCategory,
        firstName,
        lastName,
        phoneNumber,
        email,
        buildingType,
      };

      const buildingData = buildingType === "House" ? {
        houseNo,
        streetName,
        city
      } : {
        buildingNo,
        buildingName,
        unitNo,
        floorNo,
        houseNo,
        streetName,
        city
      };

      if (phoneNumber !== originalPhoneNumber) {
        await AsyncStorage.setItem("pendingCustomerData", JSON.stringify({ 
          customerData, 
          buildingData,
          originalBuildingType
        }));
        navigation.navigate("OtpScreenUp", { phoneNumber, id, token });
      } else {
        const response = await axios.put(
          `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
          { ...customerData, buildingData, originalBuildingType },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.status === 200) {
          Alert.alert("Success", "Customer updated successfully.");
          navigation.goBack();
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 400) {
        Alert.alert("Error", error.response.data.message || "This phone number is already registered.");
      } else {
        Alert.alert("Error", "Failed to update customer. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildingTypeChange = (value: string) => {
    setBuildingType(value);
    if (value !== originalBuildingType) {
      if (value === "House") {
        setBuildingNo("");
        setBuildingName("");
        setUnitNo("");
        setFloorNo("");
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
            <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
              <TouchableOpacity 
                style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                onPress={() => navigation.navigate("ViewCustomerScreen" as any, { id, customerId, name, title })}
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

          <ScrollView 
            style={{ paddingHorizontal: wp(1) }}
            keyboardShouldPersistTaps="handled"
            className="mb-4"
          >
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <RequiredField>Title</RequiredField>
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
                      scrollViewProps={{ nestedScrollEnabled: true }}
                      onOpen={() => handleFieldTouch("title")}
                    />
                  </View>
                  {titleError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">{titleError}</Text>
                  ) : null}
                </View>

                <View className="flex-[2] ml-2">
                  <RequiredField>First Name</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border rounded-full px-6 h-10 ${
                      firstNameError ? 'border-red-500' : 'border-[#F6F6F6]'
                    }`}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={text => setFirstName(formatNameInput(text))}
                    onBlur={() => handleFieldTouch("firstName")}
                    autoCapitalize="words"
                  />
                  {firstNameError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">{firstNameError}</Text>
                  ) : null}
                </View>
              </View>

              <View className="mb-4">
                <RequiredField>Last Name</RequiredField>
                <TextInput
                  className={`bg-[#F6F6F6] border rounded-full px-6 h-10 ${
                    lastNameError ? 'border-red-500' : 'border-[#F6F6F6]'
                  }`}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={text => setLastName(formatNameInput(text))}
                  onBlur={() => handleFieldTouch("lastName")}
                  autoCapitalize="words"
                />
                {lastNameError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{lastNameError}</Text>
                ) : null}
              </View>

              <View className="mb-4">
                <RequiredField> Mobile Number</RequiredField>
                <TextInput
                  className={`bg-[#F6F6F6] border rounded-full px-6 h-10 ${
                    phoneError ? 'border-red-500' : 'border-[#F6F6F6]'
                  }`}
                  placeholder="ex: +9477XXXXXXX"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onBlur={() => handleFieldTouch("phoneNumber")}
                  maxLength={12}
                   onFocus={() => {
    // Ensure +94 is there when focused
    if (phoneNumber === "") {
      setPhoneNumber("+94");
    }
  }}
                />
                {phoneError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{phoneError}</Text>
                ) : null}
              </View>

              <View className="mb-4">
                <RequiredField>Email Address</RequiredField>
                <TextInput
                  className={`bg-[#F6F6F6] border rounded-full px-6 h-10 ${
                    emailError ? 'border-red-500' : 'border-[#F6F6F6]'
                  }`}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => handleFieldTouch("email")}
                />
                {emailError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{emailError}</Text>
                ) : null}
              </View>

              <View className="mb-4 z-10">
                <RequiredField>Building Type</RequiredField>
                <DropDownPicker
                  open={buildingTypeOpen}
                  value={buildingType}
                  items={buildingTypeItems}
                  setOpen={setBuildingTypeOpen}
                  setValue={(callback) => {
                    const newValue = callback(buildingType);
                    handleBuildingTypeChange(newValue);
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
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  onOpen={() => handleFieldTouch("buildingType")}
                />
                {buildingTypeError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{buildingTypeError}</Text>
                ) : null}
              </View>

              {buildingType === "House" && (
                <>
                  <View className="mb-4">
                    <RequiredField>Building / House No</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Building / House No (e.g., 14/B)"
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>Street Name</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                      onChangeText={setStreetName}
                    />
                  </View>
                  <View className="mb-4 z-10">
                    <RequiredField>Nearest City</RequiredField>
                    <DropDownPicker
                      open={openCityDropdown}
                      value={city}
                      items={cityItems}
                      setOpen={setOpenCityDropdown}
                      setValue={setCity}
                      setItems={setCityItems}
                      placeholder={city || "Select Nearest City"}
                      searchable={true}
                      searchPlaceholder="Search city..."
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
                        color: city ? '#333' : '#999',
                        fontSize: 14,
                      }}
                      zIndex={3000}
                      zIndexInverse={1000}
                      modalProps={{ animationType: "fade" }}
                      listMode="MODAL"
                      scrollViewProps={{ nestedScrollEnabled: true }}
                    />
                  </View>
                </>
              )}

              {buildingType === "Apartment" && (
                <>
                  <View className="mb-4">
                    <RequiredField>Apartment / Building No</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building No"
                      value={buildingNo}
                      onChangeText={setBuildingNo}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>Apartment / Building Name</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={buildingName}
                      onChangeText={setBuildingName}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>Flat / Unit Number</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex: Building B"
                      value={unitNo}
                      onChangeText={setUnitNo}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>Floor Number</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex: 3rd Floor"
                      value={floorNo}
                      onChangeText={setFloorNo}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>House No</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Building / House No (e.g., 14/B)"
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                  </View>
                  <View className="mb-4">
                    <RequiredField>Street Name</RequiredField>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                      onChangeText={setStreetName}
                    />
                  </View>
                  <View className="mb-4 z-10">
                    <RequiredField>Nearest City</RequiredField>
                    <DropDownPicker
                      open={openCityDropdown}
                      value={city}
                      items={cityItems}
                      setOpen={setOpenCityDropdown}
                      setValue={setCity}
                      setItems={setCityItems}
                      placeholder={city || "Select Nearest City"}
                      searchable={true}
                      searchPlaceholder="Search city..."
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
                        color: city ? '#333' : '#999',
                        fontSize: 14,
                      }}
                      zIndex={3000}
                      zIndexInverse={1000}
                      modalProps={{ animationType: "fade" }}
                      listMode="MODAL"
                      scrollViewProps={{ nestedScrollEnabled: true }}
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
                  className="py-3 px-4 items-center mt-6 mb-[15%] mr-[20%] ml-[20%] h-15 rounded-full"
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