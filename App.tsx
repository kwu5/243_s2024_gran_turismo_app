import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import Button from "./components/Button";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <Image
          style={styles.map}
          source={require("./assets/images/dummy.png")}
        />
      </View>
      <Button title="Start" onPress={() => alert("Your press START")} />
      <Button title="Stop" onPress={() => alert("You press STOP")} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },

  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "50%",
  },
  map: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
  zoomButtons: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
});
