import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
//import { RootStackParamList } from "./types"; 
import BackButton from "./BackButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { RouteProp } from "@react-navigation/native";

type ViewScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewScreen">;
//type ViewScreenRouteProp = RouteProp<RootStackParamList, "ViewScreen">; 
type RootStackParamList = {
  ViewScreen: {
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageTotal: string;
    selectedPackageDescription:string;
    selectedPackageportion: string;  // Add this
    selectedPackageperiod: string;
  };
};

type ViewScreenRouteProp = RouteProp<RootStackParamList, "ViewScreen">;




interface ViewScreenProps {
  navigation: ViewScreenNavigationProp;
  route: ViewScreenRouteProp;
}
interface Package {
  id: number;
  name: string;
  total: string; 
  description:string;
  portion: number;
   period :number;
}



const ViewScreen: React.FC<ViewScreenProps> = ({ navigation, route }) => {
  const { selectedPackageId, selectedPackageName, selectedPackageTotal,selectedPackageDescription,selectedPackageportion ,selectedPackageperiod  } = route.params;

  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<{ name: string; quantity: string; quantityType: string;  portion: number; period :number; }[]>([]);

  // Fetch items for the selected package
  useEffect(() => {
    if (selectedPackageId) {
      fetchItemsForPackage(selectedPackageId); // Fetch items for selected package
    }
  }, [selectedPackageId]);

  const fetchItemsForPackage = async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await axios.get<{ data: { name: string; quantity: string, quantityType: string, portion: number; period :number }[] }>(
        `${environment.API_BASE_URL}api/packages/${packageId}/items`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

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
        <KeyboardAvoidingView 
                                   behavior={Platform.OS === "ios" ? "padding" : "height"}
                                   enabled 
                                   className="flex-1"
                                   >
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
          source={require("../assets/images/viewPack.png")}
          className="w-64 h-64 self-center mb-2 mt-[-20%]"
          resizeMode="contain"
        />
      </ImageBackground>

      {/* Scrollable Details Section */}
      <ScrollView className="flex-1 bg-white rounded-t-3xl -mt-7 px-6 pt-6 shadow-lg"
      keyboardShouldPersistTaps="handled"
      >
        {/* Title and Price */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-purple-600">{selectedPackageName}</Text>
          <Text className="text-lg font-bold text-gray-800">Rs.  {selectedPackageTotal}</Text>
        </View>

        {/* Description */}
        <View className="flex-row items-start mb-6">
          {/* Vertical Line */}
          <View className="bg-purple-600 w-1 mr-3" style={{ height: "100%" }}></View>
          
          {/* Paragraph Text */}
          <Text className="text-gray-600 text-sm leading-6 mr-2">
         { selectedPackageDescription}
          </Text>
        </View>

        {/* Person and Duration */}
        {/* <View className="items-center mb-6">
          <TouchableOpacity className="bg-[#F5F1FC] flex-row items-center justify-center px-8 py-4 rounded-full">
            <View className="bg-white rounded-full p-2">
              <Image
                source={require("../assets/images/Bell Service.png")}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </View>
            <Text className="text-purple-600 text-base font-medium mr-6 ml-1">{selectedPackageportion} person</Text> 

            <View className="bg-white rounded-full p-2 ml-8 mt-[-2]">
              <Image
                source={require("../assets/images/Clock.png")}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </View>
            <Text className="text-purple-600 text-base font-medium ml-1">{selectedPackageperiod} week</Text>
          </TouchableOpacity>
        </View> */}

       
        <Text className="text-gray-800 text-lg font-bold p-4">All ({items.length} items)</Text>
        <View style={{ marginBottom: 50, flexShrink: 0 }}>
          {items.map((item, index) => {
            console.log("Rendering item:", item);  // Log each item being rendered
            return (
              <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3 px-4">
                <Text className="text-gray-700 text-sm">{item.name}</Text>
                <Text className="text-gray-500 text-sm">{item.quantity}{item.quantityType}</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Navbar */}
    </View>
    </KeyboardAvoidingView>
  );
};

export default ViewScreen;
