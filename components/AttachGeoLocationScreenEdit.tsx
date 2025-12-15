import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, StatusBar, Modal, Linking } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import * as Location from "expo-location";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RootStackParamList } from "./types";
import LottieView from "lottie-react-native";
import WebView from 'react-native-webview';

type AttachGeoLocationScreenEditNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AttachGeoLocationScreenEdit"
>;

type AttachGeoLocationScreenEditRouteProp = RouteProp<
  RootStackParamList,
  "AttachGeoLocationScreenEdit"
>;

interface AttachGeoLocationScreenEditProps {
  navigation: AttachGeoLocationScreenEditNavigationProp;
  route: AttachGeoLocationScreenEditRouteProp;
}

const AttachGeoLocationScreenEdit: React.FC<AttachGeoLocationScreenEditProps> = ({
  navigation,
  route,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [initialLocationSent, setInitialLocationSent] = useState(false);

  // Get params from navigation
  const currentLatitude = route.params?.currentLatitude;
  const currentLongitude = route.params?.currentLongitude;
  const onLocationSelect = route.params?.onLocationSelect;

  // Default to Negombo, Sri Lanka if no initial coordinates
  const initialLat = currentLatitude || 7.2008;
  const initialLng = currentLongitude || 79.8358;

  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [locationName, setLocationName] = useState("Tap on the map to select a location");

  // Track WebView states
  useEffect(() => {
    console.log('WebView State:', {
      webViewLoaded,
      isWebViewReady,
      isMapReady,
      initialLocationSent
    });
  }, [webViewLoaded, isWebViewReady, isMapReady, initialLocationSent]);

  // Send location to WebView only when everything is ready
  const sendLocationToWebView = useCallback((lat: number, lng: number, animate: boolean = false) => {
    if (webViewRef.current && isWebViewReady && isMapReady && webViewLoaded) {
      console.log('✅ All conditions met, sending location to WebView:', { lat, lng, animate });
      webViewRef.current.postMessage(JSON.stringify({
        type: 'SET_LOCATION',
        latitude: lat,
        longitude: lng,
        animate: animate
      }));
      setInitialLocationSent(true);
    } else {
      console.log('⚠️ Conditions not met:', {
        webViewRef: !!webViewRef.current,
        isWebViewReady,
        isMapReady,
        webViewLoaded
      });
    }
  }, [isWebViewReady, isMapReady, webViewLoaded]);

  // Get current location on mount
  useEffect(() => {
    if (!currentLatitude || !currentLongitude) {
      getCurrentLocation();
    }
  }, []);

  // Send initial location when map becomes ready
  useEffect(() => {
    if (isMapReady && !initialLocationSent) {
      console.log('🗺️ Map is ready, sending initial location...');
      // Small delay to ensure map is fully ready
      setTimeout(() => {
        sendLocationToWebView(markerPosition.latitude, markerPosition.longitude, false);
      }, 1000);
    }
  }, [isMapReady, markerPosition, initialLocationSent, sendLocationToWebView]);

  const getCurrentLocation = async () => {
    // Only allow if WebView is ready
    if (!isWebViewReady || !isMapReady) {
      Alert.alert(
        "Map Not Ready",
        "Please wait for the map to fully load before using your location."
      );
      return;
    }

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

      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;

      console.log('📍 Got location:', { newLat, newLng });
      
      setMarkerPosition({
        latitude: newLat,
        longitude: newLng,
      });

      // Get address
      await getAddressFromCoordinates(newLat, newLng);
      
      // Send to WebView
      sendLocationToWebView(newLat, newLng, true);
      
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

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Received from WebView:', data.type);
      
      if (data.type === 'MAP_CLICK') {
        const { latitude, longitude } = data;
        setMarkerPosition({ latitude, longitude });
        getAddressFromCoordinates(latitude, longitude);
      }
      
      if (data.type === 'WEBVIEW_READY') {
        console.log('✅ WebView DOM is ready!');
        setIsWebViewReady(true);
      }
      
      if (data.type === 'MAP_READY') {
        console.log('🗺️ Map is fully ready and interactive!');
        setIsMapReady(true);
      }
      
      if (data.type === 'EXTERNAL_LINK') {
        Linking.openURL(data.url);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const handleConfirmLocation = async () => {
    setIsAttaching(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (route.params?.onLocationSelect) {
      route.params.onLocationSelect(
        markerPosition.latitude,
        markerPosition.longitude,
        locationName
      );
    }
    
    setIsAttaching(false);
    navigation.goBack();
  };

  // Updated HTML content with better ready state management
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>OSM Map Edit</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-container { background: #ddd; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
    /* Status indicator */
    .status-indicator {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255, 255, 255, 0.95);
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      border-left: 4px solid #007AFF;
    }
    
    /* Address display box */
    .address-box {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 15px;
      text-align: center;
      border: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    }
    
    .address-box .title {
      font-weight: 700;
      color: #7C3AED;
      margin-bottom: 6px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    let map = null;
    let marker = null;
    let isMapInitialized = false;
    
    // Update status display
    function updateStatus(message) {
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = message;
      }
    }
    
    // Initialize map
    function initMap() {
      updateStatus('🔄 Creating map...');
      
      try {
        // Notify React Native that WebView DOM is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'WEBVIEW_READY',
          status: 'success',
          timestamp: Date.now()
        }));
        
        // Create map
        map = L.map('map', {
          center: [${initialLat}, ${initialLng}],
          zoom: 14,
          zoomControl: true
        });
        
        // Add OSM tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        
        // Handle map load event
        map.whenReady(function() {
          console.log('Map is fully loaded and ready');
          updateStatus('✅ Map ready! Click to select location');
          isMapInitialized = true;
          
          // Notify React Native that map is fully ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_READY',
            status: 'ready',
            timestamp: Date.now()
          }));
          
          // Add initial marker
          createOrUpdateMarker(${initialLat}, ${initialLng});
        });
        
        // Handle map clicks
        map.on('click', function(e) {
          console.log('Map clicked at:', e.latlng.lat, e.latlng.lng);
          handleMapClick(e.latlng.lat, e.latlng.lng);
        });
        
      } catch (error) {
        updateStatus('❌ Map error: ' + error.message);
        console.error('Map initialization error:', error);
      }
    }
    
    // Create or update marker
    function createOrUpdateMarker(lat, lng) {
      if (!marker) {
        // Create new marker
        marker = L.marker([lat, lng], {
          draggable: true,
          title: 'Selected Location'
        }).addTo(map);
        
        // Add drag event to marker
        marker.on('dragend', function(e) {
          const pos = marker.getLatLng();
          console.log('Marker dragged to:', pos.lat, pos.lng);
          updateLocation(pos.lat, pos.lng);
        });
      } else {
        // Move existing marker
        marker.setLatLng([lat, lng]);
      }
    }
    
    // Handle map click
    function handleMapClick(lat, lng) {
      createOrUpdateMarker(lat, lng);
      updateLocation(lat, lng);
    }
    
    // Update location and notify React Native
    function updateLocation(lat, lng) {
      // Update address display
      const addressText = document.getElementById('addressText');
      if (addressText) {
        addressText.textContent = \`Lat: \${lat.toFixed(6)}, Lng: \${lng.toFixed(6)}\`;
      }
      
      // Send to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'MAP_CLICK',
        latitude: lat,
        longitude: lng,
        timestamp: Date.now()
      }));
      
      updateStatus(\`📍 Location set: \${lat.toFixed(6)}, \${lng.toFixed(6)}\`);
    }
    
    // Handle messages from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message type:', data.type);
        
        if (data.type === 'SET_LOCATION') {
          console.log('Processing SET_LOCATION:', data.latitude, data.longitude);
          
          if (!isMapInitialized) {
            console.log('Map not initialized yet, waiting...');
            updateStatus('🔄 Map loading, please wait...');
            
            // Wait for map to be ready
            const checkMapReady = setInterval(function() {
              if (isMapInitialized && map) {
                clearInterval(checkMapReady);
                createOrUpdateMarker(data.latitude, data.longitude);
                
                if (data.animate) {
                  map.setView([data.latitude, data.longitude], 14, {
                    animate: true,
                    duration: 1
                  });
                }
                updateStatus('✅ Location updated!');
              }
            }, 100);
          } else {
            // Map is ready, set location immediately
            createOrUpdateMarker(data.latitude, data.longitude);
            
            if (data.animate) {
              map.setView([data.latitude, data.longitude], 14, {
                animate: true,
                duration: 1
              });
            }
            
            updateStatus('✅ Location updated!');
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
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
    window.addEventListener('load', function() {
      console.log('Window loaded, initializing map...');
      initMap();
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
          Edit Geo Location
        </Text>
      </View>

      <View className="items-center justify-center mt-[-5%]">
        <Text className="text-[#828282]">Tap on the map to select a location.</Text>
      </View>

      {/* WebView Map */}
      <View style={{ flex: 1, marginTop: hp(2), marginHorizontal: wp(4), borderRadius: 12, overflow: 'hidden' }}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadStart={() => {
            console.log('🌐 WebView loading started...');
            setWebViewLoaded(false);
            setIsWebViewReady(false);
            setIsMapReady(false);
            setInitialLocationSent(false);
          }}
          onLoadEnd={() => {
            console.log('✅ WebView loaded successfully');
            setWebViewLoaded(true);
          }}
          onLoadProgress={({ nativeEvent }) => {
            console.log(`📊 WebView loading progress: ${Math.round(nativeEvent.progress * 100)}%`);
          }}
          onError={(error) => {
            console.error('❌ WebView error:', error);
            Alert.alert("Map Error", "Failed to load map. Please check your internet connection.");
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith('https://www.openstreetmap.org/')) {
              Linking.openURL(request.url);
              return false;
            }
            return true;
          }}
          originWhitelist={['*']}
          mixedContentMode="always"
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={{ marginTop: 10, color: '#666' }}>Loading map...</Text>
              <Text style={{ marginTop: 5, color: '#888', fontSize: 12 }}>
                {!isMapReady ? "Initializing..." : "Ready!"}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Bottom Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 flex-row justify-between">
        {/* Use My Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={isLoading || isAttaching || !isMapReady}
          className="flex-1 mr-2"
        >
          <View className={`border border-[#6C3CD1] rounded-full py-3 px-4 flex-row items-center justify-center ${(isLoading || isAttaching || !isMapReady) ? 'opacity-50' : ''}`}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#6C3CD1" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#6C3CD1" />
                <Text className="text-[#6C3CD1] font-semibold ml-2 text-sm">
                  {!isMapReady ? 'Map Loading...' : 'Use My Location'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Update Location Button */}
        <TouchableOpacity
          onPress={handleConfirmLocation}
          disabled={isAttaching}
          className="flex-1 ml-2"
        >
          <View className={`bg-[#874DDB] rounded-full py-3 px-4 flex-row items-center justify-center shadow-md ${isAttaching ? 'opacity-50' : ''}`}>
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-sm">
              Update Location
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
              Updating your geo location..
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttachGeoLocationScreenEdit;