import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, SafeAreaView, Alert, ActivityIndicator, BackHandler } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";
import DropDownPicker from "react-native-dropdown-picker";
import { useFocusEffect } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";





type AddCustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddCustomersScreen">;

interface AddCustomersScreenProps {
  navigation: AddCustomersScreenNavigationProp;
}


interface City {
  id: number;
 city:string;
 charge:string;
  createdAt?: string;
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
const [isSubmitting, setIsSubmitting] = useState(false);
const [token, setToken] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [openCityDropdown, setOpenCityDropdown] = useState(false);
const [cityItems, setCityItems] = useState<{label: string, value: string}[]>([]);

  const [openBuildingTypeDropdown, setOpenBuildingTypeDropdown] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [titleItems, setTitleItems] = useState([
  { label: 'Rev', value: 'Rev' },
  { label: 'Mr', value: 'Mr' },
  { label: 'Ms', value: 'Ms' },
  { label: 'Mrs', value: 'Mrs' }
]);
const [buildingTypeItems, setBuildingTypeItems] = useState([
  { label: "House", value: "House" },
  { label: "Apartment", value: "Apartment" },
]);

  const buildingOptions = [
    { key: "1", value: "House" },
    { key: "2", value: "Apartment" },
  ];

    const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setSelectedCategory('')
    setTitleDropdownOpen(false)
    setEmail("");
    setHouseNo("");
    setStreetName("");
    setCity("");
    setbuildingNo("");
    setfloorNo("");
    setunitNo("");
    setbuildingName("");
    setBuildingType("");
    setSelectedCategory("");
    setLoading(false);
    setOtpSent(false);
    setOpenBuildingTypeDropdown(false);
    setEmailError("");
    setPhoneError("");
    setFirstNameError("");
    setLastNameError("");
    setBuildingTypeError("");
    setTitleError("");
    setIsSubmitting(false);
    setTouchedFields({
      email: false,
      phoneNumber: false,
      firstName: false,
      lastName: false
    });

  };




// useEffect(() => {
//   const keyboardDidShowListener = Keyboard.addListener(
//     'keyboardDidShow',
//     () => {
//       setKeyboardVisible(true);
//     }
//   );
//   const keyboardDidHideListener = Keyboard.addListener(
//     'keyboardDidHide',
//     () => {
//       setKeyboardVisible(false);
//     }
//   );

//   return () => {
//     keyboardDidHideListener?.remove();
//     keyboardDidShowListener?.remove();
//   };
// }, []);

// useFocusEffect(
//   React.useCallback(() => {
//     // Only set to 0 if keyboard is not visible
//     if (!isKeyboardVisible) {
//       dispatch(setInputClick(0));
//     }
//   }, [isKeyboardVisible])
// );



  // Reset form when screen comes into focus
 useFocusEffect(
  React.useCallback(() => {
    console.log("Screen focused - resetting form");
    resetForm();
    fetchCity();

    return () => {
      console.log("Screen unfocused - cleanup");
      // Additional cleanup if needed
    };
  }, [])
);
  
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


 // const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validatePhoneNumber = (phone: string) => {
  // Check length first
  if (phone.length > 12) return false;
  return phoneRegex.test(phone);
};

// Add name validation
const validateName = (name: string) => {
  return /^[A-Z][a-z]*$/.test(name);
};
  // const validateEmail = (email: string) => emailRegex.test(email);

 // Enhanced Email Validation Functions
const validateEmail = (email: string): boolean => {
  // Basic email format check
  const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!generalEmailRegex.test(email)) {
    return false;
  }
  
  // Extract local part and domain
  const emailLower = email.toLowerCase();
  const [localPart, domain] = emailLower.split('@');
  
  // Check for specific allowed domains
  const allowedSpecificDomains = ['gmail.com', 'googlemail.com', 'yahoo.com'];
  const allowedTLDs = ['.com', '.gov', '.lk'];
  
  // Gmail/Googlemail specific validation
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return validateGmailLocalPart(localPart);
  }
  
  // Yahoo validation (standard email rules)
  if (domain === 'yahoo.com') {
    return validateYahooLocalPart(localPart);
  }
  
  // Check for other allowed domains (.com, .gov, .lk)
  for (const tld of allowedTLDs) {
    if (domain.endsWith(tld)) {
      return validateGeneralLocalPart(localPart);
    }
  }
  
  return false;
};

