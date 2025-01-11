import React from "react";
import { View, StyleSheet } from "react-native";

const Overlay = () => {
  return (
    <View style={styles.overlay}>
      {/* The overlay content, you can adjust its look and feel as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: -1,
  },
});

export default Overlay;
