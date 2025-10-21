import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard,  KeyboardAvoidingView, Alert, ActivityIndicator, BackHandler } from "react-native";
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
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar, Platform } from "react-native";





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
  const [houseNoError, setHouseNoError] = useState<string>("");
const [streetNameError, setStreetNameError] = useState<string>("");
const [cityError, setCityError] = useState<string>("");
const [buildingNoError, setBuildingNoError] = useState<string>("");
const [buildingNameError, setBuildingNameError] = useState<string>("");
const [unitNoError, setUnitNoError] = useState<string>("");
const [floorNoError, setFloorNoError] = useState<string>("");
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
  lastName: false,
  title: false,
  buildingType: false,
  houseNo: false,
  streetName: false,
  city: false,
  buildingNo: false,
  buildingName: false,
  unitNo: false,
  floorNo: false
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
  setHouseNoError("");
  setStreetNameError("");
  setCityError("");
  setBuildingNoError("");
  setBuildingNameError("");
  setUnitNoError("");
  setFloorNoError("");
  setIsSubmitting(false);
  setTouchedFields({
    email: false,
    phoneNumber: false,
    firstName: false,
    lastName: false,
    title: false,
    buildingType: false,
    houseNo: false,
    streetName: false,
    city: false,
    buildingNo: false,
    buildingName: false,
    unitNo: false,
    floorNo: false
  });
};

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
      Alert.alert('Error', 'Please enter a mobile number.');
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
        source: "PolygonAgro", 
        transport: "sms",   
        // content: {
        //   sms: "Your code is {{code}}",  
        // },
         content: { sms: "Thank you for registering with us a GoviMart customer. Please use the bellow OTP to confirm the registration process. {{code}}" },
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
        setPhoneError("Mobile number is required");
      } else if (!validatePhoneNumber(phoneNumber)) {
        setPhoneError("Please enter a valid mobile number (format: +947XXXXXXXX)");
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

  useEffect(() => {
  if (touchedFields.houseNo) {
    if (!houseNo) {
      setHouseNoError("House number is required");
    } else {
      setHouseNoError("");
    }
  }
}, [houseNo, touchedFields.houseNo]);

useEffect(() => {
  if (touchedFields.streetName) {
    if (!streetName) {
      setStreetNameError("Street name is required");
    } else {
      setStreetNameError("");
    }
  }
}, [streetName, touchedFields.streetName]);

useEffect(() => {
  if (touchedFields.city) {
    if (!city) {
      setCityError("City is required");
    } else {
      setCityError("");
    }
  }
}, [city, touchedFields.city]);

useEffect(() => {
  if (touchedFields.buildingNo) {
    if (!buildingNo) {
      setBuildingNoError("Building number is required");
    } else {
      setBuildingNoError("");
    }
  }
}, [buildingNo, touchedFields.buildingNo]);

useEffect(() => {
  if (touchedFields.buildingName) {
    if (!buildingName) {
      setBuildingNameError("Building name is required");
    } else {
      setBuildingNameError("");
    }
  }
}, [buildingName, touchedFields.buildingName]);

useEffect(() => {
  if (touchedFields.unitNo) {
    if (!unitNo) {
      setUnitNoError("Unit number is required");
    } else {
      setUnitNoError("");
    }
  }
}, [unitNo, touchedFields.unitNo]);

useEffect(() => {
  if (touchedFields.floorNo) {
    if (!floorNo) {
      setFloorNoError("Floor number is required");
    } else {
      setFloorNoError("");
    }
  }
}, [floorNo, touchedFields.floorNo]);

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
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    title: true,
    buildingType: true,
    houseNo: true,
    streetName: true,
    city: true,
    buildingNo: true,
    buildingName: true,
    unitNo: true,
    floorNo: true
  });
  
  // Validate required fields
  if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
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
    Alert.alert("Error", "Please enter a valid mobile number.");
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
      email: email ,
    });
    
    const customerData = {
      title: selectedCategory,
      firstName,
      lastName,
      phoneNumber,
      email: email,
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
            error.response.data.message.includes("Mobile number or email already exists")) {
          
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
                phoneCheckError.response?.data?.message?.includes("Mobile number or email already exists")) {
              
              // Phone number is duplicated, now check if email is also duplicated
              try {
                const tempPhone = `+94${new Date().getTime().toString().substr(-9)}`; // Generate unique temp phone
                
                await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
                  phoneNumber: tempPhone,
                  email,
                });
                
                // If we reach here, email is unique, so only phone is duplicated
                Alert.alert(
                  "Mobile Number Already Exists",
                  "This Mobile number is already registered. Please sign in or use a different mobile number."
                );
                
              } catch (emailCheckError: any) {
                if (axios.isAxiosError(emailCheckError) && 
                    emailCheckError.response?.status === 400 && 
                    emailCheckError.response?.data?.message?.includes("Mobile number or email already exists")) {
                  
                  // Both phone and email are duplicated
                  Alert.alert(
                    "Account Already Exists",
                    "Both Mobile number and email are already registered. Please sign in instead."
                  );
                } else {
                  // Email is unique, only phone is duplicated
                  Alert.alert(
                    "Mobile Number Already Exists",
                    "This Mobile number is already registered. Please sign in or use a different mobile number."
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
          "An account with this mobile number or email already exists. Please sign in instead."
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
      borderColor: titleError ? '#EF4444' : '#F6F6F6',
      borderWidth: titleError ? 1 : 1,
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
      borderColor: titleError ? '#EF4444' : '#F6F6F6',
    }}
    listMode="SCROLLVIEW"
    scrollViewProps={{
      nestedScrollEnabled: true,
    }}
    onClose={() => {
      if (!selectedCategory) {
        handleFieldTouch("title");
      }
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
           <View className="mb-4">
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
</View>
{/* <View className="mb-4">
  <Text className="text-gray-700 mb-1">Email Address *</Text>
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
</View> */}

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
      borderColor: buildingTypeError ? '#EF4444' : '#F6F6F6',
      borderWidth: buildingTypeError ? 1 : 1,
      borderRadius: 30,
    }}
    dropDownContainerStyle={{
      backgroundColor: '#F6F6F6',
      borderColor: buildingTypeError ? '#EF4444' : '#F6F6F6',
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
    onClose={() => {
      if (!buildingType) {
        handleFieldTouch("buildingType");
      }
    }}
  />
  {buildingTypeError ? (
    <Text className="text-red-500 text-xs pl-4 pt-1">{buildingTypeError}</Text>
  ) : null}
</View>

             {buildingType === "House" && (
  <>
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Building / House No *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Building / House No (e.g., 14/B)"
        value={houseNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setHouseNo(capitalizedText);
          if (touchedFields.houseNo && !text) {
            setHouseNoError("House number is required");
          } else if (touchedFields.houseNo) {
            setHouseNoError("");
          }
        }}
        onBlur={() => handleFieldTouch("houseNo")}
        autoCapitalize="words"
      />
      {houseNoError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{houseNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Street Name *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Street Name"
        value={streetName}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setStreetName(capitalizedText);
          if (touchedFields.streetName && !text) {
            setStreetNameError("Street name is required");
          } else if (touchedFields.streetName) {
            setStreetNameError("");
          }
        }}
        onBlur={() => handleFieldTouch("streetName")}
        autoCapitalize="words"
      />
      {streetNameError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{streetNameError}</Text>
      ) : null}
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
          borderColor: cityError ? '#EF4444' : '#F6F6F6',
          borderWidth: cityError ? 1 : 1,
          borderRadius: 30,
        }}
        dropDownContainerStyle={{
          backgroundColor: '#F6F6F6',
          borderColor: cityError ? '#EF4444' : '#F6F6F6',
        }}
        textStyle={{
          fontSize: 14,
          color: 'black',
          marginLeft: 15
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
        
        listMode="MODAL"
        onClose={() => {
          if (!city) {
            handleFieldTouch("city");
          }
        }}
             onOpen={dismissKeyboard}
                           zIndex={7900}
                        modalProps={{
             animationType: "slide",
             transparent: false,
             presentationStyle: "fullScreen",
             statusBarTranslucent: true,
           }}
           modalContentContainerStyle={{
             paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 0,
             backgroundColor: '#fff',
             flex: 1,
           }}
      />
      {cityError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{cityError}</Text>
      ) : null}
    </View>
  </>
)}