// Gmail-specific local part validation
const validateGmailLocalPart = (localPart: string): boolean => {
  // Gmail rules:
  // 1. Only alphanumeric characters, dots (.), and plus signs (+) allowed
  // 2. No consecutive dots
  // 3. No leading or trailing dots
  // 4. Must be 6-30 characters long
  
  // // Check length
  // if (localPart.length < 6 || localPart.length > 30) {
  //   return false;
  // }
  
  // Check for valid characters only (a-z, 0-9, ., +)
  const validCharsRegex = /^[a-zA-Z0-9.+]+$/;
  if (!validCharsRegex.test(localPart)) {
    return false;
  }
  
  // Check for leading or trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // Check for consecutive dots
  if (localPart.includes('..')) {
    return false;
  }
  
  // Must have at least one character
  if (localPart.length === 0) {
    return false;
  }
  
  return true;
};

// Yahoo-specific local part validation
const validateYahooLocalPart = (localPart: string): boolean => {
  // Yahoo rules:
  // 1. Only alphanumeric characters, dots (.), underscores (_), and hyphens (-) allowed
  // 2. No consecutive dots
  // 3. No leading or trailing dots/underscores/hyphens
  // 4. Must be 4-32 characters long
  
  // Check length
  if (localPart.length < 4 || localPart.length > 32) {
    return false;
  }
  
  // Check for valid characters only
  const validCharsRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validCharsRegex.test(localPart)) {
    return false;
  }
  
  // Check for leading or trailing special characters
  if (/^[._-]|[._-]$/.test(localPart)) {
    return false;
  }
  
  // Check for consecutive dots
  if (localPart.includes('..')) {
    return false;
  }
  
  return true;
};

// General local part validation for other domains
const validateGeneralLocalPart = (localPart: string): boolean => {
  // General rules:
  // 1. Only alphanumeric characters, dots (.), underscores (_), hyphens (-), and plus signs (+) allowed
  // 2. No consecutive dots
  // 3. No leading or trailing dots
  // 4. Must be 1-64 characters long
  
  // Check length
  if (localPart.length < 1 || localPart.length > 64) {
    return false;
  }
  
  // Check for valid characters
  const validCharsRegex = /^[a-zA-Z0-9._%+-]+$/;
  if (!validCharsRegex.test(localPart)) {
    return false;
  }
  
  // Check for leading or trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // Check for consecutive dots
  if (localPart.includes('..')) {
    return false;
  }
  
  return true;
};


  useEffect(() => {
    if (touchedFields.title) {
      if (!selectedCategory) {
        setTitleError("Title is required");
      } else {
        setTitleError("");
      }
    }
  }, [selectedCategory, touchedFields.title]);
  
  // useEffect(() => {
  //   if (touchedFields.email) {
  //     if (!email) {
  //       setEmailError("Email is required");
  //     } else if (!validateEmail(email)) {
  //       setEmailError("Please enter a valid email address");
  //     } else {
  //       setEmailError("");
  //     }
  //   }
  // }, [email, touchedFields.email]);

