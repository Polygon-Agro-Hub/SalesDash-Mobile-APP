import React from "react";
import { FlatList, View, Dimensions } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const OrderScreenSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 mx-auto w-full max-w-[500px]">
        {/* Skeleton for Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-4 h-[50px] border border-[#6B3BCF] rounded-full mt-[-6%] shadow-sm mx-6">
          <ContentLoader
            speed={1.5}
            width="100%"
            height={40}
            backgroundColor="#e0e0e0"
            foregroundColor="#f5f5f5"
          >
            <Rect x="0" y="10" rx="20" ry="20" width="80%" height="20" />
            <Circle cx="95%" cy="20" r="12" />
          </ContentLoader>
        </View>

        {/* Skeleton for Filter Tabs */}
        <View className="flex-row items-center px-4 my-4">
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              className="mr-3 bg-gray-100 rounded-full"
              style={{ width: 80, height: 32 }}
            >
              <ContentLoader
                speed={1.5}
                width={80}
                height={32}
                backgroundColor="#e0e0e0"
                foregroundColor="#f5f5f5"
              >
                <Rect x="10" y="8" rx="10" ry="10" width="60" height="16" />
              </ContentLoader>
            </View>
          ))}
        </View>

        {/* Skeleton for Order Cards */}
        <FlatList
          data={[...Array(6)]}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View
              className="mx-6 bg-white shadow-md p-4 mb-4 border border-gray-200"
              style={{
                borderRadius: 12,
                elevation: 4,
              }}
            >
              <ContentLoader
                speed={1.5}
                width="100%"
                height={100}
                backgroundColor="#e0e0e0"
                foregroundColor="#f5f5f5"
              >
                {/* Skeleton for Order Number */}
                <Rect x="0" y="0" rx="4" ry="4" width="45%" height="18" />
                
                {/* Skeleton for Status Badge */}
                <Rect x="75%" y="0" rx="15" ry="15" width="25%" height="24" />
                
                {/* Skeleton for Schedule */}
                <Rect x="0" y="35" rx="4" ry="4" width="60%" height="14" />
                
                {/* Skeleton for Time & Other Status */}
                <Rect x="0" y="65" rx="4" ry="4" width="30%" height="12" />
                <Rect x="80%" y="65" rx="4" ry="4" width="20%" height="12" />
              </ContentLoader>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </View>
  );
};

export default OrderScreenSkeleton;
