import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, KeyboardAvoidingView,  Alert, ActivityIndicator, BackHandler, Linking } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "../common/BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";
import { AntDesign, Entypo, FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, Platform } from "react-native";


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
  title: false,
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
  const [phoneError, setPhoneError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [buildingTypeError, setBuildingTypeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [houseNoError, setHouseNoError] = useState<string>("");
const [streetNameError, setStreetNameError] = useState<string>("");
const [cityError, setCityError] = useState<string>("");
const [buildingNoError, setBuildingNoError] = useState<string>("");
const [buildingNameError, setBuildingNameError] = useState<string>("");
const [unitNoError, setUnitNoError] = useState<string>("");
const [floorNoError, setFloorNoError] = useState<string>("");
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
  const [originalEmail, setOriginalEmail] = useState('');

  const isReturningFromMapRef = useRef(false);
const lastFetchedIdRef = useRef<string | null>(null);
const hasLoadedOnce = useRef(false);
  // Add these states after line 44 (after originalPhoneNumber state)
const [latitude, setLatitude] = useState<string>("");
const [longitude, setLongitude] = useState<string>("");
const [locationName, setLocationName] = useState<string>("");
  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);

  

  // Validation regex
  const phoneRegex = /^\+947\d{8}$/;
 // const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const nameRegex = /^[A-Z][a-z]*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Helper functions
  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  // const validateEmail = (email: string) => emailRegex.test(email);
  const validateName = (name: string) => nameRegex.test(name);

 const validateEmail = (email: string) => {
  if (!emailRegex.test(email)) {
    return false;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domainPart] = parts;
  
  // Check local part length
  if (localPart.length < 1 || localPart.length > 64) return false;
  
  // Check domain part length
  if (domainPart.length < 1 || domainPart.length > 255) return false;
  
  // Check for consecutive dots
  if (localPart.includes('..') || domainPart.includes('..')) return false;
  
  // Check for special characters at start/end
  if (/^[._-]/.test(localPart) || /[._-]$/.test(localPart)) return false;
  
  // Check for allowed domains
  const allowedDomains = ['gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com'];
  const allowedTlds = ['.com', '.lk', '.gov'];
  
  // Check if domain is in allowed list or has allowed TLD
  const domainLower = domainPart.toLowerCase();
  const hasAllowedTld = allowedTlds.some(tld => domainLower.endsWith(tld));
  
  if (!allowedDomains.includes(domainLower) && !hasAllowedTld) {
    return false;
  }
  
  // Additional Gmail-specific rules
  if (domainLower === 'gmail.com' || domainLower === 'googlemail.com') {
    // Gmail doesn't allow consecutive dots
    if (/\.{2,}/.test(localPart)) return false;
    
    // Gmail doesn't allow dots at start or end
    if (/^\.|\.$/.test(localPart)) return false;
    
    // Gmail only allows certain characters
    if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) return false;
  }
  
  return true;
};
  const resetFormToOriginalState = async () => {
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
        setOriginalEmail(customerData.email || '');
        
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
    }
  };


  
  const formatNameInput = (text: string) => {
    if (!text) return text;
    const filteredText = text.replace(/[^a-zA-Z]/g, '');
    return filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase();
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };


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
        setPhoneError("Mobile number is required");
      } else if (!validatePhoneNumber(phoneNumber)) {
        setPhoneError("Please enter a valid Mobile number (format: +947XXXXXXXX)");
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

  useEffect(() => {
  if (touchedFields.houseNo) {
    if (buildingType === "House" && !houseNo) {
      setHouseNoError("Building/House number is required");
    } else if (buildingType === "Apartment" && !houseNo) {
      setHouseNoError("Building/House number is required");
    } else {
      setHouseNoError("");
    }
  }
}, [houseNo, touchedFields.houseNo, buildingType]);

useEffect(() => {
  if (touchedFields.streetName) {
    if ((buildingType === "House" || buildingType === "Apartment") && !streetName) {
      setStreetNameError("Street name is required");
    } else {
      setStreetNameError("");
    }
  }
}, [streetName, touchedFields.streetName, buildingType]);

useEffect(() => {
  if (touchedFields.city) {
    if ((buildingType === "House" || buildingType === "Apartment") && !city) {
      setCityError("City is required");
    } else {
      setCityError("");
    }
  }
}, [city, touchedFields.city, buildingType]);

useEffect(() => {
  if (touchedFields.buildingNo) {
    if (buildingType === "Apartment" && !buildingNo) {
      setBuildingNoError("Building number is required");
    } else {
      setBuildingNoError("");
    }
  }
}, [buildingNo, touchedFields.buildingNo, buildingType]);

useEffect(() => {
  if (touchedFields.buildingName) {
    if (buildingType === "Apartment" && !buildingName) {
      setBuildingNameError("Building name is required");
    } else {
      setBuildingNameError("");
    }
  }
}, [buildingName, touchedFields.buildingName, buildingType]);

useEffect(() => {
  if (touchedFields.unitNo) {
    if (buildingType === "Apartment" && !unitNo) {
      setUnitNoError("Flat/Unit number is required");
    } else {
      setUnitNoError("");
    }
  }
}, [unitNo, touchedFields.unitNo, buildingType]);

useEffect(() => {
  if (touchedFields.floorNo) {
    if (buildingType === "Apartment" && !floorNo) {
      setFloorNoError("Floor number is required");
    } else {
      setFloorNoError("");
    }
  }
}, [floorNo, touchedFields.floorNo, buildingType]);

  // Fetch initial data
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) setToken(storedToken);
    };
    
    getToken();
  }, []);