// Updated useEffect for email validation with specific error messages
useEffect(() => {
    if (touchedFields.email) {
      if (!email) {
        setEmailError("Email is required");
      } else if (!validateEmail(email)) {
        // Provide specific error messages based on domain and validation issues
        const emailLower = email.toLowerCase();
        const [localPart, domain] = emailLower.split('@');
        
        // Check if email format is completely invalid
        const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!generalEmailRegex.test(email)) {
          setEmailError("Please enter a valid email address");
          return;
        }
        
        if (domain === 'gmail.com' || domain === 'googlemail.com') {
          // Gmail-specific errors
          if (localPart.length > 30) {
            setEmailError("Gmail addresses cannot exceed 30 characters before @");
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Gmail addresses cannot have consecutive dots");
          } else if (/^\.|\.$/.test(localPart)) {
            setEmailError("Gmail addresses cannot start or end with a dot");
          } else if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) {
            setEmailError("Gmail addresses can only contain letters, numbers, dots and plus signs");
          } else {
            setEmailError("Please enter a valid Gmail address");
          }
        } else if (domain === 'yahoo.com') {
          // Yahoo-specific errors
          if (localPart.length > 32) {
            setEmailError("Yahoo addresses cannot exceed 32 characters before @");
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Yahoo addresses cannot have consecutive dots");
          } else if (/^[._-]|[._-]$/.test(localPart)) {
            setEmailError("Yahoo addresses cannot start or end with dots, underscores or hyphens");
          } else if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
            setEmailError("Yahoo addresses can only contain letters, numbers, dots, underscores and hyphens");
          } else {
            setEmailError("Please enter a valid Yahoo address");
          }
        } else {
          // Check if domain is supported
          const allowedTLDs = ['.com', '.gov', '.lk'];
          const isDomainSupported = allowedTLDs.some(tld => domain.endsWith(tld));
          
          if (!isDomainSupported) {
            setEmailError("Please enter a valid email address with a supported domain (.com, .gov, .lk)");
          } else {
            // General validation errors
            if (localPart.length > 64) {
              setEmailError("Email address is too long");
            } else if (/\.{2,}/.test(localPart)) {
              setEmailError("Email addresses cannot have consecutive dots");
            } else if (/^\.|\.$/.test(localPart)) {
              setEmailError("Email addresses cannot start or end with a dot");
            } else if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
              setEmailError("Please enter a valid email address");
            } else {
              setEmailError("Please enter a valid email address");
            }
          }
        }
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
    if (touchedFields.buildingType) {
      if (!buildingType) {
        setBuildingTypeError("Building type is required");
      } else {
        setBuildingTypeError("");
      }
    }
  }, [buildingType, touchedFields.buildingType]);

 // Helper function to capitalize first letter and remove special characters
const formatNameInput = (text: string) => {
  if (!text) return text;
  
  // Remove special characters and numbers using regex
  const filteredText = text.replace(/[^a-zA-Z]/g, '');
  
  // Capitalize first letter and make rest lowercase
  return filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase();
};

  

  // Mark field as touched
  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };


 const fetchCity = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) return;

    setToken(storedToken);

    const response = await axios.get<{ data: City[] }>(
      `${environment.API_BASE_URL}api/customer/get-city`,
      {
        headers: { Authorization: `Bearer ${storedToken}` },
      }
    );
    
    if (response.data && response.data.data) {
      const formattedCities = response.data.data.map(city => ({
        label: city.city,
        value: city.city
      }));
      setCityItems(formattedCities);
    }
  } catch (error) {
    console.error("City fetch error:", error);
  }
};

      useEffect(() => {
        fetchCity()
      }, []);
     



