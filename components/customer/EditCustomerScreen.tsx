import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
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
import { MaterialIcons } from "@expo/vector-icons";
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
  hasCenter?: boolean | number;
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
  // phoneNumber is always kept in full API format: +947XXXXXXXX
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState<string>("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>("");

  const [touchedFields, setTouchedFields] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
    title: false,
  });

  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");

  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [items] = useState([
    { label: "Rev", value: "Rev" },
    { label: "Mr", value: "Mr" },
    { label: "Ms", value: "Ms" },
    { label: "Mrs", value: "Mrs" },
  ]);

  const isReturningFromMapRef = useRef(false);

  const showAlert = (title: string, message: string, onClose?: () => void) => {
    Alert.alert(title, message, [{ text: "OK", onPress: onClose }]);
  };

  // Matches AddCustomersScreen: full +94 format, locked prefix
  const phoneRegex = /^\+947\d{8}$/;
  const nameRegex = /^[A-Z][a-z]*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validatePhoneNumber = (phone: string) => {
    if (phone.length > 12) return false;
    return phoneRegex.test(phone);
  };
  const validateName = (name: string) => nameRegex.test(name);

  // Normalizes whatever format the backend stores (0XXXXXXXXX, 94XXXXXXXXX,
  // or +94XXXXXXXXX) into the single +94XXXXXXXXX format used in this screen.
  const normalizeToApiFormat = (phone: string) => {
    if (!phone) return "+94";
    if (phone.startsWith("+94")) return phone;
    if (phone.startsWith("94")) return "+" + phone;
    if (phone.startsWith("0")) return "+94" + phone.slice(1);
    return phone;
  };

  const validateEmail = (email: string) => {
    if (!emailRegex.test(email)) return false;

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

    const validateEmailAddress = (email: string): boolean => {
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
    if (touchedFields.email) {
      if (!email) {
        setEmailError("Email is required");
      } else if (!validateEmailAddress(email)) {
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
          "Please enter a valid mobile number (format: +947XXXXXXXX)",
        );
      } else {
        setPhoneError("");
      }
    }
  }, [phoneNumber, touchedFields.phoneNumber]);


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
    setOriginalPhoneNumber("");
    setOriginalEmail("");
    setFirstNameError("");
    setLastNameError("");
    setPhoneError("");
    setEmailError("");
    setTitleError("");
    setTouchedFields({
      firstName: false,
      lastName: false,
      phoneNumber: false,
      email: false,
      title: false,
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

        setSelectedCategory(customerData.title || "");
        setFirstName(customerData.firstName || "");
        setLastName(customerData.lastName || "");
        const apiPhone = normalizeToApiFormat(customerData.phoneNumber || "");
        setPhoneNumber(apiPhone);
        setOriginalPhoneNumber(apiPhone);
        setEmail(customerData.email || "");
        setOriginalEmail(customerData.email || "");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to load customer data.");
    } finally {
      setLoading(false);
    }
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
    setTouchedFields({
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
      title: true,
    });

    if (!selectedCategory || !firstName || !lastName || !phoneNumber) {
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

    if (!validateEmailAddress(email)) {
      showAlert("Error", "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumberChanged = phoneNumber !== originalPhoneNumber;
      const emailChanged = email !== originalEmail;
      const apiPhoneNumber = phoneNumber;

      if (phoneNumberChanged || emailChanged) {
        try {
          await axios.post(
            `${environment.API_BASE_URL}api/customer/check-customer`,
            {
              phoneNumber: apiPhoneNumber,
              email: email || null,
              excludeId: id,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            },
          );
        } catch (checkError: any) {
          console.error("❌ Customer check error:", checkError);

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
        phoneNumber: apiPhoneNumber,
        email,
      };

      if (phoneNumberChanged) {
        await AsyncStorage.setItem(
          "pendingCustomerData",
          JSON.stringify({ customerData }),
        );
        showAlert("Success", "OTP Sent Successfully.", () => {
          navigation.navigate("OtpScreenUp", {
            phoneNumber: apiPhoneNumber,
            id,
            token,
          });
        });
      } else {
        try {
          const response = await axios.put(
            `${environment.API_BASE_URL}api/customer/update-customer-data/${id}`,
            customerData,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 15000,
            },
          );

          if (response.status === 200) {
            showAlert("Success", "Customer's Basic Details updated successfully.", () => {
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

  // Mirrors AddCustomersScreen: the "+94" prefix is always enforced and
  // cannot be deleted — if the text no longer starts with +94, it's
  // reconstructed from whatever digits remain.
  const handlePhoneNumberChange = (text: string) => {
    if (text.startsWith(" ")) return;

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

  const handlePhoneNumberChangeWithErrorClear = (text: string) => {
    if (!touchedFields.phoneNumber) {
      handleFieldTouch("phoneNumber");
    }

    handlePhoneNumberChange(text);
  };

  const handleEmailChangeWithErrorClear = (text: string) => {
    if (!touchedFields.email) {
      handleFieldTouch("email");
    }

    if (text.startsWith(" ")) return;
    setEmail(text.toLowerCase());
  };

  const handlePhoneNumberFocus = () => {
    if (!phoneNumber || phoneNumber.length < 3) {
      setPhoneNumber("+94");
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
    }, [
      navigation,
      id,
      customerId,
      name,
      title,
      firstName,
      lastName,
      selectedCategory,
      phoneNumber,
    ]),
  );

  const renderBasicDetailsForm = () => {
    return (
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
                className={`bg-[#F6F6F6] border flex-row h-[50px] justify-between items-center ${titleError ? "border-red-500" : "border-[#F6F6F6]"
                  } rounded-full px-4 h-10`}
              >
                <Text
                  className={selectedCategory ? "text-black" : "text-gray-400"}
                  style={{
                    fontSize: RESPONSIVE_FONT_SIZE,
                    fontStyle: selectedCategory ? "normal" : "italic",
                  }}
                >
                  {selectedCategory || "Title"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
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
              className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${firstNameError ? "border-red-500" : "border-[#F6F6F6]"
                }`}
              style={{
                fontSize: INPUT_FONT_SIZE,
                fontStyle: firstName ? "normal" : "italic",
              }}
              placeholder="First Name"
              placeholderTextColor="#7F7F7F"
              value={firstName}
              onChangeText={(text) => {
                if (!touchedFields.firstName) {
                  handleFieldTouch("firstName");
                }

                if (text.startsWith(" ")) return;
                setFirstName(formatNameInput(text));
              }}
              autoCapitalize="words"
              onBlur={() => handleFieldTouch("firstName")}
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
            className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${lastNameError ? "border-red-500" : "border-[#F6F6F6]"
              }`}
            style={{
              fontSize: INPUT_FONT_SIZE,
              fontStyle: lastName ? "normal" : "italic",
            }}
            placeholder="Last Name"
            placeholderTextColor="#7F7F7F"
            value={lastName}
            onChangeText={(text) => {
              if (!touchedFields.lastName) {
                handleFieldTouch("lastName");
              }

              if (text.startsWith(" ")) return;
              setLastName(formatNameInput(text));
            }}
            onBlur={() => handleFieldTouch("lastName")}
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
            className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${phoneError ? "border-red-500" : "border-[#F6F6F6]"
              }`}
            style={{
              fontSize: INPUT_FONT_SIZE,
              fontStyle: phoneNumber ? "normal" : "italic",
            }}
            placeholder="+947XXXXXXXX"
            placeholderTextColor="#7F7F7F"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChangeWithErrorClear}
            onFocus={handlePhoneNumberFocus}
            onBlur={() => handleFieldTouch("phoneNumber")}
            maxLength={12}
          />
          {phoneError ? (
            <Text className="text-red-500 text-xs mt-1 ml-2">{phoneError}</Text>
          ) : null}
        </View>

        <View className="mb-4">
          <RequiredField>Email Address</RequiredField>
          <TextInput
            className={`bg-[#F6F6F6] border rounded-full px-6 h-[50px] ${emailError ? "border-red-500" : "border-[#F6F6F6]"
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
            onBlur={() => handleFieldTouch("email")}
          />
          {emailError ? (
            <Text className="text-red-500 text-xs mt-1 ml-2">{emailError}</Text>
          ) : null}
        </View>

        {/* Save Button */}
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
            activeOpacity={0.8}
            style={{ borderRadius: 30 }}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={["#854BDA", "#6E3DD1"]}
              style={{
                paddingVertical: 14,
                alignItems: "center",
                borderRadius: 30,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        title="Edit Basic Details"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          navigation.navigate("ViewCustomerScreen" as any, {
            id,
            customerId,
            name: `${firstName} ${lastName}`,
            title: selectedCategory,
            number: phoneNumber,
          });
        }}
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 mx-auto w-full max-w-[500px]">
          {renderBasicDetailsForm()}
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
    </KeyboardAvoidingView>
  );
};

export default EditCustomerScreen;