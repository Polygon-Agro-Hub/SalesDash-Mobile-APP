import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, StatusBar, BackHandler } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "../types/types";

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
  const webViewRef = useRef<WebView>(null);
  
  // Get location data from params
  const { latitude, longitude, locationName } = route.params;

    useFocusEffect(
      useCallback(() => {
          const onBackPress = () => {
              navigation.goBack();
              return true;
          };
      
          const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
          return () => backHandler.remove();
      }, [navigation])
    );

  const lat = latitude || 7.2008;
  const lng = longitude || 79.8358;

  useEffect(() => {
    // Animate to the location when component mounts
    if (webViewRef.current && latitude && longitude) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (typeof map !== 'undefined') {
            map.setView([${lat}, ${lng}], 13);
          }
          true;
        `);
      }, 500);
    }
  }, []);

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        #map {
          height: 100%;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialize map
        var map = L.map('map').setView([${lat}, ${lng}], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add marker
        var marker = L.marker([${lat}, ${lng}]).addTo(map);
        
        // Add popup to marker
        ${locationName ? `
          marker.bindPopup(\`
            <div style="font-family: Arial, sans-serif;">
              <strong style="font-size: 14px; color: #7C3AED;">${locationName.replace(/`/g, '\\`')}</strong><br/>
              <span style="font-size: 12px; color: #666;">
                Lat: ${lat.toFixed(6)}<br/>
                Lng: ${lng.toFixed(6)}
              </span>
            </div>
          \`).openPopup();
        ` : `
          marker.bindPopup(\`
            <div style="font-family: Arial, sans-serif;">
              <strong style="font-size: 14px; color: #7C3AED;">Selected Location</strong><br/>
              <span style="font-size: 12px; color: #666;">
                Lat: ${lat.toFixed(6)}<br/>
                Lng: ${lng.toFixed(6)}
              </span>
            </div>
          \`).openPopup();
        `}
        
        // Disable scroll zoom on mobile for better UX
        if (window.innerWidth < 768) {
          map.scrollWheelZoom.disable();
        }
        
        // Disable interactions (read-only map)
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
      </script>
    </body>
    </html>
  `;

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
          <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
            <AntDesign name="left" size={20} color="black" />
          </View>
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-bold text-purple-600 mr-9">
          Attach Geo Location
        </Text>
      </View>

      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4), marginBottom: hp(2) }}>
        <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHTML }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            style={{ flex: 1 }}
          />
        </View>
      </View>

    </View>
  );
};

export default ViewLocationScreen;