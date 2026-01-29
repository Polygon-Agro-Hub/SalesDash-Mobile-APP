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
import BackButton from "../common/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "react-native-screens";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

type ExcludeAddMoreNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeAddMore"
>;

interface ExcludeListAddProps {
  navigation: ExcludeAddMoreNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeAddMore">;
}

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { id , customerId,name, title} = route.params;
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]); // New state to store filtered crops
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
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
          params: { customerId:id },
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
  }, [id])
);

//   const handleSearch = (query: string) => {
//   // Only remove leading spaces, but allow numbers and special characters within the text
//   const cleanedQuery = query.replace(/^\s+/, '');
  
//   setSearchQuery(cleanedQuery);
//   setSearchError(null); // Clear any previous error
  
//   if (cleanedQuery === "") {
//     setFilteredCrops(crops);
//   } else {
//     const filtered = crops.filter((crop) =>
//       crop.displayName.toLowerCase().includes(cleanedQuery.toLowerCase())
//     );
//     setFilteredCrops(filtered);
    
//     // Set error if no results found
//     if (filtered.length === 0) {
//       setSearchError("No products found matching your search");
//     }
//   }
// };

const handleSearch = (query: string) => {
  let cleanedQuery = query;
  
  // Remove special characters, keep only letters (a-z, A-Z), numbers (0-9), and spaces
  cleanedQuery = cleanedQuery.replace(/[^a-zA-Z0-9\s]/g, '');
  
  // If the query starts with space and there's no letter/number before it, remove the leading space
  if (cleanedQuery.length > 0 && cleanedQuery[0] === ' ') {
    cleanedQuery = cleanedQuery.replace(/^\s+/, '');
  }
  
  // Prevent multiple consecutive spaces
  cleanedQuery = cleanedQuery.replace(/\s+/g, ' ');
  
  setSearchQuery(cleanedQuery);
  setSearchError(null); // Clear any previous error
  
  if (cleanedQuery === "") {
    setFilteredCrops(crops);
  } else {
    const filtered = crops.filter((crop) =>
      crop.displayName.toLowerCase().includes(cleanedQuery.toLowerCase())
    );
    setFilteredCrops(filtered);
    
    // Set error if no results found
    if (filtered.length === 0) {
      setSearchError("No products found matching your search");
    }
  }
};


useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Clear search state when screen comes into focus
    setSearchQuery("");
    setSearchError(null);
    // Reset filtered crops to show all crops
    if (crops.length > 0) {
      setFilteredCrops(crops);
    }
  });

  return unsubscribe;
}, [navigation, crops]);

  const handlesubmitexcludelist = async () => {

    setLoading(true)

    try {
        const token = await AsyncStorage.getItem("authToken");
          if (!token) {
      console.error("No authentication token found");
      return;
    }

     const payload = {
      customerId:id,          
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
     navigation.navigate("ExcludeItemEditSummery" as any, { id: id, customerId:customerId, name: name, title:title })
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
        
      handlesubmitexcludelist();
    
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
       style={{ flex: 1}}
      className=" bg-white"
    >
      <View className="flex-1 ">
  
          <View className="bg-white flex-row items-center h-17  px-1">
                <TouchableOpacity
            style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                onPress={() => navigation.navigate("ExcludeItemEditSummery" as any, { id: id, customerId:customerId, name: name, title:title })}
          >
            <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
              <AntDesign name="left" size={20} color="black" />
            </View>
          </TouchableOpacity>
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
          className="p-3 pr-10 flex-row justify-between items-center border border-[#6B3BCF] rounded-full bg-[#F5F1FC]"
          placeholder="Search Products"
          placeholderTextColor="black"
          value={searchQuery}
          onFocus={() => setIsKeyboardVisible(true)}
          onChangeText={handleSearch}
        />
        
        {/* Search icon positioned inside the TextInput */}
        <Ionicons
          name="search"
          size={24}
          color="#6C3CD1"
            style={{ position: "absolute", right: 20, marginTop: Platform.OS === 'ios' ? 20 : 20, transform: [{ translateY: -12 }] }}
        />
      </View>
</View>

    {searchError && (
                   <View className="flex-1">
    <View className="justify-center items-center mt-4">
      <LottieView
        source={require("../../assets/images/NoComplaints.json")}
        style={{ width: wp(50), height: hp(50) }}
        autoPlay
        loop
      />
    </View>
    <View className="justify-center items-center mt-[-50]">
      <Text className="text-red-600 text-center text-base">{searchError}</Text>
    </View>
  </View>
                  )}
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
        <View className="flex-1  " >
            
    
       <FlatList          
  keyboardShouldPersistTaps='handled'       
  data={filteredCrops}       
  renderItem={({ item }) => (         
    <TouchableOpacity 
      onPress={() => toggleSelect(item.id)}
      className="flex-row justify-between items-center my-1 px-6 mb-2"
    >           
      {/* Crop name and selection toggle */}                      
      <View className="flex-row items-center space-x-4">
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            selectedCrops.includes(item.id) 
              ? "bg-red-600 border-red-600" 
              : "bg-white border-gray-400"
          }`}
        >
          {selectedCrops.includes(item.id) && (
            <Ionicons name="close" size={16} color="white" />
          )}
        </View>                         
        <Text className="text-black text-base font-medium">{item.displayName}</Text>
      </View>            

      {/* Crop image */}
      <Image 
        source={{ uri: item.image }} 
        style={{ width: 60, height: 60 }} 
        resizeMode="contain" 
      />            
    </TouchableOpacity>         
  )}
/>
        </View>
      </View>
     {!isKeyboardVisible && (
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-20 px-6">
      <TouchableOpacity onPress={handleNavigateIfNoCropsSelected} className=" bottom-[14%] left-0 right-0 items-center " disabled={loading} >
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
              Add
            </Text>
          </View>
        )}
              {/* <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                Continue
              </Text> */}
            </LinearGradient>
          </TouchableOpacity>
          </View>
     )}
    </KeyboardAvoidingView>
  );
};

export default ExcludeListAdd;
