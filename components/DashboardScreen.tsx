import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import { RootStackParamList } from "./types"; 
import { Bar } from 'react-native-progress';

import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import DashboardSkeleton from "../components/Skeleton/DashboardSkeleton"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, "DashboardScreen">;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

interface Package {
  id: number;
  displayName: string;
  price: string;
  description: string;
  portion: number;
   period :number;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "" });
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    const skeletonMinDuration = 3000; // Ensure skeleton shows for at least 3 seconds
    const startTime = Date.now(); // Track when the loading starts

    const fetchData = async () => {
      try {
        // Fetch data asynchronously
        await Promise.all([getUserProfile(), fetchPackages()]);

        // Calculate elapsed time and remaining time to ensure the skeleton is shown for at least 3 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = skeletonMinDuration - elapsedTime;

        if (remainingTime > 0) {
          setTimeout(() => setIsLoading(false), remainingTime);
        } else {
          setIsLoading(false); // Hide skeleton if fetch takes longer than 3 seconds
        }
      } catch (error) {
        console.error("Error during data fetch:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Fetch user profile data
  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }
      setToken(storedToken);

      const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      setFormData(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
    }
  };

  // Fetch packages
  const fetchPackages = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      setToken(storedToken);

      const response = await axios.get<{ data: Package[] }>(
        `${environment.API_BASE_URL}api/packages/get-packages`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

      setPackages(response.data.data); // Ensure response structure matches
    } catch (error) {
      Alert.alert("Error", "Failed to fetch packages");
      console.error(error);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const renderPackage = ({ item }: any) => (
    <View
    className="bg-white rounded-xl m-3 p-3 w-[45%] items-center mb-6"
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 10, // Android shadow
    }}
  >
   <Image source={require("../assets/images/fruits.png")} className="w-20 h-20 mb-3" resizeMode="contain" />
    <Text className="font-bold text-[#6A3AD0]">{item.displayName}</Text>
      <Text className="text-sm font-medium text-gray-500">Rs. {item.total}</Text>
  
    <LinearGradient
      colors={["#854BDA", "#6E3DD1"]}
      style={{
        marginTop: 12,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 20,
      }}
    >
      <TouchableOpacity
  //onPress={() => navigation.navigate("ViewScreen", { selectedPackage: item })} // Ensure key matches expected parameter
  onPress={() => 
    navigation.navigate("ViewScreen", {
      selectedPackageId: item.id,
      selectedPackageName: item.name,
      selectedPackageTotal: item.total,
      selectedPackageDescription: item.description,
      selectedPackageportion: item.portion,  // Assuming this is a number
      selectedPackageperiod: item.period    // Assuming this is a number
    })
  }
  

  className="items-center"
>

        <Text className="text-white font-bold text-sm">View</Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>


  );

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
              <Image source={require("../assets/images/profile.png")} className="w-12 h-12 rounded-full" />
            </TouchableOpacity>

            <Text className="ml-3 text-lg font-bold text-gray-800">Hello, {formData.firstName}</Text>
          </View>
          <View className="flex-row items-center bg-[#E6DBF766] py-1 px-3 rounded-full">
            <Image source={require("../assets/images/star.png")} className="w-6 h-6" resizeMode="contain" />
            <Text className="ml-2 font-bold text-gray-700">10</Text>
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
            8/10
          </Text>
                    <Bar
                      progress={0.8} // Set progress value here
                      width={200} // Set width for progress bar
                      color="#854BDA" // Set progress bar color
                      borderWidth={0} // Optional: to remove border around the progress bar
                      height={10} // Optional: height of the progress bar
                    />

                  <Image
                    source={require("../assets/images/star.png")} 
                    className="w-8 h-8 ml-5"
                    resizeMode="contain"
                  />
                </View>

        
      </View>

       {/* Packages Section */}
       <ScrollView className="flex-1">
        <Text className="text-xl font-bold text-[#874CDB] mt-6 ml-6 mb-2">
          Packages
        </Text>
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
      </ScrollView>
    </View>
    </KeyboardAvoidingView >
  );
};

export default DashboardScreen;