{buildingType === "Apartment" && (
  <>
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Apartment / Building No *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${buildingNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Apartment / Building Name"
        value={buildingNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setbuildingNo(capitalizedText);
          if (touchedFields.buildingNo && !text) {
            setBuildingNoError("Building number is required");
          } else if (touchedFields.buildingNo) {
            setBuildingNoError("");
          }
        }}
        onBlur={() => handleFieldTouch("buildingNo")}
        autoCapitalize="words"
      />
      {buildingNoError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{buildingNoError}</Text>
      ) : null}
    </View>

    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Apartment / Building Name *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${buildingNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Apartment / Building Name"
        value={buildingName}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setbuildingName(capitalizedText);
          if (touchedFields.buildingName && !text) {
            setBuildingNameError("Building name is required");
          } else if (touchedFields.buildingName) {
            setBuildingNameError("");
          }
        }}
        onBlur={() => handleFieldTouch("buildingName")}
        autoCapitalize="words"
      />
      {buildingNameError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{buildingNameError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Flat / Unit Number *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${unitNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="ex : Building B"
        value={unitNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setunitNo(capitalizedText);
          if (touchedFields.unitNo && !text) {
            setUnitNoError("Unit number is required");
          } else if (touchedFields.unitNo) {
            setUnitNoError("");
          }
        }}
        onBlur={() => handleFieldTouch("unitNo")}
        autoCapitalize="words"
      />
      {unitNoError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{unitNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Floor Number *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${floorNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="ex : 3rd Floor"
        value={floorNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setfloorNo(capitalizedText);
          if (touchedFields.floorNo && !text) {
            setFloorNoError("Floor number is required");
          } else if (touchedFields.floorNo) {
            setFloorNoError("");
          }
        }}
        onBlur={() => handleFieldTouch("floorNo")}
        autoCapitalize="words"
      />
      {floorNoError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{floorNoError}</Text>
      ) : null}
    </View>

    <View className="mb-4">
      <Text className="text-gray-700 mb-1">House No *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="ex : 14"
        value={houseNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setHouseNo(capitalizedText);
          if (touchedFields.houseNo && !text) {
            setHouseNoError("House number is required");
          } else if (touchedFields.houseNo) {
            setHouseNoError("");
          }
        }}
        onBlur={() => handleFieldTouch("houseNo")}
        autoCapitalize="words"
      />
      {houseNoError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{houseNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Street Name *</Text>
      <TextInput
        className={`bg-[#F6F6F6] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Street Name"
        value={streetName}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setStreetName(capitalizedText);
          if (touchedFields.streetName && !text) {
            setStreetNameError("Street name is required");
          } else if (touchedFields.streetName) {
            setStreetNameError("");
          }
        }}
        onBlur={() => handleFieldTouch("streetName")}
        autoCapitalize="words"
      />
      {streetNameError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{streetNameError}</Text>
      ) : null}
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
        placeholder={city || "Select Nearest City"}
           searchable={true}
           searchPlaceholder="Search city..."
           style={{
             backgroundColor: '#F6F6F6',
             borderColor: cityError ? '#EF4444' : '#F6F6F6',
             borderWidth: cityError ? 1 : 1,
             borderRadius: 30,
             minHeight: 40,
           }}
           dropDownContainerStyle={{
             backgroundColor: '#ffffff',
             borderColor: cityError ? '#EF4444' : '#F6F6F6',
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
         //  zIndex={3000}
           zIndexInverse={1000}
          
           listMode="MODAL"
           scrollViewProps={{ nestedScrollEnabled: true }}
           onClose={() => {
             if (!city) {
               handleFieldTouch("city");
             }
           }}
            onOpen={dismissKeyboard}
                           zIndex={7900}
                        modalProps={{
             animationType: "slide",
             transparent: false,
             presentationStyle: "fullScreen",
             statusBarTranslucent: true,
           }}
           modalContentContainerStyle={{
             paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 0,
             backgroundColor: '#fff',
             flex: 1,
           }}
      />
      {cityError ? (
        <Text className="text-red-500 text-xs pl-4 pt-1">{cityError}</Text>
      ) : null}
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
      </KeyboardAvoidingView>
 
   
  );
};

export default AddCustomersScreen;
