import React, { useEffect } from "react";
import { View, Animated, StatusBar } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

interface SidebarSkeletonProps {
  showHeader?: boolean;
}

const SidebarSkeleton: React.FC<SidebarSkeletonProps> = ({
  showHeader = true,
}) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const shimmerStyle = {
    backgroundColor: "#E0E0E0",
    opacity,
  };

  return (
    <View className="flex-1 bg-white">
      <View className="p-5">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Profile Section Skeleton */}
        <View className="flex-row items-center mb-5">
          <Animated.View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              ...shimmerStyle,
            }}
          />
          <View style={{ marginLeft: wp(4), flex: 1 }}>
            <Animated.View
              style={{
                width: "60%",
                height: 20,
                borderRadius: 4,
                marginBottom: 8,
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: "40%",
                height: 16,
                borderRadius: 4,
                ...shimmerStyle,
              }}
            />
          </View>
        </View>

        <View className="border-b border-gray-200 my-1" />

        {/* Menu Items Skeleton */}
        <View style={{ marginTop: hp(2) }}>
          {/* Profile Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                marginRight: wp(4),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: hp(2.5),
                height: hp(2.5),
                borderRadius: hp(0.5),
                marginRight: wp(2),
                ...shimmerStyle,
              }}
            />
          </View>

          {/* Complaints Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                marginRight: wp(4),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: hp(2.5),
                height: hp(2.5),
                borderRadius: hp(0.5),
                marginRight: wp(2),
                ...shimmerStyle,
              }}
            />
          </View>

          {/* Change Password Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                marginRight: wp(4),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: hp(2.5),
                height: hp(2.5),
                borderRadius: hp(0.5),
                marginRight: wp(2),
                ...shimmerStyle,
              }}
            />
          </View>

          {/* Privacy Policy Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                marginRight: wp(4),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: hp(2.5),
                height: hp(2.5),
                borderRadius: hp(0.5),
                marginRight: wp(2),
                ...shimmerStyle,
              }}
            />
          </View>

          {/* Terms & Conditions Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                flex: 1,
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                marginRight: wp(4),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: hp(2.5),
                height: hp(2.5),
                borderRadius: hp(0.5),
                marginRight: wp(2),
                ...shimmerStyle,
              }}
            />
          </View>

          <View className="border-b border-gray-200 my-5" />

          {/* Logout Menu Item */}
          <View className="flex-row items-center py-4">
            <Animated.View
              style={{
                width: hp(5),
                height: hp(5),
                borderRadius: hp(2.5),
                ...shimmerStyle,
              }}
            />
            <Animated.View
              style={{
                width: wp(20),
                height: 16,
                borderRadius: 4,
                marginLeft: wp(4),
                ...shimmerStyle,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default SidebarSkeleton;
