import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Keyboard, KeyboardAvoidingView, Alert, ActivityIndicator, BackHandler } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "../common/BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";
import DropDownPicker from "react-native-dropdown-picker";
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, Entypo, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { StatusBar, Platform } from "react-native";
import * as Location from 'expo-location';

type AddCustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddCustomersScreen">;

interface AddCustomersScreenProps {
  params: any;
  navigation: AddCustomersScreenNavigationProp;
  route: AddCustomersScreenProps;
}

interface City {
  id: number;
  city: string;
  charge: string;
  createdAt?: string;
}

const AddCustomersScreen: React.FC<AddCustomersScreenProps> = ({ navigation ,route}) => {
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  
  // Geolocation states

  const [locationError, setLocationError] = useState<string>("");
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);

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
  const [selectedLatitude, setSelectedLatitude] = useState<number | undefined>();
  const [selectedLongitude, setSelectedLongitude] = useState<number | undefined>();
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
const [longitude, setLongitude] = useState<number | undefined>(undefined);
  
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

  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      setHasLocationPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Failed to request location permission');
      return false;
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    setLocationError("");
    
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      
      Alert.alert(
        'Location Captured',
        `Latitude: ${location.coords.latitude.toFixed(6)}\nLongitude: ${location.coords.longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get current location');
      Alert.alert(
        'Location Error',
        'Unable to fetch your current location. Please try again or select manually on map.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Navigate to map screen for manual selection
const openMapForLocation = () => {
  navigation.navigate("AttachGeoLocationScreen", {
    currentLatitude: latitude,
    currentLongitude: longitude,
    onLocationSelect: (lat: number, lng: number, name: string) => {
      // This callback will be triggered when user clicks "Confirm Now"
      setLatitude(lat);
      setLongitude(lng);
      setSelectedLocationName(name);
      setLocationError("");
      
      console.log("Location received from map:", { lat, lng, name });
    },
  });
};



  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setSelectedCategory('');
    setTitleDropdownOpen(false);
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
   setLatitude(undefined);
setLongitude(undefined);
    setLocationError("");
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

 useFocusEffect(
  React.useCallback(() => {
    // Only reset form on initial mount, not when returning from other screens
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're coming from the geolocation screen
      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2];
      
      // Don't reset if coming back from AttachGeoLocationScreen or ViewLocationScreen
      if (previousRoute?.name === 'AttachGeoLocationScreen' || 
          previousRoute?.name === 'ViewLocationScreen') {
        console.log("Returning from location screen - preserving data");
        return;
      }
      
      console.log("Screen focused - resetting form");
      resetForm();
    });

    fetchCity();

    return () => {
      unsubscribe();
      console.log("Screen unfocused - cleanup");
    };
  }, [navigation])
);

  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a mobile number.');
      return;
    }
  
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
        content: { sms: "Thank you for registering with us a GoviMart customer. Please use the bellow OTP to confirm the registration process. {{code}}" },
        destination: cleanedPhoneNumber, 
      };
  
      const response = await axios.post(apiUrl, body, { headers });
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

  const validatePhoneNumber = (phone: string) => {
    if (phone.length > 12) return false;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string) => {
    return /^[A-Z][a-z]*$/.test(name);
  };

  const validateEmail = (email: string): boolean => {
    const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!generalEmailRegex.test(email)) {
      return false;
    }
    
    const emailLower = email.toLowerCase();
    const [localPart, domain] = emailLower.split('@');
    
    const allowedSpecificDomains = ['gmail.com', 'googlemail.com', 'yahoo.com'];
    const allowedTLDs = ['.com', '.gov', '.lk'];
    
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return validateGmailLocalPart(localPart);
    }
    
    if (domain === 'yahoo.com') {
      return validateYahooLocalPart(localPart);
    }
    
    for (const tld of allowedTLDs) {
      if (domain.endsWith(tld)) {
        return validateGeneralLocalPart(localPart);
      }
    }
    
    return false;
  };

  const validateGmailLocalPart = (localPart: string): boolean => {
    const validCharsRegex = /^[a-zA-Z0-9.+]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }
    
    if (localPart.includes('..')) {
      return false;
    }
    
    if (localPart.length === 0) {
      return false;
    }
    
    return true;
  };

  const validateYahooLocalPart = (localPart: string): boolean => {
    if (localPart.length < 4 || localPart.length > 32) {
      return false;
    }
    
    const validCharsRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }
    
    if (/^[._-]|[._-]$/.test(localPart)) {
      return false;
    }
    
    if (localPart.includes('..')) {
      return false;
    }
    
    return true;
  };

  const validateGeneralLocalPart = (localPart: string): boolean => {
    if (localPart.length < 1 || localPart.length > 64) {
      return false;
    }
    
    const validCharsRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!validCharsRegex.test(localPart)) {
      return false;
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }
    
    if (localPart.includes('..')) {
      return false;
    }
    
    return true;
  };

  // All your existing useEffects for validation
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
        const emailLower = email.toLowerCase();
        const [localPart, domain] = emailLower.split('@');
        
        const generalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!generalEmailRegex.test(email)) {
          setEmailError("Please enter a valid email address");
          return;
        }
        
        if (domain === 'gmail.com' || domain === 'googlemail.com') {
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
          const allowedTLDs = ['.com', '.gov', '.lk'];
          const isDomainSupported = allowedTLDs.some(tld => domain.endsWith(tld));
          
          if (!isDomainSupported) {
            setEmailError("Please enter a valid email address with a supported domain (.com, .gov, .lk)");
          } else {
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

  const formatNameInput = (text: string) => {
    if (!text) return text;
    const filteredText = text.replace(/[^a-zA-Z]/g, '');
    return filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase();
  };

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
    fetchCity();
  }, []);

  const handleRegister = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
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
    
    if (!selectedCategory || !firstName || !lastName || !phoneNumber || !email || !buildingType) {
      Alert.alert("Error", "Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }
    
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
    
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid mobile number.");
      setIsSubmitting(false);
      return;
    }
    
    if (email && !validateEmail(email)) {
      setIsSubmitting(false);
      return;
    }

    // Check if location is captured
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Required",
        "Please capture your location before registering.",
        [{ text: "OK" }]
      );
      setIsSubmitting(false);
      return;
    }
    
    try {
      const checkResponse = await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
        phoneNumber,
        email: email,
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
        latitude,  // Add latitude
        longitude  // Add longitude
      };
      
      await AsyncStorage.setItem("pendingCustomerData", JSON.stringify(customerData));
      const id = new Date().getTime().toString();
      await sendOTP();
      navigation.navigate("OtpScreen", { phoneNumber, id });
    } catch (error: any) {
      console.log("Error checking customer:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          if (error.response.data.message && 
              error.response.data.message.includes("Mobile number or email already exists")) {
            
            try {
              const tempEmail = `temp_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}@tempcheck.com`;
              
              await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
                phoneNumber,
                email: tempEmail,
              });
              
              Alert.alert(
                "Email Already Exists",
                "This email is already registered. Please sign in or use a different email."
              );
              
            } catch (phoneCheckError: any) {
              if (axios.isAxiosError(phoneCheckError) && 
                  phoneCheckError.response?.status === 400 && 
                  phoneCheckError.response?.data?.message?.includes("Mobile number or email already exists")) {
                
                try {
                  const tempPhone = `+94${new Date().getTime().toString().substr(-9)}`;
                  
                  await axios.post(`${environment.API_BASE_URL}api/customer/check-customer`, {
                    phoneNumber: tempPhone,
                    email,
                  });
                  
                  Alert.alert(
                    "Mobile Number Already Exists",
                    "This Mobile number is already registered. Please sign in or use a different mobile number."
                  );
                  
                } catch (emailCheckError: any) {
                  if (axios.isAxiosError(emailCheckError) && 
                      emailCheckError.response?.status === 400 && 
                      emailCheckError.response?.data?.message?.includes("Mobile number or email already exists")) {
                    
                    Alert.alert(
                      "Account Already Exists",
                      "Both Mobile number and email are already registered. Please sign in instead."
                    );
                  } else {
                    Alert.alert(
                      "Mobile Number Already Exists",
                      "This Mobile number is already registered. Please sign in or use a different mobile number."
                    );
                  }
                }
              } else {
                Alert.alert(
                  "Registration Error", 
                  "Unable to verify account details. Please try again."
                );
              }
            }
          } else {
            Alert.alert(
              "Registration Error", 
              error.response.data.message || "Registration failed. Please check your details and try again."
            );
          }
        } else if (error.response && error.response.status === 409) {
          Alert.alert(
            "Account Already Exists",
            "An account with this mobile number or email already exists. Please sign in instead."
          );
        } else if (error.response && error.response.status >= 500) {
          Alert.alert(
            "Server Error", 
            "Our servers are experiencing issues. Please try again later."
          );
        } else {
          Alert.alert(
            "Registration Error", 
            "Registration failed. Please try again."
          );
        }
      } else if (error && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') {
        Alert.alert(
          "Network Error", 
          "Please check your internet connection and try again."
        );
      } else {
        Alert.alert(
          "Registration Error", 
          "Registration failed. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    if (!text.startsWith('+94')) {
      if (text.length < 3) {
        setPhoneNumber('+94');
        return;
      }
      text = '+94' + text.replace(/^\+?94?/, '');
    }
    
    if (text.length > 12) {
      text = text.substring(0, 12);
    }
    
    const cleanText = text.substring(0, 3) + text.substring(3).replace(/[^0-9]/g, '');
    
    setPhoneNumber(cleanText);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("CustomersScreen" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [navigation])
  );

  const capitalizeWords = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <View className="flex-1 bg-white py-4 p-2">
        <View className="p-[-2]">
          <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
            <TouchableOpacity 
              style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
              onPress={() => navigation.navigate("CustomersScreen")}
            >
              <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                <AntDesign name="left" size={20} color="black" />
              </View>
            </TouchableOpacity> 
            
            <Text style={{ fontSize: 18 }} className="font-bold text-center text-purple-600 flex-grow mr-9">
              New Customer Registration
            </Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={{ 
            paddingBottom: isKeyboardVisible ? 200 : 0
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-3 px-6">
            {/* Title and First Name */}
            <View className="mb-4 mt-4 flex-row justify-between">
              <View className="flex-[1]">
                <Text className="text-gray-700 mb-1">Title *</Text>
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

            {/* Last Name */}
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

            {/* Mobile Number */}
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
                  if (!phoneNumber || phoneNumber.length < 3) {
                    setPhoneNumber('+94');
                  }
                }}
              />
              {phoneError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">{phoneError}</Text>
              ) : null}
            </View>

            {/* Email */}
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
                  setEmail(text.toLowerCase());
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

            {/* Building Type */}
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

            {/* House Fields */}
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

            {/* Apartment Fields */}
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

            {/* Geolocation Section */}
            <View className="mb-4 mt-2">
              <Text className="text-gray-700 mb-2 font-semibold">Location *</Text>
              
              {/* Location Display */}
              {/* {latitude && longitude && (
                <View className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#059669" />
                    <Text className="text-green-700 ml-2 font-medium">Location Captured</Text>
                  </View>
                  <Text className="text-gray-600 text-xs mt-1 ml-7">
                    Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                  </Text>
                </View>
              )} */}

              {/* Location Buttons */}
              <View className="flex-row justify-between">
             
                {/* <TouchableOpacity
                  onPress={getCurrentLocation}
                  disabled={isLocationLoading}
                  className="flex-1 mr-2"
                >
                  <View className={`bg-blue-50 border border-blue-200 rounded-full py-3 px-4 flex-row items-center justify-center ${isLocationLoading ? 'opacity-50' : ''}`}>
                    {isLocationLoading ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                        <Ionicons name="locate" size={20} color="#2563EB" />
                        <Text className="text-blue-600 font-medium ml-2">Use My Location</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity> */}

                {/* Geo Location Button */}
                <TouchableOpacity
                  onPress={openMapForLocation}
                  className="flex-1 ml-2 px-9"
                >
                  <View className=" border border-[#6C3CD1] rounded-full py-3  flex-row items-center justify-center">
                    <FontAwesome6 name="location-crosshairs" size={20} color="#7C3AED" />
                    <Text className="text-[#6C3CD1] font-medium ml-2">Geo Location</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Location Error */}
              {locationError ? (
                <Text className="text-red-500 text-xs pl-4 pt-2">{locationError}</Text>
              ) : null}
            </View>
 {latitude && longitude && (
    <View className="items-center justify-center rounded-2xl p-3 mb-3">
     
      
      {/* View Here Link */}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("ViewLocationScreen", {
            latitude: latitude,
            longitude: longitude,
            locationName: selectedLocationName,
          });
        }}
        className="mt-[-8] "
      >
        <View className="flex-row items-center">
          <Entypo name="location-pin" size={16} color="#DC2626" />
          <Text className="text-red-600 font-semibold ml-1 underline">
            View Here
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )}
            

            {/* Register Button */}
            <TouchableOpacity 
              onPress={handleRegister}
              disabled={isSubmitting || loading}
              className="mb-[40%]"
            >
              <LinearGradient 
                colors={["#854BDA", "#6E3DD1"]} 
                className="py-3 px-4 items-center mt-6 mb-[2%] mr-[20%] ml-[20%] rounded-3xl h-15"
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