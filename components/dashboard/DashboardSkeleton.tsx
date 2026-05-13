import React from "react";
import { View } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const DashboardSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Header Section Skeleton */}
      <View
        className="bg-white px-4"
        style={{
          paddingTop: 50,
          paddingBottom: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <ContentLoader
              speed={1.5}
              width={60}
              height={60}
              viewBox="0 0 60 60"
              backgroundColor="#e0e0e0"
              foregroundColor="#f5f5f5"
            >
              <Circle cx="28" cy="28" r="24" />
            </ContentLoader>
            <ContentLoader
              speed={1.5}
              width={120}
              height={30}
              viewBox="0 0 120 30"
              backgroundColor="#e0e0e0"
              foregroundColor="#f5f5f5"
            >
              <Rect x="0" y="8" rx="4" ry="4" width="100" height="16" />
            </ContentLoader>
          </View>

          <ContentLoader
            speed={1.5}
            width={100}
            height={50}
            viewBox="0 0 100 50"
            backgroundColor="#e0e0e0"
            foregroundColor="#f5f5f5"
          >
            <Rect x="5" y="8" rx="25" ry="25" width="80" height="35" />
          </ContentLoader>
        </View>

        {/* Daily Target Skeleton */}
        <View style={{ marginTop: 24 }}>
          <ContentLoader
            speed={1.5}
            width={150}
            height={25}
            viewBox="0 0 150 25"
            backgroundColor="#e0e0e0"
            foregroundColor="#f5f5f5"
          >
            <Rect x="0" y="5" rx="4" ry="4" width="130" height="16" />
          </ContentLoader>

          <View
            className="bg-[#f5f5f5] rounded-2xl overflow-hidden"
            style={{
              marginTop: 12,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <ContentLoader
              speed={1.5}
              width="100%"
              height={60}
              backgroundColor="#e0e0e0"
              foregroundColor="#f5f5f5"
            >
              <Rect x="42%" y="5" rx="4" ry="4" width="50" height="14" />
              <Rect x="20" y="28" rx="6" ry="6" width="65%" height="12" />
              <Circle cx="85%" cy="28" r="18" />
            </ContentLoader>
          </View>
        </View>
      </View>

      {/* Packages Section Skeleton */}
      <View className="flex-1 px-4 pt-6">
        <ContentLoader
          speed={1.5}
          width={120}
          height={30}
          viewBox="0 0 120 30"
          backgroundColor="#e0e0e0"
          foregroundColor="#f5f5f5"
        >
          <Rect x="0" y="5" rx="4" ry="4" width="100" height="18" />
        </ContentLoader>

        {/* Packages Grid Skeleton - 3 rows of 2 columns */}
        <View className="mt-2 flex-row flex-wrap justify-between">
          {[...Array(6)].map((_, index) => (
            <View
              key={index}
              className="bg-white rounded-2xl border-[#E0E0E0] border-[1px]"
              style={{
                padding: 16,
                marginBottom: 20,
                marginHorizontal: 8,
                width: "44%",
                minHeight: 230,
              }}
            >
              <ContentLoader
                speed={1.5}
                width="100%"
                height={220}
                backgroundColor="#e0e0e0"
                foregroundColor="#f5f5f5"
              >
                {/* Package Image */}
                <Rect x="10%" y="10" rx="8" ry="8" width="80%" height="100" />
                
                {/* Package Name */}
                <Rect x="15%" y="125" rx="4" ry="4" width="70%" height="16" />
                
                {/* Package Price */}
                <Rect x="25%" y="150" rx="4" ry="4" width="50%" height="14" />
                
                {/* View Button */}
                <Rect x="25%" y="175" rx="25" ry="25" width="50%" height="36" />
              </ContentLoader>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default DashboardSkeleton;