import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  FlatList,
  Keyboard,
  ActivityIndicator
} from "react-native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "react-native-screens";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";

type ExcludeListAddNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeListAdd"
>;

interface ExcludeListAddProps {
  navigation: ExcludeListAddNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeListAdd">;
}

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId } = route.params || {};
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]); // New state to store filtered crops
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false)
  console.log("selected Crop", selectedCrops)
  const toggleSelect = (id: number) => {
    setSelectedCrops(
      (prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((cropId) => cropId !== id) // Unselect if already selected
          : [...prevSelected, id] // Select if not selected
    );
  };

useFocusEffect(
  useCallback(() => {
    setSelectedCrops([])
    const fetchProducts = async () => {
      try {
        // setLoading(true);

        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          //   setError("No authentication token found");
          //   setLoading(false);
          return;
        }

        const apiUrl = `${environment.API_BASE_URL}api/customer/croplist`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${storedToken}` },
          params: { customerId:customerId },
        });

        console.log(response.data);

        if (response.data && response.data.data) {
          setCrops(response.data.data);
           setFilteredCrops(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        // setError("Failed to load products. Please try again.");
      } finally {
        // setLoading(false);
      }
    };

    fetchProducts();
 return () => {
    };
  }, [customerId])
);

    const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredCrops(crops); // If search is cleared, reset to all crops
    } else {
      const filtered = crops.filter((crop) =>
        crop.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCrops(filtered); // Update filtered crops
    }
  };

  const handlesubmitexcludelist = async () => {

    setLoading(true)

    try {
        const token = await AsyncStorage.getItem("authToken");
          if (!token) {
      console.error("No authentication token found");
      return;
    }

     const payload = {
      customerId,          
      selectedCrops,       
    };

         const checkResponse = await axios.post(
            `${environment.API_BASE_URL}api/customer/add/excludelist`,
              payload,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

        console.log("Response:", checkResponse.data);
      if (checkResponse.status === 200) {
      console.log("Exclude list updated successfully");
      navigation.navigate("Main", {
        screen: "ExcludeListSummery",
        params : {customerId: customerId}
      })
    } else if (checkResponse.status === 400) {
      console.error("Bad request:", checkResponse.data.message);
    } else if (checkResponse.status === 404) {
      console.error("Not Found:", checkResponse.data.message);
    }
  } catch (err) {
    console.error("Error posting exclude list:", err);
  }finally{
        setLoading(false)
    }
  }

    const handleNavigateIfNoCropsSelected = () => {
        
    if (selectedCrops.length === 0) {
         navigation.navigate("Main", {
        screen: "ExcludeListSummery",
        params : {customerId: customerId}
      })
    } else {
      handlesubmitexcludelist();
    }
  };

  useEffect(()=>{
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true); // Keyboard is visible, hide the button
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false); // Keyboard is hidden, show the button
      }
    );

    return () => {
      // Cleanup listeners when the component is unmounted
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      className="flex-1  bg-white"
    >
      <View className="flex-1 ">
  
          <View className="bg-white flex-row items-center h-17  px-1">
            <BackButton navigation={navigation} />
            {/* Title */}
            <Text
              style={{ fontSize: 18 }}
              className="font-bold text-center text-[#6C3CD1] flex-grow mr-9 text-xl "
            >
              Exclude Item List
            </Text>
          </View>

          <View className="px-5 ">
            <Text className="text-center text-sm">
              Exclude any items your customer doesn’t want in their package.
              Simply tap on the Products they want to remove.
            </Text>
          </View>
{/* 
<View className="px-6">
          <View className="p-1 px-6 mt-8 flex-row justify-between items-center border border-[#6B3BCF] rounded-full">
            <TextInput className="   " placeholder="Search Products" value={searchQuery}
            onChangeText={handleSearch}>

            </TextInput>
 <Ionicons
            name="search"
            size={24}
            color="#6C3CD1"
          />

          </View>
</View> */}

<View className="px-6 mt-6 mb-6">
        <View className="relative">
        {/* TextInput with search icon inside */}
        <TextInput
          className="p-3 pr-10 flex-row justify-between items-center border border-[#6B3BCF] rounded-full"
          placeholder="Search Products"
          value={searchQuery}
          onFocus={() => setIsKeyboardVisible(true)}
          onChangeText={handleSearch}
        />
        
        {/* Search icon positioned inside the TextInput */}
        <Ionicons
          name="search"
          size={24}
          color="#6C3CD1"
            style={{ position: "absolute", right: 20, marginTop: Platform.OS === 'ios' ? 10 : 5, transform: [{ translateY: -12 }] }}
        />
      </View>
</View>
                {/* <ScrollView
          className="flex-1  px-3 mb-[45%]"
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4 mt-8">
            {crops.map((crop) => (
              <View
                key={crop.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 4,
                }}
              >
                <View className="flex-row justify-center items-center gap-6 ">
                  <TouchableOpacity onPress={() => toggleSelect(crop.id)}>
                    <View
                      className={`w-6 h-6 rounded-full border justify-center items-center ${
                        selectedCrops.includes(crop.id)
                          ? "bg-[#FF0000] border-[#FF0000]"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedCrops.includes(crop.id) && (
                        <Ionicons name="close" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, color: "#000", marginLeft: 10 }}>
                    {crop.displayName}
                  </Text>
                </View>

                <Image
                  source={{ uri: crop.image }}
                  style={{ width: 60, height: 60, marginRight: 10 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          
          </View>
          
             
        </ScrollView> */}
        <View className="flex-1   mb-[45%]" >
            
    
         <FlatList
         keyboardShouldPersistTaps = 'handled'
      data={filteredCrops}
      renderItem={({ item }) => (
        <View className="flex-row justify-between  items-center my-1 px-6 mb">
          {/* Crop name and selection toggle */}
          <View className="flex-row items-center space-x-6">
            <TouchableOpacity onPress={() => toggleSelect(item.id)}>
              <View
                className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                  selectedCrops.includes(item.id) ? "bg-red-600 border-red-600" : "bg-white border-gray-400"
                }`}
              >
                {selectedCrops.includes(item.id) && (
                  <Ionicons name="close" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
            <Text className="text-lg text-black">{item.displayName}</Text>
          </View>

          {/* Crop image */}
          <Image source={{ uri: item.image }} style={{ width: 60, height: 60, marginRight: 10 }} resizeMode="contain" />
        </View>
        
      )}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingBottom: 20 }} // Adding padding at the bottom
    />
        </View>
      </View>
     {!isKeyboardVisible && (
      <TouchableOpacity onPress={handleNavigateIfNoCropsSelected} className="absolute bottom-[14%] left-0 right-0 items-center " disabled={loading} >
            <LinearGradient
              colors={["#6C3CD1", "#9B65D6"]}
              start={[0, 0]}
              end={[1, 1]}
              style={{
                width: "70%",
                paddingVertical: 12,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
                {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              Continue
            </Text>
          </View>
        )}
              {/* <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                Continue
              </Text> */}
            </LinearGradient>
          </TouchableOpacity>
     )}
    </KeyboardAvoidingView>
  );
};

export default ExcludeListAdd;
