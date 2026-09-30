import React, { useCallback } from "react";
import { View, BackHandler } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RootStackParamList } from "../types/types";
import CustomHeader from "../common/CustomHeader";
import OpenStreetMap from "../common/OpenStreetMap"; // adjust import path if OpenStreetMap.tsx lives elsewhere

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
  const { latitude, longitude, locationName } = route.params;

  const lat = latitude || 7.2008;
  const lng = longitude || 79.8358;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Attach Geo Location"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />
      <View
        style={{
          flex: 1,
          marginTop: hp(2),
          marginHorizontal: wp(4),
          marginBottom: hp(2),
        }}
      >
        <View style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}>
          <OpenStreetMap
            latitude={lat}
            longitude={lng}
            zoom={13}
            interactive={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pinColor="#7C3AED"
            markers={[
              {
                latitude: lat,
                longitude: lng,
                title: locationName || "Selected Location",
                description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
                color: "#7C3AED",
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default ViewLocationScreen;