const handleRegister = async () => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  // Mark all fields as touched to show errors
  setTouchedFields({
    ...touchedFields,
    firstName: true,
    lastName: true,
    phoneNumber: true,
  
    buildingType: true
  });
  
  // Validate required fields
  if (!selectedCategory || !firstName || !lastName || !phoneNumber ||  !buildingType) {
    Alert.alert("Error", "Please fill in all required fields.");
    setIsSubmitting(false);
    return;
  }
  
  // Validate building-specific fields
  if (buildingType === "House") {
    if (!houseNo || !streetName || !city) {
      Alert.alert("Error", "Please fill in all required house fields");
      setIsSubmitting(false);
      return;
    }
  } else if (buildingType === "Apartment") {
    if (!buildingNo || !buildingName || !unitNo || !floorNo || !houseNo || !streetName || !city) {
      Alert.alert("Error", "Please fill in all required apartment fields");
      setIsSubmitting(false);
      return;
    }
  }
  
  // Validate phone and email formats
  if (!validatePhoneNumber(phoneNumber)) {
    Alert.alert("Error", "Please enter a valid phone number.");
    setIsSubmitting(false);
    return;
  }
  
   if (email && !validateEmail(email)) {
  //  Alert.alert("Error", "Please enter a valid email address or leave it blank.");
    setIsSubmitting(false);
    return;
  }
  
  
  try {
    const checkResponse = await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
      phoneNumber,
      email: email || null,
    });
    
    const customerData = {
      title: selectedCategory,
      firstName,
      lastName,
      phoneNumber,
      email: email || null,
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
    
    // Check if it's an Axios error
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 400) {
        if (error.response.data.message && 
            error.response.data.message.includes("Phone number or email already exists")) {
          
          // Check which credential is duplicated by making separate API calls
          try {
            // Check if phone number exists by using a unique temporary email
            const tempEmail = `temp_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}@tempcheck.com`;
            
            await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
              phoneNumber,
              email: tempEmail,
            });
            
            // If we reach here, phone number is unique, so email must be duplicated
            Alert.alert(
              "Email Already Exists",
              "This email is already registered. Please sign in or use a different email."
            );
            
          } catch (phoneCheckError: any) {
            if (axios.isAxiosError(phoneCheckError) && 
                phoneCheckError.response?.status === 400 && 
                phoneCheckError.response?.data?.message?.includes("Phone number or email already exists")) {
              
              // Phone number is duplicated, now check if email is also duplicated
              try {
                const tempPhone = `+94${new Date().getTime().toString().substr(-9)}`; // Generate unique temp phone
                
                await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
                  phoneNumber: tempPhone,
                  email,
                });
                
                // If we reach here, email is unique, so only phone is duplicated
                Alert.alert(
                  "Phone Number Already Exists",
                  "This phone number is already registered. Please sign in or use a different phone number."
                );
                
              } catch (emailCheckError: any) {
                if (axios.isAxiosError(emailCheckError) && 
                    emailCheckError.response?.status === 400 && 
                    emailCheckError.response?.data?.message?.includes("Phone number or email already exists")) {
                  
                  // Both phone and email are duplicated
                  Alert.alert(
                    "Account Already Exists",
                    "Both phone number and email are already registered. Please sign in instead."
                  );
                } else {
                  // Email is unique, only phone is duplicated
                  Alert.alert(
                    "Phone Number Already Exists",
                    "This phone number is already registered. Please sign in or use a different phone number."
                  );
                }
              }
            } else {
              // Some other error occurred during phone check
              Alert.alert(
                "Registration Error", 
                "Unable to verify account details. Please try again."
              );
            }
          }
        } else {
          // Different 400 error message
          Alert.alert(
            "Registration Error", 
            error.response.data.message || "Registration failed. Please check your details and try again."
          );
        }
      } else if (error.response && error.response.status === 409) {
        // Handle conflict status if your API uses it for duplicates
        Alert.alert(
          "Account Already Exists",
          "An account with this phone number or email already exists. Please sign in instead."
        );
      } else if (error.response && error.response.status >= 500) {
        // Server error
        Alert.alert(
          "Server Error", 
          "Our servers are experiencing issues. Please try again later."
        );
      } else {
        // Other Axios errors
        Alert.alert(
          "Registration Error", 
          "Registration failed. Please try again."
        );
      }
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') {
      // Network error
      Alert.alert(
        "Network Error", 
        "Please check your internet connection and try again."
      );
    } else {
      // Other errors
      Alert.alert(
        "Registration Error", 
        "Registration failed. Please try again."
      );
    }
  } finally {
    setIsSubmitting(false);
  }
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (text: string) => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};





  const handlePhoneNumberChange = (text: string) => {
  // Always ensure the input starts with +94
  if (!text.startsWith('+94')) {
    // If user tries to delete +94, restore it
    if (text.length < 3) {
      setPhoneNumber('+94');
      return;
    }
    // If user types without +94, add it
    text = '+94' + text.replace(/^\+?94?/, '');
  }
  
  // Limit to 12 characters total (+94 + 9 digits)
  if (text.length > 12) {
    text = text.substring(0, 12);
  }
  
  // Only allow numbers after +94
  const cleanText = text.substring(0, 3) + text.substring(3).replace(/[^0-9]/g, '');
  
  setPhoneNumber(cleanText);
};

 useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Navigate to ViewCustomerScreen instead of going back to main dashboard
        navigation.navigate("CustomersScreen" as any);
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove(); // Cleanup on unmount
    }, [navigation])
  );

