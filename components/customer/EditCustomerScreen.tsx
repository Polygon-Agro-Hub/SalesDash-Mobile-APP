import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Platform } from "react-native";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";
import GlobalSearchModal from "../common/GlobalSearchModal";

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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const RESPONSIVE_FONT_SIZE = SCREEN_HEIGHT > 900 ? 16 : 14;
const INPUT_FONT_SIZE = SCREEN_HEIGHT > 900 ? 15 : 13;

const EditCustomerScreen: React.FC<EditCustomerScreenProps> = ({
  navigation,
  route,
}) => {
  const { id, customerId, name, title } = route.params;
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
    floorNo: false,
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

  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [buildingTypeModalVisible, setBuildingTypeModalVisible] =
    useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [cityModalKey, setCityModalKey] = useState(0);

  const [items, setItems] = useState([
    { label: "Rev", value: "Rev" },
    { label: "Mr", value: "Mr" },
    { label: "Ms", value: "Ms" },
    { label: "Mrs", value: "Mrs" },
  ]);

  const [cityItems, setCityItems] = useState<
    { label: string; value: string }[]
  >([]);

  const [originalEmail, setOriginalEmail] = useState("");

  const isReturningFromMapRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [buildingTypeItems, setBuildingTypeItems] = useState([
    { label: "House", value: "House" },
    { label: "Apartment", value: "Apartment" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const showAlert = (title: string, message: string, onClose?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onClose }]);
  };

  // Helper function to prevent leading spaces
  const preventLeadingSpace = (
    text: string,
    setter: (value: string) => void,
  ) => {
    if (text.startsWith(" ")) {
      setter(text.trimStart());
    } else {
      setter(text);
    }
  };

  // Validation regex
  const phoneRegex = /^\+947\d{8}$/;
  const nameRegex = /^[A-Z][a-z]*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Helper functions
  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validateName = (name: string) => nameRegex.test(name);

  const validateEmail = (email: string) => {
    if (!emailRegex.test(email)) {
      return false;
    }

    const parts = email.split("@");
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;

    if (localPart.length < 1 || localPart.length > 64) return false;
    if (domainPart.length < 1 || domainPart.length > 255) return false;
    if (localPart.includes("..") || domainPart.includes("..")) return false;
    if (/^[._-]/.test(localPart) || /[._-]$/.test(localPart)) return false;

    const allowedDomains = [
      "gmail.com",
      "googlemail.com",
      "yahoo.com",
      "outlook.com",
    ];
    const allowedTlds = [".com", ".lk", ".gov"];

    const domainLower = domainPart.toLowerCase();
    const hasAllowedTld = allowedTlds.some((tld) => domainLower.endsWith(tld));

    if (!allowedDomains.includes(domainLower) && !hasAllowedTld) {
      return false;
    }

    if (domainLower === "gmail.com" || domainLower === "googlemail.com") {
      if (/\.{2,}/.test(localPart)) return false;
      if (/^\.|\.$/.test(localPart)) return false;
      if (!/^[a-zA-Z0-9.+]+$/.test(localPart)) return false;
    }

    return true;
  };

  const formatNameInput = (text: string) => {
    if (!text) return text;
    const trimmedText = text.replace(/^\s+/, "");
    const filteredText = trimmedText.replace(/[^a-zA-Z]/g, "");
    return (
      filteredText.charAt(0).toUpperCase() + filteredText.slice(1).toLowerCase()
    );
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const RequiredField = ({ children }: { children: React.ReactNode }) => (
    <Text
      className="text-[#000000] mb-1"
      style={{ fontSize: RESPONSIVE_FONT_SIZE }}
    >
      {children} <Text className="text-black">*</Text>
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
        setPhoneError(
          "Please enter a valid Mobile number (format: +947XXXXXXXX)",
        );
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
      if (
        (buildingType === "House" || buildingType === "Apartment") &&
        !streetName
      ) {
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
    setBuildingName("");
    setBuildingType("");
    setOriginalBuildingType("");
    setOriginalPhoneNumber("");
    setOriginalEmail("");
    setLatitude("");
    setLongitude("");
    setLocationName("");
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
      floorNo: false,
    });
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/get-customer-data/${id}`,
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
        setOriginalEmail(customerData.email || "");
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
      showAlert("Error", "Failed to load customer data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setLocationName(name);
    isReturningFromMapRef.current = true;
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isReturningFromMapRef.current) {
        isReturningFromMapRef.current = false;
        return;
      }

      const loadData = async () => {
        try {
          setLoading(true);
          resetFormState();
          await fetchCustomerData();
          hasLoadedOnce.current = true;
          lastFetchedIdRef.current = id;
        } catch (error) {
          console.error("❌ Error loading customer data:", error);
          showAlert("Error", "Failed to load customer data.");
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [id]),
  );

  useEffect(() => {
    return () => {
      isReturningFromMapRef.current = false;
    };
  }, []);

  const navigateToMapScreen = () => {
    isReturningFromMapRef.current = true;
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
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data?.data) {
          setCityItems(
            response.data.data.map((city) => ({
              label: city.city,
              value: city.city,
            })),
          );
        }
      } catch (error) {
        console.error("City fetch error:", error);
      }
    };

    if (token) fetchCity();
  }, [token]);

  const sendOTP = async () => {
    if (!phoneNumber) {
      showAlert("Error", "Please enter a mobile number.");
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
          content: {
            sms: "Thank you for registering with us a GoviMart customer. Please use the bellow OTP to confirm the registration process. {{code}}",
          },
          destination: cleanedPhoneNumber,
        },
        {
          headers: { Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}` },
        },
      );

      await AsyncStorage.setItem("referenceId", response.data.referenceId);

      if (response.status === 200) {
        setOtpSent(true);
        return response;
      }
      return { status: 400 };
    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to send OTP.");
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
      floorNo: buildingType === "Apartment",
    };

    setTouchedFields(touchedFieldsToUpdate);
    setPhoneError("");
    setEmailError("");

    if (
      !selectedCategory ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !buildingType
    ) {
      showAlert("Error", "Please fill in all required fields.");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      showAlert(
        "Error",
        "Please enter a valid mobile number (format: +947XXXXXXXX).",
      );
      return;
    }

    if (!validateEmail(email)) {
      showAlert("Error", "Please enter a valid email address.");
      return;
    }

    if (buildingType === "House" && (!houseNo || !streetName || !city)) {
      showAlert("Error", "Please fill in all required house fields.");
      return;
    }

    if (
      buildingType === "Apartment" &&
      (!buildingNo ||
        !buildingName ||
        !unitNo ||
        !floorNo ||
        !houseNo ||
        !streetName ||
        !city)
    ) {
      showAlert("Error", "Please fill in all required apartment fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumberChanged = phoneNumber !== originalPhoneNumber;
      const emailChanged = email !== originalEmail;

      if (phoneNumberChanged || emailChanged) {
        try {
          const checkResponse = await axios.post(
            `${environment.API_BASE_URL}api/customer/check-customer`,
            {
              phoneNumber,
              email: email || null,
              excludeId: id,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            },
          );
        } catch (checkError: any) {
          console.log("Customer check error:", checkError);

          if (checkError.code === "ECONNABORTED") {
            showAlert(
              "Error",
              "Request timed out. Please check your internet connection and try again.",
            );
            return;
          }

          if (checkError.response) {
            const status = checkError.response.status;
            const errorData = checkError.response.data;

            if (status === 400) {
              const errorMessage = errorData.message || "Validation failed";

              if (errorMessage.includes("Mobile Number already exists")) {
                setPhoneError("This mobile number is already registered.");
                showAlert(
                  "Mobile Number Already Exists",
                  "This mobile number is already registered. Please use a different mobile number.",
                );
                return;
              } else if (errorMessage.includes("Email already exists")) {
                setEmailError("This email address is already registered.");
                showAlert(
                  "Email Already Exists",
                  "This email address is already registered. Please use a different email address.",
                );
                return;
              } else if (
                errorMessage.includes("Mobile Number and Email already exist")
              ) {
                setPhoneError("This mobile number is already registered.");
                setEmailError("This email address is already registered.");
                showAlert(
                  "Account Already Exists",
                  "Both mobile number and email are already registered. Please use different credentials.",
                );
                return;
              } else {
                showAlert("Validation Error", errorMessage);
                return;
              }
            } else if (status === 500) {
              console.error("Server error during validation:", errorData);
              showAlert(
                "Server Error",
                "There was a problem validating your information. Please try again in a moment.",
              );
              return;
            } else {
              showAlert(
                "Error",
                `Validation failed (${status}). Please try again.`,
              );
              return;
            }
          } else if (checkError.request) {
            console.error("Network error:", checkError.request);
            showAlert(
              "Network Error",
              "Unable to connect to the server. Please check your internet connection and try again.",
            );
            return;
          } else {
            console.error("Unexpected error:", checkError.message);
            showAlert(
              "Error",
              "An unexpected error occurred. Please try again.",
            );
            return;
          }
        }

        if (phoneNumberChanged) {
          try {
            const otpResponse = await sendOTP();
            if (otpResponse.status !== 200) {
              showAlert("Error", "Failed to send OTP. Please try again.");
              return;
            }
          } catch (otpError) {
            console.error("OTP sending error:", otpError);
            showAlert("Error", "Failed to send OTP. Please try again.");
            return;
          }
        }
      }

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

      const buildingData =
        buildingType === "House"
          ? { houseNo, streetName, city }
          : {
              buildingNo,
              buildingName,
              unitNo,
              floorNo,
              houseNo,
              streetName,
              city,
            };

      if (phoneNumberChanged) {
        await AsyncStorage.setItem(
          "pendingCustomerData",
          JSON.stringify({ customerData, buildingData, originalBuildingType }),
        );
        showAlert("Success", "OTP Sent Successfully.", () => {
          navigation.navigate("OtpScreenUp", { phoneNumber, id, token });
        });
      } else {
        try {
          const response = await axios.put(
            `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
            { ...customerData, buildingData, originalBuildingType },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 15000,
            },
          );

          if (response.status === 200) {
            showAlert("Success", "Customer updated successfully.", () => {
              navigation.navigate("ViewCustomerScreen" as any, {
                id,
                customerId,
                name: `${firstName} ${lastName}`,
                title: selectedCategory,
                number: phoneNumber,
              });
            });
          }
        } catch (updateError: any) {
          console.error("Update error:", updateError);
          if (updateError.response?.status === 400) {
            const errorMessage =
              updateError.response.data.message ||
              "Failed to update customer data.";

            if (errorMessage.includes("Email already exists")) {
              setEmailError("This email address is already registered.");
              showAlert(
                "Email Already Exists",
                "This email address is already registered. Please use a different email address.",
              );
            } else if (errorMessage.includes("Mobile Number already exists")) {
              setPhoneError("This mobile number is already registered.");
              showAlert(
                "Mobile Number Already Exists",
                "This mobile number is already registered. Please use a different mobile number.",
              );
            } else {
              showAlert("Update Error", errorMessage);
            }
          } else {
            showAlert("Error", "Failed to update customer. Please try again.");
          }
        }
      }
    } catch (error: any) {
      console.error("Unexpected error in handleRegister:", error);
      showAlert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChangeWithErrorClear = (text: string) => {
    if (phoneError) setPhoneError("");
    handlePhoneNumberChange(text);
  };

  const handleEmailChangeWithErrorClear = (text: string) => {
    if (emailError) setEmailError("");
    if (text.startsWith(" ")) return;
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

  const handlePhoneNumberChange = (text: string) => {
    if (text.startsWith(" ")) return;

    if (!text.startsWith("+94")) {
      if (text.length < 3) {
        setPhoneNumber("+94");
        return;
      }
      const cleanedText = text.replace(/^\+?94?/, "");
      setPhoneNumber("+94" + cleanedText.replace(/[^\d]/g, ""));
      return;
    }

    const numberPart = text.slice(3);
    const cleanedNumber = numberPart.replace(/[^\d]/g, "");

    if (cleanedNumber.length <= 9) {
      setPhoneNumber("+94" + cleanedNumber);
    }
  };

  const handlePhoneNumberFocus = () => {
    if (phoneNumber === "" || phoneNumber.length < 3) {
      setPhoneNumber("+94");
    }
  };

  const handlePhoneNumberKeyPress = (e: any) => {
    const { key } = e.nativeEvent;
    if (key === "Backspace" && phoneNumber.length <= 3) {
      e.preventDefault();
      return false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ViewCustomerScreen" as any, {
          id,
          customerId,
          name: `${firstName} ${lastName}`,
          title: selectedCategory,
          number: phoneNumber,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, id, customerId, name, title]),
  );

  const capitalizeWords = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading) {
    return <LoadingPage message="Loading Customer Data..." fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <CustomHeader
        title="Edit Customer Details"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ViewCustomerScreen" as any, {
            id,
            customerId,
            name: `${firstName} ${lastName}`,
            title: selectedCategory,
            number: phoneNumber,
          })
        }
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 mx-auto w-full max-w-[500px]">
          <View className="py-2">
            <View className="flex-row justify-between">
              <View className="flex-[1]">
                <RequiredField>Title</RequiredField>
                <View className="mb-2">
                  <TouchableOpacity
                    onPress={() => {
                      setTitleModalVisible(true);
                      handleFieldTouch("title");
                    }}
                    className={`bg-[#F6F6F6] border flex-row h-[50px] justify-between items-center ${
                      titleError ? "border-red-500" : "border-[#F6F6F6]"
                    } rounded-full px-4 h-10`}
                  >
                    <Text
                      className={
                        selectedCategory ? "text-black" : "text-gray-400"
                      }
                      style={{
                        fontSize: RESPONSIVE_FONT_SIZE,
                        fontStyle: selectedCategory ? "normal" : "italic",
                      }}
                    >
                      {selectedCategory || "Title"}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {titleError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">
                    {titleError}
                  </Text>
                ) : null}
              </View>

              <View className="flex-[2] ml-2">
                <RequiredField>First Name</RequiredField>
                <TextInput
                  className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${
                    firstNameError ? "border-red-500" : "border-[#F6F6F6]"
                  }`}
                  style={{
                    fontSize: INPUT_FONT_SIZE,
                    fontStyle: firstName ? "normal" : "italic",
                  }}
                  placeholder="First Name"
                  placeholderTextColor="#7F7F7F"
                  value={firstName}
                  onChangeText={(text) => {
                    if (text.startsWith(" ")) return;
                    setFirstName(formatNameInput(text));
                  }}
                  autoCapitalize="words"
                  onBlur={() => {
                    handleFieldTouch("firstName");
                  }}
                />
                {firstNameError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">
                    {firstNameError}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="mb-4">
              <RequiredField>Last Name</RequiredField>
              <TextInput
                className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${
                  lastNameError ? "border-red-500" : "border-[#F6F6F6]"
                }`}
                style={{
                  fontSize: INPUT_FONT_SIZE,
                  fontStyle: lastName ? "normal" : "italic",
                }}
                placeholder="Last Name"
                placeholderTextColor="#7F7F7F"
                value={lastName}
                onChangeText={(text) => {
                  if (text.startsWith(" ")) return;
                  setLastName(formatNameInput(text));
                }}
                onBlur={() => {
                  handleFieldTouch("lastName");
                }}
                autoCapitalize="words"
              />
              {lastNameError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">
                  {lastNameError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <RequiredField>Mobile Number</RequiredField>
              <TextInput
                className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${
                  phoneError ? "border-red-500" : "border-[#F6F6F6]"
                }`}
                style={{
                  fontSize: INPUT_FONT_SIZE,
                  fontStyle: phoneNumber ? "normal" : "italic",
                }}
                placeholderTextColor="#7F7F7F"
                placeholder="ex: +94771234567"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChangeWithErrorClear}
                onBlur={() => handleFieldTouch("phoneNumber")}
                onFocus={handlePhoneNumberFocus}
                onKeyPress={handlePhoneNumberKeyPress}
                maxLength={12}
                selection={
                  phoneNumber.length <= 3 ? { start: 3, end: 3 } : undefined
                }
              />
              {phoneError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">
                  {phoneError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <RequiredField>Email Address</RequiredField>
              <TextInput
                className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${
                  emailError ? "border-red-500" : "border-[#F6F6F6]"
                }`}
                style={{
                  fontSize: INPUT_FONT_SIZE,
                  fontStyle: email ? "normal" : "italic",
                }}
                placeholderTextColor="#7F7F7F"
                placeholder="Email Address"
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
                <Text className="text-red-500 text-xs mt-1 ml-2">
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <RequiredField>Building Type</RequiredField>
              <TouchableOpacity
                onPress={() => {
                  setBuildingTypeModalVisible(true);
                  handleFieldTouch("buildingType");
                }}
                className={`bg-[#F6F6F6] border h-[50px] ${buildingTypeError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
              >
                <Text
                  className={buildingType ? "text-black" : "text-gray-400"}
                  style={{
                    fontSize: RESPONSIVE_FONT_SIZE,
                    fontStyle: buildingType ? "normal" : "italic",
                  }}
                >
                  {buildingType || "Select Building Type"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
              {buildingTypeError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2">
                  {buildingTypeError}
                </Text>
              ) : null}
            </View>

            {/* House Fields */}
            {buildingType === "House" && (
              <>
                <View className="mb-4">
                  <RequiredField>Building / House No</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: houseNo ? "normal" : "italic",
                    }}
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
                  />
                  {houseNoError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {houseNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Street Name</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: streetName ? "normal" : "italic",
                    }}
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
                  />
                  {streetNameError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {streetNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Nearest City</RequiredField>
                  <TouchableOpacity
                    onPress={() => {
                      setCityModalVisible(true);
                      setCityModalKey((prev) => prev + 1);
                      handleFieldTouch("city");
                    }}
                    className={`bg-[#F6F6F6] border h-[50px] ${cityError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
                  >
                    <Text
                      className={city ? "text-black" : "text-gray-400"}
                      style={{
                        fontSize: RESPONSIVE_FONT_SIZE,
                        fontStyle: city ? "normal" : "italic",
                      }}
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {cityError}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            {buildingType === "Apartment" && (
              <>
                <View className="mb-4">
                  <RequiredField>Apartment / Building No</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${buildingNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: buildingNo ? "normal" : "italic",
                    }}
                    placeholder="Apartment / Building No"
                    placeholderTextColor="#7F7F7F"
                    value={buildingNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {buildingNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Apartment / Building Name</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${buildingNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: buildingName ? "normal" : "italic",
                    }}
                    placeholder="Apartment / Building Name"
                    placeholderTextColor="#7F7F7F"
                    value={buildingName}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {buildingNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Flat / Unit Number</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${unitNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: unitNo ? "normal" : "italic",
                    }}
                    placeholder="ex: Building B"
                    placeholderTextColor="#7F7F7F"
                    value={unitNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {unitNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Floor Number</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${floorNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: floorNo ? "normal" : "italic",
                    }}
                    placeholderTextColor="#7F7F7F"
                    placeholder="ex: 3rd Floor"
                    value={floorNo}
                    onChangeText={(text) => {
                      if (text.startsWith(" ")) return;
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {floorNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>House No</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${houseNoError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: houseNo ? "normal" : "italic",
                    }}
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
                  />
                  {houseNoError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {houseNoError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Street Name</RequiredField>
                  <TextInput
                    className={`bg-[#F6F6F6] border h-[50px] ${streetNameError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-6`}
                    style={{
                      fontSize: INPUT_FONT_SIZE,
                      fontStyle: streetName ? "normal" : "italic",
                    }}
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
                  />
                  {streetNameError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {streetNameError}
                    </Text>
                  ) : null}
                </View>

                <View className="mb-4">
                  <RequiredField>Nearest City</RequiredField>
                  <TouchableOpacity
                    onPress={() => {
                      setCityModalVisible(true);
                      setCityModalKey((prev) => prev + 1);
                      handleFieldTouch("city");
                    }}
                    className={`bg-[#F6F6F6] border h-[50px] ${cityError ? "border-red-500" : "border-[#F6F6F6]"} rounded-full px-4 h-10 flex-row items-center justify-between`}
                  >
                    <Text
                      className={city ? "text-black" : "text-gray-400"}
                      style={{
                        fontSize: RESPONSIVE_FONT_SIZE,
                        fontStyle: city ? "normal" : "italic",
                      }}
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
                    <Text className="text-red-500 text-xs mt-1 ml-2">
                      {cityError}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

            <View className="mt-6 mb-4">
              <TouchableOpacity
                onPress={navigateToMapScreen}
                className="items-center rounded-full mb-3"
                activeOpacity={1}
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
                  <Text
                    className="text-[#6C3CD1] font-medium ml-2"
                    style={{ fontSize: RESPONSIVE_FONT_SIZE }}
                  >
                    Geo Location
                  </Text>
                </View>
              </TouchableOpacity>

              {latitude && longitude && (
                <TouchableOpacity
                  onPress={() => {
                    isReturningFromMapRef.current = true;
                    navigation.navigate("ViewLocationScreen" as any, {
                      latitude: parseFloat(latitude),
                      longitude: parseFloat(longitude),
                      locationName:
                        locationName || `${firstName} ${lastName}'s Location`,
                    });
                  }}
                  className="mb-3"
                >
                  <View className="flex-row items-center justify-center">
                    <Entypo name="location-pin" size={16} color="#DC2626" />
                    <Text
                      className="text-red-600 font-semibold ml-1 underline"
                      style={{ fontSize: RESPONSIVE_FONT_SIZE }}
                    >
                      View Here
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                marginBottom: "30%",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  borderRadius: 30,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 10,
                  width: "50%",
                }}
              >
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                  style={{ borderRadius: 30 }}
                >
                  <LinearGradient
                    colors={["#854BDA", "#6E3DD1"]}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 30,
                      alignItems: "center",
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-bold text-lg">Save</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Title Selection Modal */}
      <GlobalSearchModal
        visible={titleModalVisible}
        onClose={() => setTitleModalVisible(false)}
        title="Select Title"
        data={items}
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
            handleBuildingTypeChange(items[0]);
          }
          handleFieldTouch("buildingType");
        }}
        searchPlaceholder="Search building type..."
        multiSelect={false}
        showSearch={false}
      />

      {/* City Selection Modal */}
      <GlobalSearchModal
        key={cityModalKey}
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

export default EditCustomerScreen;