const resetFormState = () => {
  setSelectedCategory("");
  setFirstName("");
  setLastName("");
  setPhoneNumber("");
  setEmail("");
  setHouseNo("");
  setStreetName("");
  setCity("");
  setBuildingNo("");
  setFloorNo("");
  setUnitNo("");
  setOpen(false);
  setBuildingName("");
  setBuildingType("");
  setOriginalBuildingType("");
  setOriginalPhoneNumber("");
  setOriginalEmail("");
  
  // Add these lines
  setLatitude("");
  setLongitude("");
  setLocationName("");
  
  // Reset ALL error states
  setFirstNameError("");
  setLastNameError("");
  setPhoneError("");
  setEmailError("");
  setBuildingTypeError("");
  setTitleError("");
  setHouseNoError("");
  setStreetNameError("");
  setCityError("");
  setBuildingNoError("");
  setBuildingNameError("");
  setUnitNoError("");
  setFloorNoError("");
  
  // Reset ALL touched fields
  setTouchedFields({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
    buildingType: false,
    title: false,
    houseNo: false,
    streetName: false,
    city: false,
    buildingNo: false,
    buildingName: false,
    unitNo: false,
    floorNo: false
  });
};


useEffect(() => {

}, [latitude, longitude, locationName]);


  const dismissKeyboard = () => {
      Keyboard.dismiss();
    };
 