const capitalizeWords = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};    




  return (
  
  <KeyboardAvoidingView 
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })} // Adjust this value as needed
    style={{ flex: 1 ,backgroundColor: "white" }}
>
    <SafeAreaView className="flex-1 bg-white">
{/* <KeyboardAwareScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  keyboardShouldPersistTaps="handled"
  enableOnAndroid={true}
> */}
        <View className="flex-1 bg-white py-4 p-2">
          <View className="p-[-2]">
            <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
              {/* <BackButton navigation={navigation} /> */}
               <TouchableOpacity 
                              style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                              onPress={() => navigation.navigate("CustomersScreen")}>
                              <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                                <AntDesign name="left" size={20} color="black" />
                              </View>
                            </TouchableOpacity> 
              
              <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
                New Customer Registration
              </Text>
            </View>
          </View>

          {/* <ScrollView className="flex-1 " keyboardShouldPersistTaps="handled"> */}
          <ScrollView 
  contentContainerStyle={{ 
    paddingBottom: isKeyboardVisible ? 200 : 0 // Adjust this value as needed
  }}
  keyboardShouldPersistTaps="handled"
>
            <View className="p-3 px-6">
              <View className="mb-4 mt-4 flex-row justify-between">
                <View className="flex-[1]">
                  <Text className="text-gray-700 mb-1">Title *</Text>
                  {/* <SelectList
  setSelected={setSelectedCategory} 
  data={[
      { key: 'Rev', value: 'Rev' },
    { key: 'Mr', value: 'Mr' },
    { key: 'Ms', value: 'Ms' },
     { key: 'Mrs', value: 'Mrs' }
      
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
/> */}
<DropDownPicker
  open={titleDropdownOpen}
  value={selectedCategory}
  items={titleItems}
  setOpen={setTitleDropdownOpen}
  setValue={setSelectedCategory}
  setItems={setTitleItems}
  style={{
    backgroundColor: '#F6F6F6',
    borderColor: '#F6F6F6',
    borderRadius: 30,
    paddingVertical: 5,
    minHeight: 40,
  }}
  textStyle={{
    color: 'black',
  }}
  searchable={false}
  placeholder="Title"
  zIndex={1000}
  zIndexInverse={3000}
  dropDownContainerStyle={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
    }}
  listMode="SCROLLVIEW"
  scrollViewProps={{
    nestedScrollEnabled: true,
  }}
