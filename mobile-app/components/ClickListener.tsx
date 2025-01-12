import React, { PropsWithChildren } from "react";
import { StyleSheet, GestureResponderEvent, View } from "react-native";

interface ScreenClick {
  id: number;
  x: number;
  y: number;
}

export default function ClickListener({
  children,
}: PropsWithChildren): JSX.Element {
  const [clicks, setClicks] = React.useState<ScreenClick[]>([]);

  const handlePress = async (e: GestureResponderEvent): Promise<void> => {
    const pos = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };

    if (e.target !== e.currentTarget) {
      const offset = await new Promise<{
        left: number;
        top: number;
      }>((resolve, reject) => {
        e.target.measureLayout(
          e.currentTarget,
          (left, top) => resolve({ left, top }),
          reject
        );
      });

      pos.x += offset.left;
      pos.y += offset.top;
    }

    console.log(`Clicked at x: ${pos.x}, y: ${pos.y}`);

    setClicks((prevClicks) => {
      const newClicks = [...prevClicks, { id: Date.now(), x: pos.x, y: pos.y }];
      if (newClicks.length > 3) {
        newClicks.shift();
      }
      return newClicks;
    });
  };

  return (
    <View
      style={styles.container}
      onTouchStart={async (e) => await handlePress(e)}
    >
      {clicks.map((click) => (
        <ClickIndicator key={click.id} x={click.x} y={click.y} />
      ))}
      {children}
    </View>
  );
}

interface ClickIndicatorProps {
  x: number;
  y: number;
}

function ClickIndicator({ x, y }: ClickIndicatorProps): JSX.Element {
  return (
    <View
      style={[
        styles.indicator,
        {
          left: x - 10,
          top: y - 10,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicator: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "green",
    borderRadius: 10,
    zIndex: 1000,
  },
});
