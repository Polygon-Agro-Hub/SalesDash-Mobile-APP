import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ProgressBarAndroid,
  Alert,
  ScrollView
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import { RootStackParamList } from "./types"; 

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

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DashboardScreen"
>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}
interface Package {
  id: number;
  name: string;
  price: string;
  description:string;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  // const packages = [
  //   { id: 1, name: "Family Pack", price: "Rs.3000", image: require("../assets/images/epack.png") },
  //   { id: 2, name: "Salad Essentials", price: "Rs.2000", image: require("../assets/images/salad.png") },
  //   { id: 3, name: "Fruity Pack", price: "Rs.1800", image: require("../assets/images/fruits.png") },
  //   { id: 4, name: "All Grains", price: "Rs.3500", image: require("../assets/images/grain.png") },
  //   { id: 5, name: "Fruity Pack", price: "Rs.1800", image: require("../assets/images/fruits.png") },
  //   { id: 6, name: "All Grains", price: "Rs.3500", image: require("../assets/images/grain.png") },
  // ];
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "" });
  const [packages, setPackages] = useState<Package[]>([]);


  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getUserProfile();
    fetchPackages(); // Fetch packages from the backend
  }, []);
  


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
      setIsLoading(false);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch packages");
      console.error(error);
      setIsLoading(false);
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
    <Text className="font-bold text-[#6A3AD0]">{item.name}</Text>
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
  onPress={() => navigation.navigate("ViewScreen", { selectedPackage: item })} // Ensure key matches expected parameter
  className="items-center"
>

        <Text className="text-white font-bold text-sm">View</Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>


  );

  return (
    <View className="flex-1 bg-white">
       
      {/* Header Section */}
      <View className="bg-white shadow-md p-5 rounded-b-3xl">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate("SidebarScreen")}>
          <Image
              source={require("../assets/images/profile.png")} // Replace with your profile image path
              className="w-12 h-12 rounded-full"
          />
          </TouchableOpacity>

            <Text className="ml-3 text-lg font-bold text-gray-800">
              Hello, {formData.username} 
            </Text>
          </View>
          <View className="flex-row items-center bg-[#E6DBF766] py-1 px-3 rounded-full">
          <Image
            source={require("../assets/images/star.png")} 
            className="w-6 h-6"
            resizeMode="contain"
          />
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
                  <ProgressBarAndroid
                    styleAttr="Horizontal"
                    indeterminate={false}
                    progress={0.8} 
                    color="#854BDA"
                    className="flex-1"
                  />
                  <Image
                    source={require("../assets/images/star.png")} 
                    className="w-8 h-8 ml-5"
                    resizeMode="contain"
                  />
                </View>

        
      </View>

      {/* Packages Section */}
      <Text className="text-xl font-bold text-[#874CDB] mt-6 ml-6 mb-2">
        Packages
      </Text>
      <FlatList
        data={packages}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10, paddingLeft: 2 }}
      />
      {/* Navbar */}
      
      <Navbar navigation={navigation}activeTab="DashboardScreen"/>
    </View>
  );
};

export default DashboardScreen;
