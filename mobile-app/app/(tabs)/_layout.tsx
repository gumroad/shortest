import { Tabs } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  Platform,
  View,
  findNodeHandle,
  UIManager,
  Dimensions,
} from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const homeButtonRef = useRef(null);
  const exploreButtonRef = useRef(null);

  const logButtonMeasurements = (ref, buttonName) => {
    if (!ref.current) return;

    const handle = findNodeHandle(ref.current);

    UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
      console.log(`${buttonName} button layout relative to viewport:`, {
        x: pageX, // X position relative to the screen
        y: pageY, // Y position relative to the screen
        width, // Button width
        height, // Button height
      });
    });
  };

  useEffect(() => {
    // Delay to ensure layout is complete
    setTimeout(() => {
      logButtonMeasurements(homeButtonRef, "Home");
      logButtonMeasurements(exploreButtonRef, "Explore");
    }, 100); // Adjust delay if needed
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <View ref={homeButtonRef}>
              <IconSymbol size={28} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <View ref={exploreButtonRef}>
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
