import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
} from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import NewCustomerDetailsScreenSkeleton from "./CustomerScreenSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NewCustomerDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "NewCustomerDetailsScreen"
>;

interface NewCustomerDetailsScreenProps {
  navigation: NewCustomerDetailsScreenNavigationProp;
}

import CustomerCard, { Customer } from "./CustomerCard";

type BuyerTab = "Retail" | "Wholesale";

const BUYER_TABS: BuyerTab[] = ["Retail", "Wholesale"];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Defined outside the component so it can be used by useMemo safely
const isCustomerNew = (createdAt?: string | null): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) return false;
  const diffDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 84;
};

const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return "";
  return phoneNumber.startsWith("+94")
    ? phoneNumber.replace("+94", "0")
    : phoneNumber;
};

const sortCustomersByName = (customerList: Customer[]): Customer[] => {
  return [...customerList].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

const NewCustomerDetailsScreen: React.FC<NewCustomerDetailsScreenProps> = ({
  navigation,
}) => {
  const CUSTOMERS_PER_PAGE = 10;
  const MIN_VISIBLE_PER_TAB = 8;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<BuyerTab>("Retail");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMounted = useRef(true);

  // 1) Filter by the selected tab (NULL buyerType is treated as Retail)
  const tabCustomers = useMemo(
    () => customers.filter((c) => (c.buyerType ?? "Retail") === activeTab),
    [customers, activeTab],
  );

  // 2) Then filter by search text
  const filteredCustomers = useMemo(() => {
    if (searchQuery === "") return tabCustomers;

    const searchTerm = searchQuery.toLowerCase();
    const formattedQuery = searchQuery.startsWith("+94")
      ? searchQuery.replace("+94", "0")
      : searchQuery;

    return sortCustomersByName(
      tabCustomers.filter((customer) => {
        const fullName =
          `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return (
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          formatPhoneNumber(customer.phoneNumber).includes(formattedQuery)
        );
      }),
    );
  }, [tabCustomers, searchQuery]);

  const safeSetCustomers = (data: Customer[]) => {
    if (isMounted.current) {
      setCustomers(data);
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

      const customersUrl = `${environment.API_BASE_URL.replace(/\/$/, "")}/api/customer/get-customers?page=${page}&limit=${CUSTOMERS_PER_PAGE}&type=new`;

      const response = await axios.get(customersUrl, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        const rawList = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        const validCustomers = rawList.filter(
          (c: any) =>
            c &&
            c.id != null &&
            isCustomerNew(c.createdAt || c.created_at),
        );
        const sortedCustomers = sortCustomersByName(validCustomers);

        if (isLoadMore) {
          if (isMounted.current) {
            setCustomers((prev) => [...prev, ...sortedCustomers]);
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

  // Focus listener: reset search + tab + state, then reload
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted.current) {
        setSearchQuery("");
        setActiveTab("Retail");
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

  // Because tabs are filtered on the phone while the API pages across all
  // buyer types, keep fetching pages until the active tab has enough rows.
  useEffect(() => {
    if (
      !loading &&
      !loadingMore &&
      !error &&
      hasMore &&
      searchQuery === "" &&
      tabCustomers.length < MIN_VISIBLE_PER_TAB
    ) {
      loadMoreCustomers();
    }
  }, [
    tabCustomers.length,
    hasMore,
    loading,
    loadingMore,
    error,
    activeTab,
    searchQuery,
  ]);

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
      const limitedDigits = digits.slice(0, 11);
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

    // filteredCustomers is derived, so only the query needs to be stored
    setSearchQuery(cleanedQuery);
  };

  const formatCustomerCount = (count: number): string => {
    if (count === 0) return "0";
    return String(count).padStart(2, "0");
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
      {/* Tap anywhere on the background to dismiss the keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-white">
          {/* Header */}
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            className="shadow-md px-6 justify-center"
            style={{
              paddingBottom: 24,
              height: 100,
              justifyContent: "center",
            }}
          >
            <View className="w-full flex-row items-center justify-between px-4">
              <View style={{ width: 48 }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ alignItems: "flex-start" }}
                >
                  <Entypo
                    name="chevron-left"
                    size={25}
                    color={"white"}
                    style={{
                      borderRadius: 50,
                      padding: 12,
                      backgroundColor: "#F6F6F680",
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-1 items-center">
                <Text
                  className="text-white font-semibold"
                  style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 18 }}
                >
                  New Customers :{" "}
                  <Text className="font-bold">
                    {formatCustomerCount(
                      searchQuery
                        ? filteredCustomers.length
                        : tabCustomers.length,
                    )}
                  </Text>
                </Text>
              </View>

              <View style={{ width: 48 }} />
            </View>
          </LinearGradient>

          {/* Show Skeleton while loading */}
          {loading ? (
            <NewCustomerDetailsScreenSkeleton />
          ) : (
            <View className="flex-1 mx-auto w-full">
              {/* Search Bar (own touchable so taps on its padding don't dismiss the keyboard) */}
              <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
                <View
                  className="flex-row items-center bg-[#F5F1FC] h-[50px] px-6 py-0 mb-4 rounded-full mt-[-6%] mx-6"
                  style={{
                    borderRadius: 999,
                    backgroundColor: "#F5F1FC",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#000000",
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
                    returnKeyType="search"
                    className="flex-1 text-sm text-gray-700 bg-[#F5F1FC] h-11 py-0"
                    style={{
                      fontStyle: "italic",
                      includeFontPadding: false,
                      fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                    }}
                  />
                  <FontAwesome name="search" size={22} color="#884EDC" />
                </View>
              </TouchableWithoutFeedback>

              {/* Retail / Wholesale tabs */}
              <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#F5F5F5",
                    borderRadius: 12,
                    padding: 4,
                    marginHorizontal: 24,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: "#E5E5E5",
                  }}
                >
                  {BUYER_TABS.map((tab) => {
                    const selected = activeTab === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        activeOpacity={0.8}
                        onPress={() => setActiveTab(tab)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 9,
                          alignItems: "center",
                          backgroundColor: selected ? "#000000" : "#FFFFFF",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "600",
                            fontSize: SCREEN_HEIGHT > 900 ? 15 : 13,
                            color: selected ? "#FFFFFF" : "#657489",
                          }}
                        >
                          {tab} Buyers
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>

              <View style={{ paddingVertical: 10 }} className="flex-1 px-4">
                {error ? (
                  <View className="flex-1 justify-center items-center px-4">
                    <Text className="text-red-500 text-center mt-4">
                      {error}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setError(null);
                        setHasMore(true);
                        loadCustomers(1, true, false);
                      }}
                      className="mt-4 bg-[#7743D4] px-6 py-2 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : isEmpty && loadingMore ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingBottom: 110,
                    }}
                  >
                    <ActivityIndicator size="large" color="#7743D4" />
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
                    <Text
                      style={{
                        color: "black",
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: 16,
                        fontSize: SCREEN_HEIGHT > 900 ? 18 : 14,
                      }}
                    >
                      {searchQuery
                        ? `No customers found for "${searchQuery}"`
                        : `No ${activeTab.toLowerCase()} customers yet`}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id.toString()}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={
                      Platform.OS === "ios" ? "on-drag" : "none"
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReached={
                      searchQuery === "" ? loadMoreCustomers : undefined
                    }
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={renderFooter}
                    scrollEventThrottle={16}
                    renderItem={({ item }: { item: Customer }) => (
                      <CustomerCard
                        customer={item}
                        onPress={() =>
                          navigation.navigate("ViewCustomerScreen", {
                            name: `${item.firstName} ${item.lastName}`.trim(),
                            title: item.title,
                            number: item.phoneNumber,
                            customerId: item.cusId,
                            id: item.id,
                          })
                        }
                      />
                    )}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default NewCustomerDetailsScreen;