import React from "react";
import { View } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const DashboardSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-100 px-4 py-6">
      {/* Header Skeleton */}
      <ContentLoader
        speed={1.5}
        width="100%"
        height={120}
        backgroundColor="#e0e0e0"
        foregroundColor="#f5f5f5"
      >
        {/* Profile Image */}
        <Circle cx="30" cy="40" r="30" />
        {/* Welcome Text */}
        <Rect x="70" y="25" rx="4" ry="4" width="150" height="10" />
        <Rect x="70" y="45" rx="4" ry="4" width="100" height="10" />
        {/* Star Count */}
        <Rect x="280" y="35" rx="10" ry="10" width="80" height="30" />
      </ContentLoader>

      {/* Progress Bar Skeleton */}
      <ContentLoader
        speed={1.5}
        width="100%"
        height={40}
        backgroundColor="#e0e0e0"
        foregroundColor="#f5f5f5"
        className="mt-4"
      >
        <Rect x="0" y="10" rx="5" ry="5" width="100%" height="20" />
        <Circle cx="95%" cy="20" r="12" />
      </ContentLoader>

      {/* Packages Section Title */}
      <ContentLoader
        speed={1.5}
        width="100%"
        height={30}
        backgroundColor="#e0e0e0"
        foregroundColor="#f5f5f5"
        className="mt-10"
      >
        <Rect x="0" y="5" rx="4" ry="4" width="150" height="20" />
      </ContentLoader>

      {/* Packages Skeleton */}
      <ContentLoader
        speed={1.5}
        width="100%"
        height={700}
        backgroundColor="#e0e0e0"
        foregroundColor="#f5f5f5"
        className="mt-[40%]" 
      >
        {/* First Row */}
        <Rect x="0" y="30" rx="10" ry="10" width="45%" height="120" />
        <Rect x="55%" y="10" rx="10" ry="10" width="45%" height="120" />

        {/* Second Row */}
        <Rect x="0" y="25" rx="10" ry="10" width="45%" height="120" />
        <Rect x="55%" y="150" rx="10" ry="10" width="45%" height="120" />
      </ContentLoader>
    </View>
  );
};

export default DashboardSkeleton;
