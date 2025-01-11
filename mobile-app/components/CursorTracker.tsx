import React, { useState } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";

export default function CursorTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      setPosition({
        x: gestureState.moveX,
        y: gestureState.moveY,
      });
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.infoText}>
        X: {Math.round(position.x)}, Y: {Math.round(position.y)}
      </Text>
      <View
        style={[
          styles.cursor,
          {
            left: position.x - 15, // Adjust to center the cursor
            top: position.y - 15,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    position: "fixed",
  },
  infoText: {
    position: "fixed",
    top: 50,
    left: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cursor: {
    position: "absolute",
    width: 30,
    height: 30,
    backgroundColor: "red",
    borderRadius: 15,
    zIndex: 99999,
  },
});
