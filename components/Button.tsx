import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export default function Button({ title, onPress }: ButtonProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  return (
    <View
      style={[
        styles.buttonContainer,
        { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 },
      ]}
    >
      <TouchableOpacity style={styles.button} onPress={onPress}>
        {/* <TouchableOpacity
        style={[styles.button, isHighlighted && styles.highlighted]}
        onPressIn={() => setIsHighlighted(true)}
        onPressOut={() => setIsHighlighted(false)}
        onPress={onPress}
      > */}
        <Text style={styles.buttonLabel}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    backgroundColor: "#fff",
  },
  button: {
    borderRadius: 10,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  highlighted: {
    backgroundColor: "#007BFF", // Highlight color
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#ff00ff",
    fontSize: 16,
  },
});
