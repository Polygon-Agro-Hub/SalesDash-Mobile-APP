import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export interface MapMarker {
    id?: string | number;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    color?: string;
}

export interface OpenStreetMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    interactive?: boolean;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    markers?: MapMarker[];
    pinColor?: string;
    onLocationSelect?: (coord: { latitude: number; longitude: number }) => void;
    style?: StyleProp<ViewStyle>;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
    latitude,
    longitude,
    zoom = 15,
    interactive = true,
    scrollEnabled = true,
    zoomEnabled = true,
    markers,
    pinColor = "#FF8A00",
    onLocationSelect,
    style,
}) => {
    const webViewRef = useRef<WebView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Build the initial HTML with Leaflet and OpenStreetMap
    const htmlContent = useMemo(() => {
        const markerList = markers && markers.length > 0
            ? markers
            : [{ latitude, longitude, color: pinColor }];

        const markersJson = JSON.stringify(markerList);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <style>
        html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #F8FAFC;
        }
        .leaflet-control-attribution {
            font-size: 8px !important;
            opacity: 0.7;
        }
        .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .custom-pin svg {
            filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map;
        var activeMarkers = [];
        var isInteractive = ${interactive};
        var currentPinColor = "${pinColor}";

        function createPinIcon(color) {
            var svgHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 24 24" fill="' + (color || '#FF8A00') + '" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle></svg>';
            return L.divIcon({
                className: 'custom-pin',
                html: svgHtml,
                iconSize: [34, 42],
                iconAnchor: [17, 42],
                popupAnchor: [0, -38]
            });
        }

        function initMap() {
            try {
                map = L.map('map', {
                    center: [${latitude}, ${longitude}],
                    zoom: ${zoom},
                    zoomControl: ${zoomEnabled && interactive},
                    dragging: ${scrollEnabled && interactive},
                    touchZoom: ${zoomEnabled && interactive},
                    doubleClickZoom: ${zoomEnabled && interactive},
                    scrollWheelZoom: ${scrollEnabled && interactive},
                    boxZoom: false,
                    keyboard: false
                });

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                var initialMarkers = ${markersJson};
                setMarkers(initialMarkers);

                if (isInteractive) {
                    map.on('click', function(e) {
                        var lat = e.latlng.lat;
                        var lng = e.latlng.lng;
                        
                        // Update single pin
                        clearMarkers();
                        var newMarker = L.marker([lat, lng], { icon: createPinIcon(currentPinColor) }).addTo(map);
                        activeMarkers.push(newMarker);

                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'onLocationSelect',
                                latitude: lat,
                                longitude: lng
                            }));
                        }
                    });
                }

                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onMapReady' }));
                }
            } catch (err) {
                console.error("Map init error:", err);
            }
        }

        function clearMarkers() {
            for (var i = 0; i < activeMarkers.length; i++) {
                map.removeLayer(activeMarkers[i]);
            }
            activeMarkers = [];
        }

        function setMarkers(markerData) {
            clearMarkers();
            if (!markerData || !markerData.length) return;

            for (var i = 0; i < markerData.length; i++) {
                var m = markerData[i];
                var marker = L.marker([m.latitude, m.longitude], {
                    icon: createPinIcon(m.color || currentPinColor)
                }).addTo(map);

                if (m.title || m.description) {
                    var popupText = '<b>' + (m.title || '') + '</b>';
                    if (m.description) {
                        popupText += '<br/><span style="font-size:12px;color:#555;">' + m.description + '</span>';
                    }
                    marker.bindPopup(popupText);
                }
                activeMarkers.push(marker);
            }
        }

        function updateLocation(lat, lng, zoomLevel, pinCol) {
            if (!map) return;
            if (pinCol) currentPinColor = pinCol;
            map.flyTo([lat, lng], zoomLevel || map.getZoom(), {
                animate: true,
                duration: 0.8
            });

            clearMarkers();
            var newMarker = L.marker([lat, lng], { icon: createPinIcon(currentPinColor) }).addTo(map);
            activeMarkers.push(newMarker);
        }

        document.addEventListener("DOMContentLoaded", initMap);
    </script>
</body>
</html>
        `;
    }, []);

    // Dynamically update view & markers when latitude/longitude props change without reloading WebView
    useEffect(() => {
        if (!isMapReady || !webViewRef.current) return;

        if (markers && markers.length > 0) {
            const markersJs = `if (typeof setMarkers === 'function') { setMarkers(${JSON.stringify(markers)}); } true;`;
            webViewRef.current.injectJavaScript(markersJs);
        } else if (latitude && longitude) {
            const script = `if (typeof updateLocation === 'function') { updateLocation(${latitude}, ${longitude}, ${zoom}, "${pinColor}"); } true;`;
            webViewRef.current.injectJavaScript(script);
        }
    }, [latitude, longitude, zoom, markers, pinColor, isMapReady]);

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "onMapReady") {
                setIsMapReady(true);
            } else if (data.type === "onLocationSelect" && onLocationSelect) {
                onLocationSelect({
                    latitude: data.latitude,
                    longitude: data.longitude,
                });
            }
        } catch (e) {
            console.warn("OpenStreetMap message parse error:", e);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                scrollEnabled={false}
                overScrollMode="never"
                onMessage={handleMessage}
                nestedScrollEnabled={false}
            />
            {!isMapReady && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={pinColor} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        backgroundColor: "#E2E8F0",
        overflow: "hidden",
    },
    webview: {
        flex: 1,
        backgroundColor: "transparent",
    },
    loaderContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default OpenStreetMap;
