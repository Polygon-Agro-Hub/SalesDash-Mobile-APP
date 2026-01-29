import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  BackHandler,
  RefreshControl
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import { RootStackParamList } from "../types/types"; 
import { Bar } from 'react-native-progress';
import { LinearGradient } from "expo-linear-gradient";
import DashboardSkeleton from "../Skeleton/DashboardSkeleton"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";


type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, "DashboardScreen">;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}



interface Package {
  id: number;
  displayName: string;
  image: string;
  name?: string;
  price?: string;
  total: string; // This will be the calculated total
  description: string;
  portion?: number;
  period?: number;
  // Add the new fields from API response
  packingFee: string;
  productPrice: string;
  serviceFee: string;
  status: string;
  createdAt?: string;
}


interface AgentStats {
  daily: {
    target: number;
    completed: number;
    numOfStars: number;
    progress: number;
  };
  monthly: {
    totalStars: number;
  };
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [ totalprice , setTotalprice] = useState()
  const [formData, setFormData] = useState({ firstName: "" , image:""});
  const [packages, setPackages] = useState<Package[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats>({
    daily: {
      target: 10,
      completed: 0,
      numOfStars: 0,
      progress: 0
    },
    monthly: {
      totalStars: 0
    }
  });

  // useEffect(() => {
  //   // Handle hardware back button (Android)
  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
  //     // Return true to prevent default behavior (going back)
  //     return true;
  //   });
  
  //   return () => backHandler.remove();
  // }, []);


  
  
  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([getUserProfile(), fetchPackages(), fetchAgentStats()]);
    setIsLoading(false);
  };


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshData();
    });
    
    return unsubscribe;
  }, [navigation]);


  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {

        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
        return;
      }
      setToken(storedToken);

      const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      setFormData(response.data.data);
     // console.log("''''''",response.data)
    } catch (error) {
      console.error("Profile fetch error:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
        return;
      }
      Alert.alert("Error", "Failed to fetch user profile");
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
      return;
    }
  };

  

  useEffect(() => {
    const checkTokenExpiration = async () => {
      try {
        const expirationTime = await AsyncStorage.getItem(
          "tokenExpirationTime"
        );
        const userToken = await AsyncStorage.getItem("authToken");

        if (expirationTime && userToken) {
          const currentTime = new Date();
          const tokenExpiry = new Date(expirationTime);

          if (currentTime < tokenExpiry) {
            console.log("Token is valid");
          } else {
            console.log("Token expired, clearing storage.");
            await AsyncStorage.multiRemove([
              "userToken",
              "tokenStoredTime",
              "tokenExpirationTime",
            ]);
            Alert.alert("Sorry","No authenticated user found, please login again")
            navigation.reset({
              index: 0,
              routes: [{ name: "LoginScreen" }],
            });   
           }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });     
       }
    };

    checkTokenExpiration();
  }, [navigation]);


  const fetchPackages = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      setToken(storedToken);

      const response = await axios.get<{ data: Package[] }>(
        `${environment.API_BASE_URL}api/packages/get-packages`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
        
      );
  console.log(response.data)

      setPackages(response.data.data);
    } catch (error) {
      console.error("Package fetch error:", error);
    }
  };


  const fetchAgentStats = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: AgentStats }>(
        `${environment.API_BASE_URL}api/orders/sales-agent`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

      setAgentStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
      
    }
  };

  const total = 

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );
  

  if (isLoading) {
    return <DashboardSkeleton />;
  }


 const renderPackage = ({ item }: { item: Package }) => {

  const totalPrice = (parseFloat(item.packingFee) + parseFloat(item.productPrice) + parseFloat(item.serviceFee));
const formattedTotalPrice = totalPrice.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

  return (
    
    <View
      className="bg-white rounded-xl m-3 p-3 w-[45%] items-center mb-6"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Image source={{ uri: item.image }} className="w-20 h-20 mb-3 " resizeMode="contain" />
      <Text className="font-bold text-[#6A3AD0] text-center">{item.displayName}</Text>
      <Text className="text-sm font-medium text-gray-500">
        Rs.{formattedTotalPrice}
      </Text>
    
      <TouchableOpacity
        onPress={() => 
          navigation.navigate("ViewScreen" as any, {
            selectedPackageId: item.id,
            selectedPackageName: item.displayName,
            selectedPackageImage: item.image,
            selectedPackageTotal: formattedTotalPrice, 
            selectedPackageDescription: item.description,
            selectedPackageportion: item.portion,
            selectedPackageperiod: item.period,
            selectedPackagePackingFee: item.packingFee,
            selectedPackageProductPrice: item.productPrice,
            selectedPackageServiceFee: item.serviceFee,
          })
        }
        className="items-center"
      >
        <LinearGradient
          colors={["#854BDA", "#6E3DD1"]}
          style={{
            marginTop: 12,
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 20,
          }}
        >
          <Text className="text-white font-bold text-sm">View</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="bg-white shadow-md p-5 rounded-b-3xl">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => navigation.navigate("SidebarScreen")}>
                {/* <Image source={require("../assets/images/profile.png")} className="w-12 h-12 rounded-full" /> */}
                {formData.image ? (
  <Image
    source={{ uri: formData.image }}  
    className="w-12 h-12 rounded-full"
    resizeMode="cover"
  />
) : (
  <Image
    source={require("../../assets/images/profile.webp")}  
    className="w-12 h-12 rounded-full"
    resizeMode="cover"
  />
)}
              </TouchableOpacity>
              <Text className="ml-3 text-lg font-bold text-gray-800">Hello, {formData.firstName}</Text>
            </View>
            <View className="flex-row items-center">
             
              <View className="flex-row items-center bg-[#E6DBF766] py-1 px-3 rounded-full">
                <Image source={require("../../assets/images/star.webp")} className="w-6 h-6" resizeMode="contain" />
                <Text className="ml-2 font-bold text-gray-700">{agentStats.monthly.totalStars}</Text>
              </View>
            </View>
          </View>

       
       {/* Progress Bar */}
<Text className="text-lg text-purple-600 mt-5 font-bold">
  Your Daily Target
</Text>
<View className="flex-row bg-[#824AD933] h-14 rounded-xl items-center mt-3 px-6">
  <Text
    className="absolute text-purple-600 text-sm font-bold"
    style={{
      top: 2,
      left: "50%", 
      transform: [{ translateX: -12 }], 
    }}
  >
    {agentStats.daily.completed}/{agentStats.daily.target || '0'}
  </Text>
  <View className="mt-2">
  <Bar
  progress={agentStats.daily.progress}
  width={wp("68%")}
  color="#854BDA"
  unfilledColor="#FFFFFF"  /* Add this line to make unfilled portion white */
  borderWidth={0}
  height={10}
/>
</View>
  <Image
    source={require("../../assets/images/star.webp")} 
    className="w-8 absolute right-0 h-8 mr-3"
    resizeMode="contain"
  />
</View>
        </View>

        {/* Packages Section with Pull to Refresh */}
        <ScrollView 
          className="flex-1 mb-10"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshData}
              colors={["#854BDA"]}
              tintColor="#854BDA"
            />
          }
        >
          <Text className="text-xl font-bold text-[#874CDB] mt-6 ml-6 mb-2">
            Packages
          </Text>
          <View className="p-2">
          <FlatList
            data={packages}
            renderItem={renderPackage}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ 
              paddingHorizontal: 10, 
              paddingLeft: 2,
              paddingBottom: 60
            }}
          />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DashboardScreen;