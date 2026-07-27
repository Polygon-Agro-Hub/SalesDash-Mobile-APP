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
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const DUMMY_CUSTOMERS: Customer[] = [
  {
    id: "1",
    firstName: "Pasindu",
    lastName: "Perera",
    phoneNumber: "+94771234567",
    order: 1,
    cusId: "CUS-406",
    title: "Mr",
    orderCount: 5,
  },
  {
    id: "2",
    firstName: "Nimal",
    lastName: "Silva",
    phoneNumber: "+94777654321",
    order: 2,
    cusId: "CUS-407",
    title: "Mr",
    orderCount: 12,
  },
  {
    id: "3",
    firstName: "Kamal",
    lastName: "Gunawardena",
    phoneNumber: "+94712345678",
    order: 3,
    cusId: "CUS-408",
    title: "Mr",
    orderCount: 3,
  },
  {
    id: "4",
    firstName: "Ruwan",
    lastName: "Fernando",
    phoneNumber: "+94754321098",
    order: 4,
    cusId: "CUS-409",
    title: "Mr",
    orderCount: 8,
  },
  {
    id: "5",
    firstName: "Saman",
    lastName: "Kumara",
    phoneNumber: "+94723456789",
    order: 5,
    cusId: "CUS-410",
    title: "Mr",
    orderCount: 1,
  },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const CUSTOMERS_PER_PAGE = 10;
  const insets = useSafeAreaInsets();
  
  const topInset = Platform.OS === "ios" ? insets.top : 0;

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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSearchQuery("");
      setFilteredCustomers(customers);
    });

    return unsubscribe;
  }, [navigation, customers]);

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
      setError(null);
      // Simulate small load delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const sortedCustomers = sortCustomersByName(DUMMY_CUSTOMERS);

      if (isLoadMore) {
        // No-op for load more since we load all at once locally
      } else {
        safeSetCustomers(sortedCustomers);
      }

      if (isMounted.current) {
        setHasMore(false);
        setCurrentPage(1);
        setTotalCount(sortedCustomers.length);
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
    } finally {
      if (showFullLoading) safeSetLoading(false);
      if (isLoadMore) safeSetLoadingMore(false);
      safeSetRefreshing(false);
    }
  };

  const loadMoreCustomers = () => {
    // No-op
  };

  useEffect(() => {
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

    loadCustomers(1, true, false);

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
      <View className="flex-1 bg-white">
        {/* Header */}
        <LinearGradient
          colors={["#854BDA", "#6E3DD1"]}
          className="shadow-md px-4 items-center justify-center"
          style={{
            height: hp(12) + topInset,
            paddingTop: Platform.OS === "ios" ? topInset + 8 : 16,
            paddingBottom: 24,
          }}
        >
          <View className="w-full max-w-[500px] items-center">
            <Text
              className="text-white font-semibold"
              style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 18 }}
            >
              Total Customers:{" "}
              <Text className="font-bold">
                {String(
                  searchQuery ? filteredCustomers.length : totalCount,
                ).padStart(2, "0")}
              </Text>
            </Text>
          </View>
        </LinearGradient>

        {/* Show Skeleton while loading */}
        {loading ? (
          <CustomersScreenSkeleton />
        ) : (
          <View className="flex-1 mx-auto w-full max-w-[500px]">
            {/* Search Bar */}
            <View
              className="flex-row items-center bg-[#F5F1FC] h-[50px] px-6 py-0 mb-5 rounded-full mt-[-6%] mx-6"
              style={{
                borderRadius: 999,
                backgroundColor: "#F5F1FC",
                ...Platform.select({
                  ios: {
                    shadowColor: "#7E7E7E",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              }}
            >
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search By Name, Phone Number"
                placeholderTextColor="#6839CF"
                className="flex-1 text-sm text-gray-700 bg-[#F5F1FC] h-11 py-0"
                style={{
                  fontStyle: "italic",
                  includeFontPadding: false,
                  fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                }}
              />
              <FontAwesome name="search" size={22} color="#884EDC" />
            </View>



            <View style={{ paddingVertical: 10 }} className="flex-1 px-4">
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
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingBottom: 110,
                  }}
                >
                  <Image
                    source={require("@/assets/images/public/no-data.webp")}
                    style={{
                      width: wp("50%"),
                      height: wp("50%"),
                      maxWidth: 200,
                      maxHeight: 200,
                      resizeMode: "contain",
                    }}
                  />
                  {searchQuery ? (
                    <Text
                      style={{
                        color: "black",
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: 16,
                        fontSize: SCREEN_HEIGHT > 900 ? 18 : 14,
                      }}
                    >
                      No customers found for "{searchQuery}"
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: "black",
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: 16,
                        fontSize: SCREEN_HEIGHT > 900 ? 18 : 14,
                      }}
                    >
                      No registered customers yet
                    </Text>
                  )}
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onEndReached={searchQuery === "" ? loadMoreCustomers : null}
                  onEndReachedThreshold={0.1}
                  ListFooterComponent={renderFooter}
                  scrollEventThrottle={16}
                  renderItem={({ item }: { item: Customer }) => (
                    <View>
                     
                      <View
                        style={{
                          marginBottom: 12,
                          marginHorizontal: 4,
                          borderRadius: 20,
                          ...Platform.select({
                            ios: {
                              backgroundColor: "white",
                              shadowColor: "#7E7E7E",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.15,
                              shadowRadius: 6,
                            },
                            android: {
                              backgroundColor: "white",
                              borderWidth: 1,
                              borderColor: "#E0E0E0",
                              elevation: 3,
                            },
                          }),
                        }}
                      >
                        <View
                          style={{
                            borderRadius: 20,
                            ...Platform.select({
                              ios: {
                                overflow: "hidden",
                                borderWidth: 1,
                                borderColor: "#E0E0E0",
                                backgroundColor: "white",
                              },
                              android: {
                                backgroundColor: "transparent",
                              },
                            }),
                            padding: 16,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View className="flex-1 mr-3">
                            <Text
                              className="text-gray-700 font-semibold"
                              numberOfLines={2}
                              ellipsizeMode="tail"
                              style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 14 }}
                            >
                              {item.title}. {item.firstName} {item.lastName}
                            </Text>
                            <Text
                              className="text-gray-500"
                              style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                            >
                              {formatPhoneNumber(item.phoneNumber)}
                            </Text>
                          </View>
                          <View
                            className="items-end justify-center"
                            style={{ minWidth: 45 }}
                          >
                            <Text
                              className="text-gray-700 font-semibold"
                              style={{ fontSize: SCREEN_HEIGHT > 900 ? 18 : 16 }}
                            >
                              #
                              {item.orderCount < 10
                                ? `0${item.orderCount}`
                                : item.orderCount}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CustomersScreen;