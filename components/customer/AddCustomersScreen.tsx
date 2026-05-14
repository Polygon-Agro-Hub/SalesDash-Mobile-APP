import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Dimensions,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";

type AddCustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddCustomersScreen"
>;

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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AddCustomersScreen: React.FC<AddCustomersScreenProps> = ({
  navigation,
  route,
}) => {
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
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [locationError, setLocationError] = useState<string>("");
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({
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
    floorNo: false,
  });

  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [buildingTypeError, setBuildingTypeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityItems, setCityItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const [titleItems, setTitleItems] = useState([
    { label: "Rev", value: "Rev" },
    { label: "Mr", value: "Mr" },
    { label: "Ms", value: "Ms" },
    { label: "Mrs", value: "Mrs" },
  ]);

  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);

  const isNavigatingToGeoScreen = useRef(false);

  const isNavigatingToOtpScreen = useRef(false);

  const openMapForLocation = () => {
    isNavigatingToGeoScreen.current = true;
    navigation.navigate("AttachGeoLocationScreen", {
      currentLatitude: latitude,
      currentLongitude: longitude,
      onLocationSelect: (lat: number, lng: number, name: string) => {
        setLatitude(lat);
        setLongitude(lng);
        setSelectedLocationName(name);
        setLocationError("");
      },
    });
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setSelectedCategory("");
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
    setSelectedLocationName("");
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
      floorNo: false,
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCity();

      if (isNavigatingToGeoScreen.current) {
        isNavigatingToGeoScreen.current = false;
        return;
      }

      if (isNavigatingToOtpScreen.current) {
        isNavigatingToOtpScreen.current = false;
        return;
      }

      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2];

      const isComingFromGeoScreens =
        previousRoute?.name === "AttachGeoLocationScreen" ||
        previousRoute?.name === "ViewLocationScreen" ||
        previousRoute?.name === "OtpScreen";

      if (isComingFromGeoScreens) {
        return;
      }

      resetForm();
    }, [navigation]),
  );

  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter a mobile number.");
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
        content: {
          sms: "Thank you for registering with us as a GoviMart customer. Please use the bellow OTP to confirm the registration process. {{code}}",
        },
        destination: cleanedPhoneNumber,
      };

      const response = await axios.post(apiUrl, body, { headers });
      await AsyncStorage.setItem("referenceId", response.data.referenceId);

      if (response.status === 200) {
        Alert.alert("Success", "OTP sent successfully.");
      } else {
        Alert.alert("Error", "Failed to send OTP.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          "Axios error details:",
          error.response ? error.response.data : error.message,
        );
        Alert.alert(
          "Error",
          `Error: ${error.response ? error.response.data.message : error.message}`,
        );
      } else {
        console.log("Unexpected error:", error);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const phoneRegex = /^\+947\d{8}$/;

  const validatePhoneNumber = (phone: string) => {
    if (phone.length > 12) return false;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string) => {
    return /^[A-Z][a-z]*$/.test(name);
  };

  const validateEmail = (email: string): boolean => {
    const generalEmailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!generalEmailRegex.test(email)) {
      return false;
    }

    const emailLower = email.toLowerCase();
    const [localPart, domain] = emailLower.split("@");

    if (domain && domain.includes("..")) {
      return false;
    }

    const allowedTLDs = [".com", ".gov", ".lk"];

    if (domain === "gmail.com" || domain === "googlemail.com") {
      return validateGmailLocalPart(localPart);
    }

    if (domain === "yahoo.com") {
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

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return false;
    }

    if (localPart.includes("..")) {
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

    if (localPart.includes("..")) {
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

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return false;
    }

    if (localPart.includes("..")) {
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

  useEffect(() => {
    if (touchedFields.email) {
      if (!email) {
        setEmailError("Email is required");
      } else if (!validateEmail(email)) {
        const emailLower = email.toLowerCase();
        const [localPart, domain] = emailLower.split("@");

        const generalEmailRegex =
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!generalEmailRegex.test(email)) {
          setEmailError("Please enter a valid email address");
          return;
        }
        if (domain && domain.includes("..")) {
          setEmailError(
            "Email domain cannot contain consecutive dots (e.g., gmail..com is invalid)",
          );
          return;
        }

        if (domain === "gmail.com" || domain === "googlemail.com") {
          if (localPart.length > 30) {
            setEmailError(
              "Gmail addresses cannot exceed 30 characters before @",
            );
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Gmail addresses cannot have consecutive dots");
          } else if (/^\.|\.$/.test(localPart)) {
            setEmailError("Gmail addresses cannot start or end with a dot");
          } else if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) {
            setEmailError(
              "Gmail addresses can only contain letters, numbers, dots and plus signs",
            );
          } else {
            setEmailError("Please enter a valid Gmail address");
          }
        } else if (domain === "yahoo.com") {
          if (localPart.length > 32) {
            setEmailError(
              "Yahoo addresses cannot exceed 32 characters before @",
            );
          } else if (/\.{2,}/.test(localPart)) {
            setEmailError("Yahoo addresses cannot have consecutive dots");
          } else if (/^[._-]|[._-]$/.test(localPart)) {
            setEmailError(
              "Yahoo addresses cannot start or end with dots, underscores or hyphens",
            );
          } else if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
            setEmailError(
              "Yahoo addresses can only contain letters, numbers, dots, underscores and hyphens",
            );
          } else {
            setEmailError("Please enter a valid Yahoo address");
          }
        } else {
          const allowedTLDs = [".com", ".gov", ".lk"];
          const isDomainSupported = allowedTLDs.some((tld) =>
            domain.endsWith(tld),
          );

          if (!isDomainSupported) {
            setEmailError(
              "Please enter a valid email address with a supported domain (.com, .gov, .lk)",
            );
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
        setPhoneError(
          "Please enter a valid mobile number (format: +947XXXXXXXX)",
        );
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

    if (text.startsWith(" ")) {
      return text.trim();
    }
    const filteredText = text.replace(/[^a-zA-Z]/g, "");
    return (
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase()
    );
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const fetchCity = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: City[] }>(
        `${environment.API_BASE_URL}api/customer/get-city`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      if (response.data && response.data.data) {
        const formattedCities = response.data.data.map((city) => ({
          label: city.city,
          value: city.city,
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
      floorNo: true,
    });

    if (
      !selectedCategory ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !email ||
      !buildingType
    ) {
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
      if (
        !buildingNo ||
        !buildingName ||
        !unitNo ||
        !floorNo ||
        !houseNo ||
        !streetName ||
        !city
      ) {
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
      Alert.alert("Error", "Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(
        "Location Required",
        "Please capture customer's location before registering.",
        [{ text: "OK" }],
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(
        `${environment.API_BASE_URL}api/customer/check-customer`,
        {
          phoneNumber,
          email: email,
        },
      );

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
        latitude,
        longitude,
      };

      await AsyncStorage.setItem(
        "pendingCustomerData",
        JSON.stringify(customerData),
      );
      const id = new Date().getTime().toString();
      await sendOTP();

      isNavigatingToOtpScreen.current = true;

      navigation.navigate("OtpScreen", { phoneNumber, id });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 400) {
          if (
            error.response.data.message &&
            error.response.data.message.includes(
              "Mobile number or email already exists",
            )
          ) {
            try {
              const tempEmail = `temp_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}@tempcheck.com`;

              await axios.post(
                `${environment.API_BASE_URL}api/customer/check-customer`,
                {
                  phoneNumber,
                  email: tempEmail,
                },
              );

              Alert.alert(
                "Email Already Exists",
                "This email is already registered. Please sign in or use a different email.",
              );
            } catch (phoneCheckError: any) {
              if (
                axios.isAxiosError(phoneCheckError) &&
                phoneCheckError.response?.status === 400 &&
                phoneCheckError.response?.data?.message?.includes(
                  "Mobile number or email already exists",
                )
              ) {
                try {
                  const tempPhone = `+94${new Date().getTime().toString().substr(-9)}`;

                  await axios.post(
                    `${environment.API_BASE_URL}api/customer/check-customer`,
                    {
                      phoneNumber: tempPhone,
                      email,
                    },
                  );

                  Alert.alert(
                    "Mobile Number Already Exists",
                    "This Mobile number is already registered. Please sign in or use a different mobile number.",
                  );
                } catch (emailCheckError: any) {
                  if (
                    axios.isAxiosError(emailCheckError) &&
                    emailCheckError.response?.status === 400 &&
                    emailCheckError.response?.data?.message?.includes(
                      "Mobile number or email already exists",
                    )
                  ) {
                    Alert.alert(
                      "Account Already Exists",
                      "Both Mobile number and email are already registered. Please sign in instead.",
                    );
                  } else {
                    Alert.alert(
                      "Mobile Number Already Exists",
                      "This Mobile number is already registered. Please sign in or use a different mobile number.",
                    );
                  }
                }
              } else {
                Alert.alert(
                  "Registration Error",
                  "Unable to verify account details. Please try again.",
                );
              }
            }
          } else {
            Alert.alert(
              "Registration Error",
              error.response.data.message ||
                "Registration failed. Please check your details and try again.",
            );
          }
        } else if (error.response && error.response.status === 409) {
          Alert.alert(
            "Account Already Exists",
            "An account with this mobile number or email already exists. Please sign in instead.",
          );
        } else if (error.response && error.response.status >= 500) {
          Alert.alert(
            "Server Error",
            "Our servers are experiencing issues. Please try again later.",
          );
        } else {
          Alert.alert(
            "Registration Error",
            "Registration failed. Please try again.",
          );
        }
      } else if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NETWORK_ERROR"
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again.",
        );
      } else {
        Alert.alert(
          "Registration Error",
          "Registration failed. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    if (text.startsWith(" ")) {
      return;
    }

    if (!text.startsWith("+94")) {
      if (text.length < 3) {
        setPhoneNumber("+94");
        return;
      }
      text = "+94" + text.replace(/^\+?94?/, "");
    }

    if (text.length > 12) {
      text = text.substring(0, 12);
    }

    const cleanText =
      text.substring(0, 3) + text.substring(3).replace(/[^0-9]/g, "");

    setPhoneNumber(cleanText);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("CustomersScreen" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
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
      <CustomHeader
        title="New Customer Registration"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.navigate("CustomersScreen")}
      />
      <View className="flex-1 bg-white">
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="flex-1 mx-auto w-full max-w-[500px] py-2 px-6">
            {/* Title and First Name */}
            <View className="mb-4 mt-4 flex-row justify-between">
              <View className="flex-[1]">
                <Text
                  className="text-[#000000] mb-1"
                  style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                >
                  Title *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setTitleModalVisible(true);
                    handleFieldTouch("title");
                  }}
                  className={`bg-[#F6F6F6] border flex-row justify-between h-[50px] items-center ${
                    titleError ? "border-red-500" : "border-[#F6F6F6]"
                  } rounded-full px-4 h-10`}
                >
                  <Text
                    className={
                      selectedCategory ? "text-black" : "text-[#7F7F7F]"
                    }
                    style={!selectedCategory ? { fontStyle: "italic" } : {}}
                  >
                    {selectedCategory || "Title"}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
                {titleError ? (
                  <Text className="text-red-500 text-xs pl-4 pt-1">
                    {titleError}
                  </Text>
                ) : null}
              </View>

              <View className="flex-[2] ml-2">
                <Text
                  className="text-[#000000] mb-1"
                  style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                >
                  First Name *
                </Text>
                <TextInput
                  className={`bg-[#F6F6F6] h-[50px] border ${firstNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                  placeholder="First Name"
                  placeholderTextColor="#7F7F7F"
                  value={firstName}
                  onChangeText={(text) => {
                    if (text.startsWith(" ")) return;
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
                  style={[{ fontStyle: firstName ? "normal" : "italic" }]}
                />
                {firstNameError ? (
                  <Text className="text-red-500 text-xs pl-4 pt-1">
                    {firstNameError}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Last Name */}
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Last Name *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${lastNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Last Name"
                placeholderTextColor="#7F7F7F"
                value={lastName}
                onChangeText={(text) => {
                  if (text.startsWith(" ")) return;
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
                style={[{ fontStyle: lastName ? "normal" : "italic" }]}
              />
              {lastNameError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {lastNameError}
                </Text>
              ) : null}
            </View>

            {/* Mobile Number */}
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Mobile Number *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${phoneError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="+947XXXXXXXX"
                placeholderTextColor="#7F7F7F"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                onBlur={() => handleFieldTouch("phoneNumber")}
                keyboardType="phone-pad"
                maxLength={12}
                onFocus={() => {
                  if (!phoneNumber || phoneNumber.length < 3) {
                    setPhoneNumber("+94");
                  }
                }}
                style={[{ fontStyle: phoneNumber ? "normal" : "italic" }]}
              />
              {phoneError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {phoneError}
                </Text>
              ) : null}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Email Address *
              </Text>
              <TextInput
                className={`bg-[#F6F6F6] h-[50px] border ${emailError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                placeholder="Email Address"
                placeholderTextColor="#7F7F7F"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  if (text.startsWith(" ")) return;
                  setEmail(text.toLowerCase());
                  if (touchedFields.email) {
                    handleFieldTouch("email");
                  }
                }}
                onBlur={() => {
                  handleFieldTouch("email");
                }}
                style={[{ fontStyle: email ? "normal" : "italic" }]}
              />
              {emailError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Building Type */}
            <View className="mb-4">
              <Text
                className="text-[#000000] mb-1"
                style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
              >
                Building Type *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setBuildingTypeModalVisible(true);
                  handleFieldTouch("buildingType");
                }}
                className={`bg-[#F6F6F6] h-[50px] border ${buildingTypeError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
              >
                <Text
                  className={buildingType ? "text-black" : "text-[#7F7F7F]"}
                  style={!buildingType ? { fontStyle: "italic" } : {}}
                >
                  {buildingType || "Select Building Type"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
              {buildingTypeError ? (
                <Text className="text-red-500 text-xs pl-4 pt-1">
                  {buildingTypeError}
                </Text>
              ) : null}
            </View>

            {/* House Fields */}
            {buildingType === "House" && (
              <>
                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Building / House No *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="Building / House No (e.g., 14/B)"
                    placeholderTextColor="#7F7F7F"
                    value={houseNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: houseNo ? "normal" : "italic" }]}
                  />
                  {houseNoError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {houseNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Street Name *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="Street Name"
                    placeholderTextColor="#7F7F7F"
                    value={streetName}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: streetName ? "normal" : "italic" }]}
                  />
                  {streetNameError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {streetNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Nearest City *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCityModalVisible(true);
                      handleFieldTouch("city");
                    }}
                    className={`bg-[#F6F6F6] h-[50px] border ${cityError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
                  >
                    <Text
                      className={city ? "text-black" : "text-[#7F7F7F]"}
                      style={!city ? { fontStyle: "italic" } : {}}
                    >
                      {city || "Select Nearest City"}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {cityError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {cityError}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            {/* Apartment Fields */}
            {buildingType === "Apartment" && (
              <>
                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Apartment / Building No *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${buildingNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="Apartment / Building No"
                    placeholderTextColor="#7F7F7F"
                    value={buildingNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: buildingNo ? "normal" : "italic" }]}
                  />
                  {buildingNoError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {buildingNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Apartment / Building Name *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${buildingNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="Apartment / Building Name"
                    placeholderTextColor="#7F7F7F"
                    value={buildingName}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: buildingName ? "normal" : "italic" }]}
                  />
                  {buildingNameError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {buildingNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Flat / Unit Number *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${unitNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="ex : Building B"
                    placeholderTextColor="#7F7F7F"
                    value={unitNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: unitNo ? "normal" : "italic" }]}
                  />
                  {unitNoError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {unitNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Floor Number *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${floorNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="ex : 3rd Floor"
                    placeholderTextColor="#7F7F7F"
                    value={floorNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: floorNo ? "normal" : "italic" }]}
                  />
                  {floorNoError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {floorNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text className="text-[#000000] mb-1">House No *</Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="ex : 14"
                    placeholderTextColor="#7F7F7F"
                    value={houseNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: houseNo ? "normal" : "italic" }]}
                  />
                  {houseNoError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {houseNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Street Name *
                  </Text>
                  <TextInput
                    className={`bg-[#F6F6F6] h-[50px] border ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10`}
                    placeholder="Street Name"
                    placeholderTextColor="#7F7F7F"
                    value={streetName}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    style={[{ fontStyle: streetName ? "normal" : "italic" }]}
                  />
                  {streetNameError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {streetNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <Text
                    className="text-[#000000] mb-1"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                  >
                    Nearest City *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCityModalVisible(true);
                      handleFieldTouch("city");
                    }}
                    className={`bg-[#F6F6F6] h-[50px] border ${cityError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
                  >
                    <Text
                      className={city ? "text-black" : "text-[#7F7F7F]"}
                      style={!city ? { fontStyle: "italic" } : {}}
                    >
                      {city || "Select Nearest City"}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {cityError ? (
                    <Text className="text-red-500 text-xs pl-4 pt-1">
                      {cityError}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            {/* Geolocation Section */}
            <View className="mb-4 mt-2">
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={openMapForLocation}
                  className="flex-1 items-center"
                >
                  <View
                    className="w-1/2 border border-[#6C3CD1] bg-white rounded-full py-3 flex-row items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 10,
                    }}
                  >
                    <FontAwesome6
                      name="location-crosshairs"
                      size={20}
                      color="#7C3AED"
                    />
                    <Text className="text-[#6C3CD1] font-medium ml-2">
                      Geo Location
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {locationError ? (
                <Text className="text-red-500 text-xs pl-4 pt-2">
                  {locationError}
                </Text>
              ) : null}
            </View>

            {latitude && longitude && (
              <View className="items-center justify-center rounded-2xl p-3 mb-3">
                <TouchableOpacity
                  onPress={() => {
                    isNavigatingToGeoScreen.current = true;
                    navigation.navigate("ViewLocationScreen", {
                      latitude: latitude,
                      longitude: longitude,
                      locationName: selectedLocationName,
                    });
                  }}
                  className="mt-[-8]"
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
            <View
              style={{
                marginTop: 24,
                marginHorizontal: "20%",
                marginBottom: "40%",
                borderRadius: 30,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isSubmitting || loading}
                activeOpacity={0.8}
                style={{ borderRadius: 30 }}
              >
                <LinearGradient
                  colors={["#854BDA", "#6E3DD1"]}
                  style={{
                    paddingVertical: 14,
                    alignItems: "center",
                    borderRadius: 30,
                  }}
                >
                  {isSubmitting || loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        textAlign: "center",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      }}
                    >
                      Register
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Title Selection Modal */}
      <GlobalSearchModal
        visible={titleModalVisible}
        onClose={() => setTitleModalVisible(false)}
        title="Select Title"
        data={titleItems}
        selectedItems={selectedCategory ? [selectedCategory] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setSelectedCategory(items[0]);
          }
          handleFieldTouch("title");
        }}
        searchPlaceholder="Search title..."
        multiSelect={false}
        showSearch={false}
      />

      {/* Building Type Selection Modal */}
      <GlobalSearchModal
        visible={buildingTypeModalVisible}
        onClose={() => setBuildingTypeModalVisible(false)}
        title="Select Building Type"
        data={buildingTypeItems}
        selectedItems={buildingType ? [buildingType] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setBuildingType(items[0]);
          }
          handleFieldTouch("buildingType");
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

      {/* City Selection Modal */}
      <GlobalSearchModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        title="Select Nearest City"
        data={cityItems}
        selectedItems={city ? [city] : []}
        onSelect={(items) => {
          if (items.length > 0) {
            setCity(items[0]);
          }
          handleFieldTouch("city");
        }}
        searchPlaceholder="Search city..."
        multiSelect={false}
        noResultsText="No City Found"
      />
    </KeyboardAvoidingView>
  );
};

export default AddCustomersScreen;
