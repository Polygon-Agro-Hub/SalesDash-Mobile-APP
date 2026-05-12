import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import CustomersScreenSkeleton from "./CustomerScreenSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

type CustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CustomersScreen"
>;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  order: number;
  cusId: string;
  title: string;
  orderCount: number;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const CUSTOMERS_PER_PAGE = 10;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMounted = useRef(true);

  // Safe state setters
  const safeSetCustomers = (data: Customer[]) => {
    if (isMounted.current) {
      setCustomers(data);
      setFilteredCustomers(data);
    }
  };

  const safeSetLoading = (isLoading: boolean) => {
    if (isMounted.current) {
      setLoading(isLoading);
    }
  };

  const safeSetLoadingMore = (isLoadingMore: boolean) => {
    if (isMounted.current) {
      setLoadingMore(isLoadingMore);
    }
  };

  const safeSetRefreshing = (isRefreshing: boolean) => {
    if (isMounted.current) {
      setRefreshing(isRefreshing);
    }
  };

  // Add focus listener to clear search when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Clear search when returning to this screen
      setSearchQuery("");
      setFilteredCustomers(customers);
    });

    return unsubscribe;
  }, [navigation, customers]);

  // Helper function to sort customers alphabetically by full name
  const sortCustomersByName = (customerList: Customer[]): Customer[] => {
    return [...customerList].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const loadCustomers = async (
    page = 1,
    showFullLoading = true,
    isLoadMore = false,
  ) => {
    if (showFullLoading) safeSetLoading(true);
    if (isLoadMore) safeSetLoadingMore(true);

    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        safeSetLoading(false);
        return;
      }

      const customersUrl = `${environment.API_BASE_URL.replace(/\/$/, "")}/api/customer/get-customers?page=${page}&limit=${CUSTOMERS_PER_PAGE}`;

      const response = await axios.get(customersUrl, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        const sortedCustomers = sortCustomersByName(response.data.data);

        if (isLoadMore) {
          if (isMounted.current) {
            setCustomers((prevCustomers) => {
              const updatedCustomers = [...prevCustomers, ...sortedCustomers];
              setFilteredCustomers(updatedCustomers);
              return updatedCustomers;
            });
          }
        } else {
          safeSetCustomers(sortedCustomers);
        }

        if (isMounted.current) {
          setHasMore(response.data.hasMore);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        }
      } else {
        if (!isLoadMore) {
          safeSetCustomers([]);
        }
        if (isMounted.current) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      if (!isLoadMore) {
        safeSetCustomers([]);
      }
      if (isMounted.current) {
        setHasMore(false);
        setError("Failed to load customers");
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        if (isMounted.current) {
          navigation.navigate("LoginScreen" as any);
        }
      }
    } finally {
      if (showFullLoading) safeSetLoading(false);
      if (isLoadMore) safeSetLoadingMore(false);
      safeSetRefreshing(false);
    }
  };

  const loadMoreCustomers = () => {
    if (!loadingMore && hasMore && searchQuery === "") {
      loadCustomers(currentPage + 1, false, true);
    }
  };

  useEffect(() => {
    // Set up listeners
    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted.current) {
        setCurrentPage(1);
        setHasMore(true);
        setError(null);
      }
      loadCustomers(1, true, false);
    });

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    // Initial load
    loadCustomers(1, true, false);

    // Cleanup function
    return () => {
      isMounted.current = false;
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadCustomers(1, false, false);
  };

  const handleSearch = (query: string) => {
    // Block special characters - only allow letters, numbers, spaces, and +
    const specialCharRegex = /[^a-zA-Z0-9\s+]/g;
    let cleanedQuery = query.replace(specialCharRegex, "");

    cleanedQuery = cleanedQuery.replace(/^\s+/, "");

    if (cleanedQuery.startsWith("+94")) {
      const digits = cleanedQuery.replace(/[^\d]/g, "");
      const limitedDigits = digits.slice(0, 9);
      cleanedQuery = "+" + limitedDigits;
    } else if (cleanedQuery.startsWith("0")) {
      const digits = cleanedQuery.replace(/[^\d]/g, "");
      const limitedDigits = digits.slice(0, 10);
      cleanedQuery = limitedDigits;
    } else if (
      cleanedQuery.length > 0 &&
      !isNaN(Number(cleanedQuery.charAt(0))) &&
      cleanedQuery.charAt(0) !== "0"
    ) {
      const digits = cleanedQuery.replace(/[^\d]/g, "");
      const limitedDigits = digits.slice(0, 9);
      cleanedQuery = limitedDigits;
    }

    setSearchQuery(cleanedQuery);

    const formattedQuery = cleanedQuery.startsWith("+94")
      ? cleanedQuery.replace("+94", "0")
      : cleanedQuery;

    if (cleanedQuery === "") {
      setFilteredCustomers(customers);
    } else {
      const filteredData = customers.filter((customer) => {
        const formattedPhoneNumber = formatPhoneNumber(customer.phoneNumber);
        const fullName =
          `${customer.firstName} ${customer.lastName}`.toLowerCase();
        const searchTerm = cleanedQuery.toLowerCase();

        return (
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          formattedPhoneNumber.includes(formattedQuery)
        );
      });

      setFilteredCustomers(sortCustomersByName(filteredData));
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber.startsWith("+94")
      ? phoneNumber.replace("+94", "0")
      : phoneNumber;
  };

  const isEmpty = filteredCustomers.length === 0;

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#7743D4" />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="bg-white flex-1">
        {/* Show Skeleton while loading */}
        {loading ? (
          <>
            <CustomersScreenSkeleton />
          </>
        ) : (
          <>
            {/* Header */}
            <LinearGradient
              colors={["#854BDA", "#6E3DD1"]}
              className="h-20 shadow-md px-4 pt-17 items-center justify-center"
            >
              <Text className="text-white text-lg mb-2">
                Total Customers:{" "}
                <Text className="font-bold">
                  {searchQuery ? filteredCustomers.length : totalCount}
                </Text>
              </Text>
            </LinearGradient>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F1FC] px-6 py-0 rounded-full mt-[-22px] mx-auto w-[90%] shadow-md h-12">
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search By Name, Phone Number"
                placeholderTextColor="#6839CF"
                className="flex-1 text-sm text-gray-700 h-11 py-0"
                style={{
                  fontStyle: "italic",
                  includeFontPadding: false,
                }}
              />
              <FontAwesome name="search" size={22} color="#884EDC" />
            </View>

            {/* Floating Button */}
            {!isKeyboardVisible && (
              <TouchableOpacity
                className="absolute bottom-28 right-6 w-14 h-14 rounded-full items-center justify-center"
                onPress={() => navigation.navigate("AddCustomersScreen" as any)}
                style={{
                  backgroundColor: "#7743D4",
                  shadowColor: "#8149D8",
                  shadowOffset: { width: 1, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 6,
                  zIndex: 1000,
                }}
              >
                <Ionicons name="add" size={45} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={{ paddingVertical: hp(2) }} className="flex-1 px-6">
              {error ? (
                <View className="flex-1 justify-center items-center px-4">
                  <Text className="text-red-500 text-center mt-4">{error}</Text>
                  <TouchableOpacity
                    onPress={() => loadCustomers(1, true, false)}
                    className="mt-4 bg-[#7743D4] px-6 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : isEmpty ? (
                <View className="flex-1 justify-center items-center">
                  <Image
                    source={require("@/assets/images/public/no-data.webp")}
                    style={{
                      width: wp("60%"),
                      height: hp("30%"),
                      resizeMode: "contain",
                    }}
                  />
                  {searchQuery ? (
                    <Text className="text-black italic text-center mt-4">
                      No customers found for "{searchQuery}"
                    </Text>
                  ) : (
                    <Text className="text-black italic text-center mt-4">
                      No registered customers yet
                    </Text>
                  )}
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onEndReached={searchQuery === "" ? loadMoreCustomers : null}
                  onEndReachedThreshold={0.1}
                  ListFooterComponent={renderFooter}
                  scrollEventThrottle={16}
                  renderItem={({ item }: { item: Customer }) => (
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() =>
                        navigation.navigate("ViewCustomerScreen", {
                          name: `${item.firstName} ${item.lastName}`,
                          title: item.title,
                          number: item.phoneNumber,
                          customerId: item.cusId,
                          id: item.id,
                        })
                      }
                    >
                      <View
                        style={{
                          backgroundColor: "white",
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#E0E0E0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.08,
                          shadowRadius: 6,
                          elevation: 4,
                        }}
                      >
                        <View className="flex-1 mr-3">
                          <Text
                            className="text-gray-700 font-semibold"
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {item.title}. {item.firstName} {item.lastName}
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {formatPhoneNumber(item.phoneNumber)}
                          </Text>
                        </View>
                        <View
                          className="items-end justify-center"
                          style={{ minWidth: 45 }}
                        >
                          <Text className="text-gray-700 font-semibold">
                            #
                            {item.orderCount < 10
                              ? `0${item.orderCount}`
                              : item.orderCount}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CustomersScreen;
