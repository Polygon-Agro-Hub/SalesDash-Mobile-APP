import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, StatusBar, Modal } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "./types";
import LottieView from "lottie-react-native";

type AttachGeoLocationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AttachGeoLocationScreen"
>;

type AttachGeoLocationScreenRouteProp = RouteProp<
  RootStackParamList,
  "AttachGeoLocationScreen"
>;

interface AttachGeoLocationScreenProps {
  navigation: AttachGeoLocationScreenNavigationProp;
  route: AttachGeoLocationScreenRouteProp;
}

const AttachGeoLocationScreen: React.FC<AttachGeoLocationScreenProps> = ({
  navigation,
  route,
}) => {
  const mapRef = useRef<MapView>(null);

  // Get params from navigation (if coming from registration screen)
  const currentLatitude = route.params?.currentLatitude;
  const currentLongitude = route.params?.currentLongitude;
  const onLocationSelect = route.params?.onLocationSelect;

  // Default to Negombo, Sri Lanka if no initial coordinates
  const [region, setRegion] = useState({
    latitude: currentLatitude || 7.2008,
    longitude: currentLongitude || 79.8358,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [markerPosition, setMarkerPosition] = useState({
    latitude: currentLatitude || 7.2008,
    longitude: currentLongitude || 79.8358,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false); // New state for confirm loading
  const [locationName, setLocationName] = useState("Tap on the map to select a location");

  // Get current location on mount
  useEffect(() => {
    if (!currentLatitude || !currentLongitude) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature."
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Animate to new location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }

      // Get address
      await getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Unable to get your current location");
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results.length > 0) {
        const address = results[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");
        setLocationName(addressString || "Location selected");
      }
    } catch (error) {
      console.error("Error getting address:", error);
      setLocationName("Location selected");
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    getAddressFromCoordinates(latitude, longitude);
  };

  const handleConfirmLocation = async () => {
    // Show loading modal
    setIsAttaching(true);

    // Simulate processing delay (you can adjust or remove this)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Pass the location data back to the previous screen
    if (route.params?.onLocationSelect) {
      route.params.onLocationSelect(
        markerPosition.latitude,
        markerPosition.longitude,
        locationName
      );
    }
    
    // Hide loading modal
    setIsAttaching(false);
    
    // Go back to previous screen
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View 
        className="bg-white flex-row items-center shadow-lg px-3 py-4 mt-[-10%]"
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: wp(2), paddingVertical: hp(1) }}
        >
          <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
            <AntDesign name="left" size={20} color="black" />
          </View>
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-bold text-purple-600 mr-9">
          Attach Geo Location
        </Text>
      </View>

      <View className="items-center justify-center mt-[-5%]">
        <Text className="text-[#828282]">Tap on the map to select a location.</Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4) }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1, borderRadius: 12 }}
          initialRegion={region}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setMarkerPosition({ latitude, longitude });
            getAddressFromCoordinates(latitude, longitude);
          }}
        >
          <Marker coordinate={markerPosition} />
        </MapView>

        {/* Use My Location Floating Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={isLoading}
          style={{
            position: "absolute",
            right: wp(4),
            bottom: hp(2),
            backgroundColor: "#fff",
            width: wp(12),
            height: wp(12),
            borderRadius: wp(6),
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="locate" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 flex-row justify-between">
        {/* Use My Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={isLoading || isAttaching}
          className="flex-1 mr-2"
        >
          <View className={`border border-[#6C3CD1] rounded-full py-3 px-4 flex-row items-center justify-center ${(isLoading || isAttaching) ? 'opacity-50' : ''}`}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#6C3CD1" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#6C3CD1" />
                <Text className="text-[#6C3CD1] font-semibold ml-2 text-sm">
                  Use My Location
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Confirm Now Button */}
        <TouchableOpacity
          onPress={handleConfirmLocation}
          disabled={isAttaching}
          className="flex-1 ml-2"
        >
          <View className={`bg-[#874DDB] rounded-full py-3 px-4 flex-row items-center justify-center shadow-md ${isAttaching ? 'opacity-50' : ''}`}>
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-sm">
              Confirm Now
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isAttaching}
        onRequestClose={() => {}}
      >
        <View 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View 
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              minWidth: wp(70),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            {/* Custom Loader */}
            {/* <View style={{ marginBottom: 20 }}>
              <ActivityIndicator size="large" color="#6C3CD1" />
            </View> */}
               <LottieView
                          source={require("../assets/images/loading.json")}
                          style={{ width: wp(20), height: hp(20) }}
                          autoPlay
                          loop
                        />
            
            <Text 
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#000',
                textAlign: 'center',
              }}
            >
              Attaching your geo location..
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttachGeoLocationScreen;