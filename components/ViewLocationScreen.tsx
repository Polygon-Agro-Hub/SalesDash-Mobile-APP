import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, StatusBar } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "./types";

type ViewLocationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewLocationScreen"
>;

type ViewLocationScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewLocationScreen"
>;

interface ViewLocationScreenProps {
  navigation: ViewLocationScreenNavigationProp;
  route: ViewLocationScreenRouteProp;
}

const ViewLocationScreen: React.FC<ViewLocationScreenProps> = ({
  navigation,
  route,
}) => {
  const mapRef = useRef<MapView>(null);
  
  // Get location data from params
  const { latitude, longitude, locationName } = route.params;

  const region = {
    latitude: latitude || 7.2008,
    longitude: longitude || 79.8358,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    // Animate to the location when component mounts
    if (mapRef.current && latitude && longitude) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 500);
    }
  }, []);

  return (
    <View className="flex-1 bg-white">
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
          <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center  ">
            <AntDesign name="left" size={20} color="black" />
          </View>
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-bold text-purple-600 mr-9 ">
          Attach Geo Location
        </Text>
      </View>

      {/* Location Info Card */}
      {/* <View
        style={{
          backgroundColor: "#f8f9fa",
          marginHorizontal: wp(4),
          marginTop: hp(2),
          padding: wp(4),
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e0e0e0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: hp(0.5) }}>
          <Ionicons name="location" size={20} color="#059669" />
          <Text
            style={{
              fontSize: wp(3.5),
              fontWeight: "600",
              color: "#059669",
              marginLeft: wp(2),
            }}
          >
            Selected Location
          </Text>
        </View>
        
        {locationName && (
          <Text
            style={{
              fontSize: wp(4),
              fontWeight: "500",
              color: "#000",
              marginBottom: hp(1),
              marginLeft: wp(7),
            }}
          >
            {locationName}
          </Text>
        )}
        
        <Text style={{ fontSize: wp(3.2), color: "#888", marginLeft: wp(7) }}>
          Lat: {latitude?.toFixed(6)} • Lng: {longitude?.toFixed(6)}
        </Text>
      </View> */}

      {/* Map */}
      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4), marginBottom: hp(2) }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1, borderRadius: 12 }}
          initialRegion={region}
        >
          {latitude && longitude && (
            <Marker
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title={locationName || "Selected Location"}
              description={`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`}
            />
          )}
        </MapView>
      </View>

      {/* Bottom Button */}
      {/* <View
        style={{
          paddingHorizontal: wp(4),
          paddingVertical: hp(2),
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: "#7C3AED",
            paddingVertical: hp(1.8),
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: wp(4),
              fontWeight: "600",
            }}
          >
            Back to Registration
          </Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

export default ViewLocationScreen;