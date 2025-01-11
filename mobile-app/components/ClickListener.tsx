import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Pressable,
  GestureResponderEvent,
  Animated,
  PixelRatio,
} from "react-native";

interface ClickPosition {
  id: number;
  x: number;
  y: number;
}

export default function ClickListener(): JSX.Element {
  const pixelRatio = PixelRatio.get();
  console.log({ pixelRatio });
  const [clicks, setClicks] = useState<ClickPosition[]>([]);

  const handlePress = (event: GestureResponderEvent): void => {
    const { locationX, locationY } = event.nativeEvent;

    setClicks((prevClicks) => [
      ...prevClicks,
      { id: Date.now(), x: locationX, y: locationY },
    ]);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {clicks.map((click) => (
        <ClickIndicator key={click.id} x={click.x} y={click.y} />
      ))}
    </Pressable>
  );
}

interface ClickIndicatorProps {
  x: number;
  y: number;
}

function ClickIndicator({ x, y }: ClickIndicatorProps): JSX.Element {
  const animation = new Animated.Value(1);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [animation]);

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          left: x - 10, // center the circle
          top: y - 10,
          opacity: animation,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "green",
    position: "sticky",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    height: 1000,
  },
  indicator: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "red",
    borderRadius: 10,
    zIndex: 1000,
  },
});
