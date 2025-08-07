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
  ActivityIndicator
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import CustomersScreenSkeleton from "../components/Skeleton/CustomerScreenSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../services/reducxStore'; // Adjust path as needed
import { setInputClick, clearInputClick } from '../store/navSlice';

type CustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "CustomersScreen">;

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
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const CUSTOMERS_PER_PAGE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMounted = useRef(true);
  const dispatch = useDispatch();
  const isClick = useSelector((state: RootState) => state.input.isClick);


    const handleInputFocus = () => {
      dispatch(setInputClick(1));
    };
  
    // Handle input blur - set isClick to 0
    const handleInputBlur = () => {
      dispatch(setInputClick(0));
    };

    useFocusEffect(
      React.useCallback(() => {
        // Track keyboard visibility
        const keyboardDidShowListener = Keyboard.addListener(
          'keyboardDidShow',
          () => {
            setKeyboardVisible(true);
          }
        );
        const keyboardDidHideListener = Keyboard.addListener(
          'keyboardDidHide',
          () => {
            setKeyboardVisible(false);
          }
        );
    
        // Only set to 0 if keyboard is not visible
        if (!isKeyboardVisible) {
          dispatch(setInputClick(0));
        }
    
        return () => {
          keyboardDidHideListener?.remove();
          keyboardDidShowListener?.remove();
        };
      }, [isKeyboardVisible])
    );

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
    const unsubscribe = navigation.addListener('focus', () => {
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

  const loadCustomers = async (page = 1, showFullLoading = true, isLoadMore = false) => {
    if (showFullLoading) safeSetLoading(true);
    if (isLoadMore) safeSetLoadingMore(true);

    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        safeSetLoading(false);
        return;
      }
      
      const customersUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/customer/get-customers?page=${page}&limit=${CUSTOMERS_PER_PAGE}`;
      
      const response = await axios.get(customersUrl, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      console.log("API Response:", response.data);

      if (response.data.success && response.data.data) {
        const sortedCustomers = sortCustomersByName(response.data.data);
        
        if (isLoadMore) {
          // Append new customers to existing ones
          if (isMounted.current) {
            setCustomers(prevCustomers => {
              const updatedCustomers = [...prevCustomers, ...sortedCustomers];
              setFilteredCustomers(updatedCustomers);
              return updatedCustomers;
            });
          }
        } else {
          // Replace customers (for initial load or refresh)
          safeSetCustomers(sortedCustomers);
        }
        
        if (isMounted.current) {
          setHasMore(response.data.hasMore);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        }
        
        console.log("Customers loaded:", response.data.data.length);
      } else {
        if (!isLoadMore) {
          safeSetCustomers([]);
        }
        if (isMounted.current) {
          setHasMore(false);
        }
        console.log("No customers data or success is false");
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
      console.log("Loading more customers, page:", currentPage + 1);
      loadCustomers(currentPage + 1, false, true);
    }
  };

  useEffect(() => {
    console.log("Component mounted");
    
    // Set up listeners
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused - loading customers");
      if (isMounted.current) {
        setCurrentPage(1);
        setHasMore(true);
        setError(null);
      }
      loadCustomers(1, true, false);
    });

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    // Initial load
    loadCustomers(1, true, false);

    // Cleanup function
    return () => {
      console.log("Component unmounting");
      isMounted.current = false;
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  const handleRefresh = async () => {
    console.log("Refreshing customers");
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
  //  setError(null);
    await loadCustomers(1, false, false);
  };

  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  
  //   const formattedQuery = query.startsWith("+94") ? query.replace("+94", "0") : query;
  
  //   if (query === "") {
  //     setFilteredCustomers(customers); 
  //   } else {
  //     const filteredData = customers.filter((customer) => {
  //       const formattedPhoneNumber = formatPhoneNumber(customer.phoneNumber);
        
  //       return (
  //         customer.firstName.toLowerCase().includes(query.toLowerCase()) ||
  //         customer.lastName.toLowerCase().includes(query.toLowerCase()) ||
  //         formattedPhoneNumber.includes(formattedQuery)
  //       );
  //     });
  
  //     // Keep the filtered results sorted alphabetically
  //     setFilteredCustomers(sortCustomersByName(filteredData));
  //   }
  // };

const handleSearch = (query: string) => {
  // Only remove leading spaces, but allow spaces within the search term
  const cleanedQuery = query.replace(/^\s+/, '');
  
  setSearchQuery(cleanedQuery);
  
  const formattedQuery = cleanedQuery.startsWith("+94") ? cleanedQuery.replace("+94", "0") : cleanedQuery;
  
  if (cleanedQuery === "") {
    setFilteredCustomers(customers); 
  } else {
    const filteredData = customers.filter((customer) => {
      const formattedPhoneNumber = formatPhoneNumber(customer.phoneNumber);
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const searchTerm = cleanedQuery.toLowerCase();
      
      return (
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        fullName.includes(searchTerm) || // This allows searching full name
        formattedPhoneNumber.includes(formattedQuery)
      );
    });

    // Keep the filtered results sorted alphabetically
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
      className="flex-1"
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
            <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
              <Text className="text-white text-lg font-bold">
                Total Customers: <Text className="font-bold">{searchQuery ? filteredCustomers.length : totalCount}</Text>
              </Text>
            </LinearGradient>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mt-[-22px] mx-auto w-[90%] shadow-md">
              <TextInput 
                value={searchQuery}
                onChangeText={handleSearch} 
                placeholder="Search By Name, Phone Number" 
                placeholderTextColor="#6839CF" 
                className="flex-1 text-sm text-gray-700" 
                style={{ fontStyle: 'italic' }}
                 onFocus={handleInputFocus}
                  onBlur={() => {
            
                    handleInputBlur();
                  }}
              />
              <Image source={require("../assets/images/search.webp")} className="w-6 h-6" resizeMode="contain" />
            </View>

            {/* Floating Button */}
            {!isKeyboardVisible && (
              <TouchableOpacity
                style={{ zIndex: 1000 }}
                className="absolute bottom-20 right-6 bg-[#7743D4] w-14 h-14 rounded-full items-center justify-center shadow-lg mb-1"
                onPress={() => navigation.navigate("AddCustomersScreen")}
              >
                <Image source={require("../assets/images/plus.webp")} className="w-6 h-6" resizeMode="contain" />
              </TouchableOpacity>
            )}

            <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }} className="flex-1">
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
                <View className="flex-1 justify-center items-center px-4 mt-[-20%]">
                  <Image source={require("../assets/images/searchr.webp")} style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }} />
                  {searchQuery && (
                    <Text className="text-gray-500 text-center mt-4">No customers found for "{searchQuery}"</Text>
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
                      onPress={() =>
                        navigation.navigate("ViewCustomerScreen", {
                          name: item.firstName,
                          title: item.title,
                          number: item.phoneNumber,
                          customerId: item.cusId,
                          id: item.id,
                        })
                      }
                    >
                      <View className="bg-white shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg border border-gray-200">
                        <View>
                          <Text className="text-gray-700 font-semibold">{item.title}.{item.firstName} {item.lastName}</Text>
                          <Text className="text-gray-500 text-sm">{formatPhoneNumber(item.phoneNumber)}</Text>
                        </View>
                        <Text className="text-gray-700 font-semibold">#{item.orderCount < 10 ? `0${item.orderCount}` : item.orderCount}</Text>
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