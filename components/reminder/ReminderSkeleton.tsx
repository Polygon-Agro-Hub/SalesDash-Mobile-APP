import React from "react";
import { View, FlatList, Dimensions } from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReminderScreenSkeleton = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 mx-auto w-full max-w-[500px] mt-4">
        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View
              className="mx-6 bg-white shadow-md p-4 mb-3 border border-gray-100"
              style={{
                borderRadius: 12,
                elevation: 3,
              }}
            >
              <ContentLoader
                speed={1.5}
                width="100%"
                height={60}
                backgroundColor="#e0e0e0"
                foregroundColor="#f5f5f5"
              >
                {/* Skeleton for Left Icon */}
                <Rect x="0" y="7" rx="8" ry="8" width="45" height="45" />
                
                {/* Skeleton for Title */}
                <Rect x="65" y="7" rx="4" ry="4" width="60%" height="16" />
                
                {/* Skeleton for Order Number */}
                <Rect x="65" y="30" rx="4" ry="4" width="40%" height="12" />
                
                {/* Skeleton for Customer ID */}
                <Rect x="65" y="48" rx="4" ry="4" width="50%" height="12" />
                
                {/* Skeleton for More Options Icon */}
                <Rect x="95%" y="15" rx="2" ry="2" width="4" height="24" />
              </ContentLoader>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
    </View>
  );
};

export default ReminderScreenSkeleton;
