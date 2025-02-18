import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
//import { RootStackParamList } from "./types"; 
import Navbar from "./Navbar"; 
import BackButton from "./BackButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { RouteProp } from "@react-navigation/native";

type ViewScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewScreen">;
type ViewScreenRouteProp = RouteProp<RootStackParamList, "ViewScreen">; 
type RootStackParamList = {
  ViewScreen: { selectedPackage: Package };
};



interface ViewScreenProps {
  navigation: ViewScreenNavigationProp;
  route: ViewScreenRouteProp;
}
interface Package {
  id: number;
  name: string;
  total: string; // Change "price" to "total" to match API response
  description:string;
}



const ViewScreen: React.FC<ViewScreenProps> = ({ navigation, route }) => {
  const selectedPackage = route.params?.selectedPackage;

  //console.log("Selected Package:", selectedPackage);


    
      const [token, setToken] = useState<string | null>(null);
      const [packages, setPackages] = useState<Package[]>([]);
      const [items, setItems] = useState<{ name: string; quantity: string; quantityType: string }[]>([]);





      // useEffect(() => {
      //   console.log("Packages state updated:", packages);
      // }, [packages]);
      
      

       useEffect(() => {
     
          fetchPackages(); // Fetch packages from the backend
        }, []);

        useEffect(() => {
          if (selectedPackage) {
            fetchItemsForPackage(selectedPackage.id); // Fetch items for selected package
          }
        }, [selectedPackage]);
        
      
    

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
        
            //console.log("API Response:", response.data);
            
            if (response.data && response.data.data) {
              setPackages(response.data.data);
            } else {
              console.log("No packages found in response.");
            }
          } catch (error) {
            console.error("Error fetching packages:", error);
            Alert.alert("Error", "Failed to fetch packages");
          }
        };

        const fetchItemsForPackage = async (packageId: number) => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) {
              Alert.alert("Error", "No authentication token found");
              return;
            }
        
            const response = await axios.get<{ data: { name: string; quantity: string, quantityType: string }[] }>(
              `${environment.API_BASE_URL}api/packages/${packageId}/items`,
              {
                headers: { Authorization: `Bearer ${storedToken}` },
              }
            );
        
          //  console.log("Fetched Items:", response.data);  // Check the response data
        
            if (response.data && response.data.data) {
              setItems(response.data.data);  // Update the state with the fetched data
              console.log("Items state updated:", response.data.data);  // Verify the updated state
            } else {
              console.log("No items found for this package.");
            }
          } catch (error) {
            console.error("Error fetching items:", error);
            Alert.alert("Error", "Failed to fetch items for the package");
          }
        };
        
        
        
    

    


  return (
    <View className="flex-1 bg-gray-100">
      {/* Top Section with Background Image */}
      
      <ImageBackground
        source={require("../assets/images/Union.png")}
        className="h-64 rounded-b-3xl shadow-lg bg-[#E6DBF766]"
        resizeMode="cover"
      >
<View className="ml-2">
  <BackButton navigation={navigation} />
  </View>
          <Image
            source={require("../assets/images/viewPack.png")} // Replace with your product image path
            className="w-64 h-64 self-center mb-2 mt-[-20%]"
            resizeMode="contain"
          />

      </ImageBackground>

      {/* Scrollable Details Section */}
      <ScrollView className="flex-1 bg-white rounded-t-3xl -mt-7 px-6 pt-6 shadow-lg">
        {/* Title and Price */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-purple-600">{selectedPackage.name}</Text>
          <Text className="text-lg font-bold text-gray-800">Rs.  {selectedPackage?.total}</Text>
        </View>

        {/* Description */}
        <View className="flex-row items-start mb-6">
          {/* Vertical Line */}
          <View className="bg-purple-600 w-1 mr-3" style={{ height: "100%" }}></View>
          
          {/* Paragraph Text */}
          <Text className="text-gray-600 text-sm leading-6 mr-2">
            {selectedPackage.description}
          </Text>
        </View>

        {/* Person and Duration */}
        <View className="items-center mb-6">
  <TouchableOpacity className="bg-[#F5F1FC] flex-row items-center justify-center px-8 py-4 rounded-full">
    <View className="bg-white rounded-full p-2">
      <Image
        source={require("../assets/images/Bell Service.png")} 
        className="w-5 h-5"
        resizeMode="contain"
      />
    </View>
    <Text className="text-purple-600 text-base font-medium mr-6 ml-1"> 01 person</Text> 

    <View className="bg-white rounded-full p-2 ml-8 mt-[-2]">
      <Image
        source={require("../assets/images/Clock.png")}
        className="w-5 h-5"
        resizeMode="contain"
      />
    </View>
    <Text className="text-purple-600 text-base font-medium ml-1">01 week</Text>
  </TouchableOpacity>
</View>

        {/* List Section */}
        <Text className="text-gray-800 text-lg font-bold p-4">All ({items.length} items)</Text>
        <View   style={{ marginBottom: 50, flexShrink: 0 }} >
        {items.map((item, index) => {
  console.log("Rendering item:", item);  // Log each item being rendered
  return (
    <View
      key={index}
      className="flex-row justify-between items-center border-b border-gray-200 py-3 px-4"
    
    >
      <Text className="text-gray-700 text-sm">{item.name}</Text>
      <Text className="text-gray-500 text-sm">{item.quantity}{item.quantityType}</Text>
    </View>
  );
})}
</View>

      </ScrollView>

      {/* Navbar */}
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default ViewScreen;