/>
                </View>

                <View className="flex-[2] ml-2">
  <Text className="text-gray-700 mb-1">First Name *</Text>

 <TextInput
  className={`bg-[#F6F6F6] border ${firstNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
  placeholder="First Name"
  value={firstName}
  onChangeText={(text) => {
    setFirstName(formatNameInput(text));
    if (touchedFields.firstName && !text) {
      setFirstNameError("First name is required");
    } else if (touchedFields.firstName) {
      setFirstNameError("");
    }
  }}
 
                    onBlur={() => {
                      handleFieldTouch("firstName");
               
                    }}
/>
  {firstNameError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{firstNameError}</Text>
  ) : null}
</View>
              </View>

              <View className="mb-4">
  <Text className="text-gray-700 mb-1">Last Name *</Text>

  <TextInput
  className={`bg-[#F6F6F6] border ${lastNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
  placeholder="Last Name"
  value={lastName}
  onChangeText={(text) => {
    setLastName(formatNameInput(text));
    if (touchedFields.lastName && !text) {
      setLastNameError("Last name is required");
    } else if (touchedFields.lastName) {
      setLastNameError("");
    }
  }}

                  onBlur={() => {
                    handleFieldTouch("lastName");
                  
                  }}
/>
  {lastNameError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{lastNameError}</Text>
  ) : null}
</View>

          <View className="mb-4">
  <Text className="text-gray-700 mb-1">Mobile Number *</Text>
  <TextInput
    className={`bg-[#F6F6F6] border ${phoneError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
    placeholder="+947XXXXXXXX"
    value={phoneNumber}
    onChangeText={handlePhoneNumberChange}
    onBlur={() => handleFieldTouch("phoneNumber")}
    keyboardType="phone-pad"
    maxLength={12}
    onFocus={() => {
      // Ensure +94 is always present when focusing
      if (!phoneNumber || phoneNumber.length < 3) {
        setPhoneNumber('+94');
     
      }
    }}
    
  />
  {phoneError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{phoneError}</Text>
  ) : null}
</View>

              {/* <View className="mb-4">
              <Text className="text-gray-700 mb-1">Email Address *</Text>
              <TextInput
                className={`bg-[#F6F6F6] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
                placeholder="Email Address"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={handleInputFocus}
                  onBlur={() => {
                    handleFieldTouch("email");
                    handleInputBlur();
                  }}
              />
              {emailError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{emailError}</Text>
              ) : null}
            </View> */}
           {/* <View className="mb-4">
  <Text className="text-gray-700 mb-1">Email Address *</Text>
  <TextInput
    className={`bg-[#F6F6F6] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
    placeholder="Email Address"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    value={email}
    onChangeText={(text) => {
      setEmail(text.toLowerCase()); // Normalize to lowercase
      if (touchedFields.email) {
        handleFieldTouch("email");
      }
    }}

  
    onBlur={() => {
      handleFieldTouch("email");
     
    }}
  />
  {emailError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{emailError}</Text>
  ) : null}
</View> */}
<View className="mb-4">
  <Text className="text-gray-700 mb-1">Email Address</Text> {/* Removed * */}
  <TextInput
    className={`bg-[#F6F6F6] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
    placeholder="Email Address "
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    value={email}
    onChangeText={(text) => {
      setEmail(text.toLowerCase());
      if (touchedFields.email) {
        handleFieldTouch("email");
      }
    }}
    onBlur={() => {
      // Only validate if email is provided
      if (email) {
        handleFieldTouch("email");
      }
    }}
  />
  {emailError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{emailError}</Text>
  ) : null}
</View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Building Type *</Text>
             
       <DropDownPicker
    open={openBuildingTypeDropdown}
    value={buildingType}
    items={buildingTypeItems}
    setOpen={setOpenBuildingTypeDropdown}
    setValue={setBuildingType}
    setItems={setBuildingTypeItems}
    placeholder="Select Building Type"
    style={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
      borderRadius: 30,
    }}
    dropDownContainerStyle={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
    }}
    textStyle={{
      fontSize: 14,
      color: 'black',
      marginLeft: 15,
    }}
    placeholderStyle={{
      color: 'gray',
      marginLeft: 15,
    }}
    listItemLabelStyle={{
      color: 'black',
    }}
    showTickIcon={true}
    activityIndicatorColor="#6E3DD1"
    searchable={false}
   listMode="SCROLLVIEW"
  scrollViewProps={{
    nestedScrollEnabled: true,
  }}
   
  />
 
    
              </View>

              {buildingType === "House" && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Building / House No *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Building / House No (e.g., 14/B)"
                      value={houseNo}
                    //  onChangeText={setHouseNo}
                                       onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setHouseNo(capitalizedText);
  }}
                      autoCapitalize="words" 
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Street Name *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                    //  onChangeText={setStreetName}
                     onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setStreetName(capitalizedText);
  }}
                       autoCapitalize="words" 
                    />
                  </View>
             <View className="mb-4 z-10">
  <Text className="text-gray-700 mb-1">Nearest City *</Text>
  <DropDownPicker
    open={openCityDropdown}
    value={city}
    items={cityItems}
    setOpen={setOpenCityDropdown}
    setValue={setCity}
    setItems={setCityItems}
    placeholder="Select Nearest City"
    style={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
      borderRadius: 30,
    }}
    dropDownContainerStyle={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
    }}
    textStyle={{
      fontSize: 14,
      color: 'black',
      marginLeft:15
    }}
   placeholderStyle={{
  color: 'gray',
  marginLeft: 15,
}}

    listItemLabelStyle={{
      color: 'black',
    }}
    showTickIcon={true}
    activityIndicatorColor="#6E3DD1"
    searchable={true}
    modalProps={{
      animationType: "fade",
    }}
    listMode="MODAL"
  />
</View>
                </>
              )}

              {buildingType === "Apartment" && (
                <>
                  <View className="mb-4">
                   <Text className="text-gray-700 mb-1">Apartment / Building No *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={buildingNo}
                   //   onChangeText={setbuildingNo}
                     onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setbuildingNo(capitalizedText);
  }}
                     autoCapitalize="words" 
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Apartment / Building Name *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Apartment / Building Name"
                      value={ buildingName}
                    //  onChangeText={ setbuildingName}
                                         onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setbuildingName(capitalizedText);
  }}
                      autoCapitalize="words" 
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Flat / Unit Number *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : Building B"
                      value={unitNo}
                    //  onChangeText={setunitNo}
                    onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setunitNo(capitalizedText);
  }}
                      autoCapitalize="words" 
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Floor Number *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : 3rd Floor"
                      value={floorNo}
                   //   onChangeText={setfloorNo}
                         onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setfloorNo(capitalizedText);
  }}
                      autoCapitalize="words" 
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">House No *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="ex : 14"
                      value={houseNo}
                     // onChangeText={setHouseNo}
                                            onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setHouseNo(capitalizedText);
  }}
                    autoCapitalize="words" 
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-gray-700 mb-1">Street Name *</Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-6 h-10"
                      placeholder="Street Name"
                      value={streetName}
                     // onChangeText={setStreetName}
                      onChangeText={(text) => {
    const capitalizedText = capitalizeWords(text);
    setStreetName(capitalizedText);
  }}
                      autoCapitalize="words" 
                    />
                  </View>
              <View className="mb-4 z-10">
  <Text className="text-gray-700 mb-1">Nearest City *</Text>
  <DropDownPicker
    open={openCityDropdown}
    value={city}
    items={cityItems}
    setOpen={setOpenCityDropdown}
    setValue={setCity}
    setItems={setCityItems}
    placeholder="Select Nearest City"
    style={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
      borderRadius: 30,
    }}
    dropDownContainerStyle={{
      backgroundColor: '#F6F6F6',
      borderColor: '#F6F6F6',
    }}
    textStyle={{
      fontSize: 14,
      color: 'black',
      marginLeft:15
    }}
    placeholderStyle={{
      color: 'gray',
      marginLeft:15
    }}
    listItemLabelStyle={{
      color: 'black',
    }}
    showTickIcon={true}
    activityIndicatorColor="#6E3DD1"
    searchable={true}
    modalProps={{
      animationType: "fade",
    }}
    listMode="MODAL"
  />
</View>
                </>
              )}

             
{/* <TouchableOpacity 
  onPress={handleRegister}
  disabled={isSubmitting || loading}
>
  <LinearGradient 
    colors={["#854BDA", "#6E3DD1"]} 
    className="py-3 px-4 items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15"
  >
    {isSubmitting || loading ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <Text className="text-center text-white font-bold">Register</Text>
    )}
  </LinearGradient>
</TouchableOpacity> */}
<TouchableOpacity 
  onPress={handleRegister}
  disabled={isSubmitting || loading}
  className="mb-[40%]"
>
  <LinearGradient 
    colors={["#854BDA", "#6E3DD1"]} 
    className="py-3 px-4 items-center mt-6 mb-[2%] mr-[20%] ml-[20%] rounded-3xl h-15 "
  >
    {isSubmitting || loading ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <Text className="text-center text-white font-bold">Register</Text>
    )}
  </LinearGradient>
</TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
 
   
  );
};

export default AddCustomersScreen;
