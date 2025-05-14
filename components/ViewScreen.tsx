import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import BackButton from "./BackButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { RouteProp } from "@react-navigation/native";

type ViewScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewScreen">;

type RootStackParamList = {
  ViewScreen: {
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageImage: string;
    selectedPackageTotal: string;
    selectedPackageDescription:string;
    selectedPackageportion: string;  
    selectedPackageperiod: string;
  };
};

type ViewScreenRouteProp = RouteProp<RootStackParamList, "ViewScreen">;




interface ViewScreenProps {
  navigation: ViewScreenNavigationProp;
  route: ViewScreenRouteProp;
}



const ViewScreen: React.FC<ViewScreenProps> = ({ navigation, route }) => {
  const { selectedPackageId, selectedPackageName, selectedPackageImage ,selectedPackageTotal,selectedPackageDescription,selectedPackageportion ,selectedPackageperiod  } = route.params;

  const [items, setItems] = useState<{ name: string; quantity: string; quantityType: string;  portion: number; period :number; }[]>([]);

  
  useEffect(() => {
    if (selectedPackageId) {
      fetchItemsForPackage(selectedPackageId); 
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
        setItems(response.data.data);  
        console.log("Items state updated:", response.data.data);  
      } else {
        console.log("No items found for this package.");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
    }
  };

 return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1 }}>
        {/* Top Section with Background Image */}
        <ImageBackground
          source={require("../assets/images/Union.png")}
          style={{ height: 220 }}
          className="rounded-b-3xl shadow-lg bg-[#E6DBF766]"
          resizeMode="cover"
        >
          <View className="ml-2">
            <BackButton navigation={navigation} />
          </View>
          <Image
            source={{ uri: selectedPackageImage }}
            className="w-64 h-64 self-center mb-2 mt-[-20%]"
            resizeMode="contain"
          />
        </ImageBackground>

        {/* Content Section */}
        <View style={{ flex: 1, marginTop: -28 , marginBottom: 50 }}>
          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 40,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            showsVerticalScrollIndicator={true}
          >
            {/* Title and Price */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-purple-600">{selectedPackageName}</Text>
              <Text className="text-lg font-bold text-gray-800">Rs. {selectedPackageTotal}</Text>
            </View>

            {/* Description */}
            <View className="flex-row items-start mb-6">
              {/* Vertical Line */}
              <View className="bg-purple-600 w-1 mr-3" style={{ height: '100%' }}></View>
              
              {/* Paragraph Text */}
              <Text className="text-gray-600 text-sm leading-6 mr-2">
                {selectedPackageDescription}
              </Text>
            </View>

            {/* Items List */}
            <Text className="text-gray-800 text-lg font-bold p-4">All ({items.length} items)</Text>
            {items.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center border-b border-gray-200 py-3 px-4">
                <Text className="text-gray-700 text-sm">{item.name}</Text>
                <Text className="text-gray-500 text-sm">{item.quantity}{item.quantityType}</Text>
              </View>
            ))}
            
            {/* Add some bottom padding for scrolling */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ViewScreen;
