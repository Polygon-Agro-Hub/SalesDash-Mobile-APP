import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, StatusBar, Linking } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "./types";
import WebView from 'react-native-webview'; 

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
  const { latitude, longitude, locationName } = route.params;

  const lat = latitude || 7.2008;
  const lng = longitude || 79.8358;

  // This is the HTML/JS code that will run inside the WebView.
  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>OSM Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #map { width: 100%; height: 100%; }
      .leaflet-container { background: #ddd; }
      
      /* Status indicator */
      .status-indicator {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      
      /* Location info box */
      .location-info {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-size: 12px;
        border: 1px solid #e0e0e0;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      }
      
      .location-title {
        font-weight: bold;
        color: #7C3AED;
        margin-bottom: 5px;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>

    <script>
      let map = null;
      let marker = null;
      
      function updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = message;
        }
        console.log('STATUS:', message);
      }
      
      function initMap() {
        try {
          updateStatus('Creating map...');
          
          // Initialize the map with default blue marker
          map = L.map('map').setView([${lat}, ${lng}], 14);
          
          updateStatus('Adding map tiles...');
          
          // Add OpenStreetMap tile layer with proper attribution
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);
          
          updateStatus('Adding marker...');
          
          // Add the marker with default blue Leaflet icon
          marker = L.marker([${lat}, ${lng}], {
            title: '${(locationName || "Selected Location").replace(/'/g, "\\'")}'
          }).addTo(map);
          
          updateStatus('Location loaded ✓');
          
        } catch (error) {
          updateStatus('Error: ' + error.message);
          console.error('Map error:', error);
        }
      }
      
      // Handle external links
      document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.href.includes('openstreetmap.org')) {
          e.preventDefault();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXTERNAL_LINK',
            url: e.target.href
          }));
        }
      });
      
      // Initialize map when page loads
      document.addEventListener('DOMContentLoaded', initMap);
      
      // Fallback initialization
      setTimeout(function() {
        if (!map) {
          updateStatus('Fallback initialization...');
          initMap();
        }
      }, 1000);
    </script>
  </body>
</html>
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'EXTERNAL_LINK') {
        Linking.openURL(data.url);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
          View Geo Location
        </Text>
      </View>
 
      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4), marginBottom: hp(2), borderRadius: 12, overflow: 'hidden' }}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith('https://www.openstreetmap.org/')) {
              Linking.openURL(request.url);
              return false;
            }
            return true;
          }}
          originWhitelist={['*']}
          onError={(error) => console.error('WebView error:', error)}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#666', marginBottom: 10 }}>Loading location...</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default ViewLocationScreen;