import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image, FlatList } from "react-native";
import { Device } from "react-native-ble-plx";
import React, { useEffect, useState } from "react";

import Button from "./components/Button";
import { BleManager, Characteristic } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import base64 from "react-native-base64";
import ErrorToast from "./components/ErrorToast";
import Bluetooth from "./components/Bluetooth";
import GoogleMap, { getInitialState } from "./components/googleMap";
import { Region } from "react-native-maps";
import DataDisplayView from "./components/DataDisplayView";

const bluetoothManager = new BleManager();

export default function App() {
  const [region, setRegion] = useState<Region>(getInitialState().region);
  const [currentLocation, setCurrentLocation] = useState<Region>(
    getInitialState().region
  );

  const renderItem = ({ item }: { item: Device }) => (
    <Text>
      {item.name || "Unnamed device"} ({[item.id, item.name]})
    </Text>
  );

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <GoogleMap region={region} setRegion={setRegion} />
        </View>

        <DataDisplayView region={region} currentLocation={currentLocation} />

        <Bluetooth
          deviceName={"DSD TECH"}
          deviceId={"68:5E:1C:4C:36:F6DSD TECH"}
          serviceUUID={"0000ffe0-0000-1000-8000-00805f9b34fb"}
          characteristicUUID={"0000ffe1-0000-1000-8000-00805f9b34fb"}
          region={region}
          setRegion={setRegion}
          currentLocation={currentLocation}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    // alignItems: "center",
    justifyContent: "center",
  },

  mapContainer: {
    width: "100%",
    flex: 1,
    // backgroundColor: "#808080",
    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",
  },

  zoomButtons: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    marginHorizontal: 10,
  },
});
