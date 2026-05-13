import React from "react";
import { View, FlatList } from "react-native";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";

const CustomersScreenSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 mx-auto w-full max-w-[500px]">
        {/* Skeleton for Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-6 py-0 rounded-full mt-[-22px] mx-6 shadow-md h-12">
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

        {/* Customer List Skeleton */}
        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 30 }}
          renderItem={() => (
            <View
              className="mx-6 bg-white shadow-md p-4 mb-3 border border-gray-100"
              style={{
                borderRadius: 20,
                elevation: 3,
              }}
            >
              <ContentLoader
                speed={1.5}
                width="100%"
                height={50}
                backgroundColor="#e0e0e0"
                foregroundColor="#f5f5f5"
              >
                {/* Name placeholder */}
                <Rect x="0" y="5" rx="4" ry="4" width="60%" height="16" />

                {/* Phone placeholder */}
                <Rect x="0" y="30" rx="4" ry="4" width="40%" height="12" />

                {/* Order count placeholder */}
                <Rect x="90%" y="15" rx="4" ry="4" width="10%" height="18" />
              </ContentLoader>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default CustomersScreenSkeleton;