const fetchCustomerData = async () => {
  try {
    setLoading(true);
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
      setOriginalEmail(customerData.email || '');
      
      // Add these lines to load geolocation data
      setLatitude(customerData.latitude || "");
      setLongitude(customerData.longitude || "");
      
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
  } finally {
    setLoading(false);
  }
};
  const handleLocationSelect = (lat: number, lng: number, name: string) => {
  setLatitude(lat.toString());
  setLongitude(lng.toString());
  setLocationName(name);
  isReturningFromMapRef.current = true; // Mark as returning from map
};


  useFocusEffect(
  React.useCallback(() => {

    
    if (isReturningFromMapRef.current) {
      isReturningFromMapRef.current = false; // Reset flag
      return; 
    }
    
    const shouldLoadData = !hasLoadedOnce.current || lastFetchedIdRef.current !== id;
    
    if (shouldLoadData) {
      
      const loadData = async () => {
        try {
          setLoading(true);
          
          // Clear all fields before loading new customer data
          resetFormState();
          
          // Fetch the data
          await fetchCustomerData();
          
          // Mark as loaded
          hasLoadedOnce.current = true;
          lastFetchedIdRef.current = id;
          
        } catch (error) {
          console.error("❌ Error loading customer data:", error);
          Alert.alert("Error", "Failed to load customer data.");
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    } else {
      console.log("✅ Already have data for customer:", id);
    }
    
    return () => {
      console.log("👋 EditCustomerScreen blurred");
    };
  }, [id]) 
);

useEffect(() => {
  return () => {
    isReturningFromMapRef.current = false;
  };
}, []);


  const navigateToMapScreen = () => {
    isReturningFromMapRef.current = true; // Mark before navigation
    navigation.navigate("AttachGeoLocationScreenEdit" as any, {
      currentLatitude: latitude ? parseFloat(latitude) : undefined,
      currentLongitude: longitude ? parseFloat(longitude) : undefined,
      onLocationSelect: handleLocationSelect,
    });
  };

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
      Alert.alert('Error', 'Please enter a mobile number.');
      return { status: 400 };
    }

    try {
      setLoading(true);
      const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");

      const response = await axios.post(
        "https://api.getshoutout.com/otpservice/send",
        {
          source: "PolygonAgro",
          transport: "sms",
        //  content: { sms: "Your code is {{code}}" },
         content: { sms: "Thank you for registering with us a Market Place customer. Please use the bellow OTP to confirm the registration process. {{code}}" },
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
  const touchedFieldsToUpdate = {
    firstName: true,
    lastName: true,
    phoneNumber: true,
    email: true,
    buildingType: true,
    title: true,
    houseNo: buildingType === "House" || buildingType === "Apartment",
    streetName: buildingType === "House" || buildingType === "Apartment",
    city: buildingType === "House" || buildingType === "Apartment",
    buildingNo: buildingType === "Apartment",
    buildingName: buildingType === "Apartment",
    unitNo: buildingType === "Apartment",
    floorNo: buildingType === "Apartment"
  };

  setTouchedFields(touchedFieldsToUpdate);


  // Clear any previous validation errors
  setPhoneError("");
  setEmailError("");

 
if (!selectedCategory || !firstName || !lastName || !phoneNumber || !buildingType) {
  Alert.alert("Error", "Please fill in all required fields.");
  return;
}

  // Validate formats
  if (!validatePhoneNumber(phoneNumber)) {
    Alert.alert("Error", "Please enter a valid mobile number (format: +947XXXXXXXX).");
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
    // Check if phone number or email has changed
    const phoneNumberChanged = phoneNumber !== originalPhoneNumber;
    const emailChanged = email !== originalEmail; // You need to add originalEmail to your state

    // Check for existing phone/email when either has changed
    if (phoneNumberChanged || emailChanged) {
      try {

        
        const checkResponse = await axios.post(
          `${environment.API_BASE_URL}api/customer/check-customer`,
          { 
            phoneNumber, 
            email: email || null,
            excludeId: id // Add this to exclude current user from check
          },
          { 
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 10000
          }
        );

            
      } catch (checkError: any) {
        console.log("Customer check error:", checkError);
        
        // Handle different types of errors
        if (checkError.code === 'ECONNABORTED') {
          Alert.alert("Error", "Request timed out. Please check your internet connection and try again.");
          return;
        }
        
        if (checkError.response) {
          // Server responded with an error status
          const status = checkError.response.status;
          const errorData = checkError.response.data;
          
          if (status === 400) {
            // Handle validation errors
            const errorMessage = errorData.message || "Validation failed";
            
            if (errorMessage.includes("Mobile Number already exists")) {
              setPhoneError("This mobile number is already registered.");
              Alert.alert(
                "Mobile Number Already Exists", 
                "This mobile number is already registered. Please use a different mobile number."
              );
              return;
            } else if (errorMessage.includes("Email already exists")) {
              setEmailError("This email address is already registered.");
              Alert.alert(
                "Email Already Exists", 
                "This email address is already registered. Please use a different email address."
              );
              return;
            } else if (errorMessage.includes("Mobile Number and Email already exist")) {
              setPhoneError("This mobile number is already registered.");
              setEmailError("This email address is already registered.");
              Alert.alert(
                "Account Already Exists", 
                "Both mobile number and email are already registered. Please use different credentials."
              );
              return;
            } else {
              Alert.alert("Validation Error", errorMessage);
              return;
            }
          } else if (status === 500) {
            // Server error
            console.error("Server error during validation:", errorData);
            Alert.alert(
              "Server Error", 
              "There was a problem validating your information. Please try again in a moment."
            );
            return;
          } else {
            // Other HTTP errors
            Alert.alert("Error", `Validation failed (${status}). Please try again.`);
            return;
          }
        } else if (checkError.request) {
          // Network error
          console.error("Network error:", checkError.request);
          Alert.alert(
            "Network Error", 
            "Unable to connect to the server. Please check your internet connection and try again."
          );
          return;
        } else {
          // Other error
          console.error("Unexpected error:", checkError.message);
          Alert.alert("Error", "An unexpected error occurred. Please try again.");
          return;
        }
      }

      // Send OTP only if phone number changed
      if (phoneNumberChanged) {
        try {
          const otpResponse = await sendOTP();
          if (otpResponse.status !== 200) {
            Alert.alert("Error", "Failed to send OTP. Please try again.");
            return;
          }
        } catch (otpError) {
          console.error("OTP sending error:", otpError);
          Alert.alert("Error", "Failed to send OTP. Please try again.");
          return;
        }
      }
    }

    // Prepare data for update
const customerData = {
  title: selectedCategory,
  firstName,
  lastName,
  phoneNumber,
  email,
  buildingType,
  latitude: latitude || null,
  longitude: longitude || null,
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

    if (phoneNumberChanged) {
      // Store data and navigate to OTP screen
      await AsyncStorage.setItem("pendingCustomerData", JSON.stringify({ 
        customerData, 
        buildingData,
        originalBuildingType
      }));
      navigation.navigate("OtpScreenUp", { phoneNumber, id, token });
    } else {
      // Direct update without OTP (phone number unchanged)
      try {
        const response = await axios.put(
          `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
          { ...customerData, buildingData, originalBuildingType },
          { 
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 15000 // 15 second timeout for update
          }
        );

        if (response.status === 200) {
          Alert.alert("Success", "Customer updated successfully.");
        //  navigation.goBack();
          navigation.navigate("ViewCustomerScreen" as any, { 
           id: id, 
           customerId: customerId, 
           name: name, 
           title: title 
         });
        }
      } catch (updateError: any) {
        console.error("Update error:", updateError);
        if (updateError.response?.status === 400) {
          const errorMessage = updateError.response.data.message || "Failed to update customer data.";
          
          // Handle specific backend validation errors
          if (errorMessage.includes("Email already exists")) {
            setEmailError("This email address is already registered.");
            Alert.alert("Email Already Exists", "This email address is already registered. Please use a different email address.");
          } else if (errorMessage.includes("Mobile Number already exists")) {
            setPhoneError("This mobile number is already registered.");
            Alert.alert("Mobile Number Already Exists", "This mobile number is already registered. Please use a different mobile number.");
          } else {
            Alert.alert("Update Error", errorMessage);
          }
        } else {
          Alert.alert("Error", "Failed to update customer. Please try again.");
        }
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in handleRegister:", error);
    Alert.alert("Error", "An unexpected error occurred. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

// Enhanced input handlers with error clearing
const handlePhoneNumberChangeWithErrorClear = (text: string) => {
  if (phoneError) {
    setPhoneError("");
  }
  handlePhoneNumberChange(text);
};

const handleEmailChangeWithErrorClear = (text: string) => {
  // Clear error if present
  if (emailError) {
    setEmailError("");
  }
  
  // Convert to lowercase and update state
  setEmail(text.toLowerCase());
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


// Enhanced phone number change handler
const handlePhoneNumberChange = (text: string) => {
  // Always ensure +94 prefix is maintained
  if (!text.startsWith('+94')) {
    // If user tries to remove +94, restore it
    if (text.length < 3) {
      setPhoneNumber('+94');
      return;
    }
    // If text doesn't start with +94, add it
    const cleanedText = text.replace(/^\+?94?/, '');
    setPhoneNumber('+94' + cleanedText.replace(/[^\d]/g, ''));
    return;
  }
  
  // If text starts with +94, validate the rest
  const numberPart = text.slice(3); // Remove +94 part
  
  // Only allow digits after +94 and limit to 9 digits (total 12 chars)
  const cleanedNumber = numberPart.replace(/[^\d]/g, '');
  
  // Limit to 9 digits after +94 (making total +94XXXXXXXXX format)
  if (cleanedNumber.length <= 9) {
    setPhoneNumber('+94' + cleanedNumber);
  }
};

// Enhanced onFocus handler
const handlePhoneNumberFocus = () => {
  // Ensure +94 is there when focused and field is empty or too short
  if (phoneNumber === "" || phoneNumber.length < 3) {
    setPhoneNumber("+94");
  }
};

// Enhanced onKeyPress handler for better control
const handlePhoneNumberKeyPress = (e: any) => {
  const { key } = e.nativeEvent;
  
  // Prevent deletion if trying to delete +94 prefix
  if (key === 'Backspace' && phoneNumber.length <= 3) {
    e.preventDefault();
    return false;
  }
};

 useFocusEffect(
     useCallback(() => {
       const onBackPress = () => {
         // Navigate to ViewCustomerScreen instead of going back to main dashboard
         navigation.navigate("ViewCustomerScreen" as any, { 
           id: id, 
           customerId: customerId, 
           name: name, 
           title: title 
         });
         return true; // Prevent default back behavior
       };
 
       const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
 
       return () => backHandler.remove(); // Cleanup on unmount
     }, [navigation, id, customerId, name, title])
   );  

   const capitalizeWords = (text :string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};


  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator></ActivityIndicator>
        <Text className="text-[#6839CF]  font-semibold mt-4">
          Loading Customer Data...
        </Text>
      </View>
    );
  }




  return (
 
       <KeyboardAvoidingView 
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })} // Adjust this value as needed
       style={{ flex: 1 ,backgroundColor: "white" }}
     >
           <View className="flex-1 bg-white">
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
        borderColor: titleError ? '#EF4444' : '#F6F6F6',
        borderWidth: titleError ? 1 : 1,
        borderRadius: 30,
        minHeight: 40,
      }}
      textStyle={{
        fontSize: 14,
        textAlignVertical: "center",
      }}
      dropDownContainerStyle={{
        backgroundColor: '#ffffff',
        borderColor: titleError ? '#EF4444' : '#F6F6F6',
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
                    // onBlur={() => handleFieldTouch("firstName") }
                    autoCapitalize="words"
             
                      //  onFocus={handleInputFocus}
                    onBlur={() => {
                      handleFieldTouch("firstName");
                   
                    }}
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
                  // onBlur={() => handleFieldTouch("lastName")}
                
                  onBlur={() => {
                    handleFieldTouch("lastName");
                  
                  }}
                  autoCapitalize="words"
                />
                {lastNameError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{lastNameError}</Text>
                ) : null}
              </View>

       <View className="mb-4">
  <RequiredField>Mobile Number</RequiredField>
  <TextInput
    className={`bg-[#F6F6F6] border rounded-full px-6 h-10 ${
      phoneError ? 'border-red-500' : 'border-[#F6F6F6]'
    }`}
    placeholder="ex: +94771234567"
    keyboardType="phone-pad"
    value={phoneNumber}
    onChangeText={handlePhoneNumberChangeWithErrorClear}
    onBlur={() => handleFieldTouch("phoneNumber")}
    onFocus={() => {
      handlePhoneNumberFocus();
   
    }}
    onKeyPress={handlePhoneNumberKeyPress}
    maxLength={12}
    selection={phoneNumber.length <= 3 ? { start: 3, end: 3 } : undefined}
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
    placeholder="Email Address "
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    value={email}
    onChangeText={handleEmailChangeWithErrorClear}
    onBlur={() => {
      handleFieldTouch("email");
    }}
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
      borderColor: buildingTypeError ? '#EF4444' : '#F6F6F6',
      borderWidth: buildingTypeError ? 1 : 1,
      borderRadius: 30,
      minHeight: 40,
    }}
    dropDownContainerStyle={{
      backgroundColor: '#ffffff',
      borderColor: buildingTypeError ? '#EF4444' : '#F6F6F6',
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

{/* House Fields - Update with error styling */}
{buildingType === "House" && (
  <>
    <View className="mb-4">
      <RequiredField>Building / House No</RequiredField>
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{houseNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>Street Name</RequiredField>
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{streetNameError}</Text>
      ) : null}
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{cityError}</Text>
      ) : null}
    </View>
  </>
)}
            {buildingType === "Apartment" && (
  <>
    <View className="mb-4">
      <RequiredField>Apartment / Building No</RequiredField>
      <TextInput
        className={`bg-[#F6F6F6] border ${buildingNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Apartment / Building No"
        value={buildingNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setBuildingNo(capitalizedText);
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{buildingNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>Apartment / Building Name</RequiredField>
      <TextInput
        className={`bg-[#F6F6F6] border ${buildingNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="Apartment / Building Name"
        value={buildingName}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setBuildingName(capitalizedText);
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{buildingNameError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>Flat / Unit Number</RequiredField>
      <TextInput
        className={`bg-[#F6F6F6] border ${unitNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="ex: Building B"
        value={unitNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setUnitNo(capitalizedText);
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{unitNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>Floor Number</RequiredField>
      <TextInput
        className={`bg-[#F6F6F6] border ${floorNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6 h-10`}
        placeholder="ex: 3rd Floor"
        value={floorNo}
        onChangeText={(text) => {
          const capitalizedText = capitalizeWords(text);
          setFloorNo(capitalizedText);
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{floorNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>House No</RequiredField>
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{houseNoError}</Text>
      ) : null}
    </View>
    
    <View className="mb-4">
      <RequiredField>Street Name</RequiredField>
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{streetNameError}</Text>
      ) : null}
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
     //   zIndex={3000}
        zIndexInverse={1000}
     //   modalProps={{ animationType: "fade" }}
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
        <Text className="text-red-500 text-xs mt-1 ml-2">{cityError}</Text>
      ) : null}
    </View>
  </>
)}


<View className="mt-6 mb-4">
          <TouchableOpacity 
            onPress={navigateToMapScreen}
            className="items-center rounded-full mb-3"
          >
            <View className="border border-[#6C3CD1] rounded-full py-3 px-9 flex-row items-center justify-center">
              <FontAwesome6 name="location-crosshairs" size={20} color="#7C3AED" />
              <Text className="text-[#6C3CD1] font-medium ml-2">Geo Location</Text>
            </View>
          </TouchableOpacity>

          {/* View Location Link */}
          {(latitude && longitude) && (
            <TouchableOpacity 
              onPress={() => {
                navigation.navigate("ViewLocationScreen" as any, {
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude),
                  locationName: locationName || `${firstName} ${lastName}'s Location`,
                });
              }}
              className="mb-3"
            >
              <View className="flex-row items-center justify-center">
                <Entypo name="location-pin" size={16} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-1 underline">
                  View Here
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

              <TouchableOpacity 
  onPress={handleRegister}
  disabled={isSubmitting}
>
  <LinearGradient 
    colors={["#854BDA", "#6E3DD1"]} 
    className="py-3 px-4 items-center mb-[15%] mr-[20%] ml-[20%] h-15 rounded-full"
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
        </View>
      </KeyboardAvoidingView>

    
  );
};

export default EditCustomerScreen;