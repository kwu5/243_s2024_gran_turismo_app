import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  isPressed?: boolean;
}

export default function Button({ title, onPress, isPressed }: ButtonProps) {
  return (
    <View
      style={[
        styles.buttonContainer,
        { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, isPressed && styles.buttonPressed]}
        onPress={onPress}
      >
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
  buttonPressed: {
    backgroundColor: "lightyellow",
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#ff00ff",
    fontSize: 16,
  },
});
