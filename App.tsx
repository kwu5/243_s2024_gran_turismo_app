import { BleManager, Device, Characteristic } from "react-native-ble-plx";
import { Alert, Button } from "react-native";
import { PermissionsAndroid, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image } from "react-native";

import React, { useEffect, useState } from "react";

export const manager = new BleManager();
type PermissionStatus = "granted" | "denied" | "never_ask_again";

const requestBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS === "ios") {
    console.log("ios platform detected");
    return true;
  }

  if (
    Platform.OS === "android" &&
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  ) {
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    if (apiLevel < 31) {
      const granted: PermissionStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    ) {
      const result: Record<string, PermissionStatus> =
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

      return (
        result["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }

  showErrorToast("Permission have not been granted");

  return false;
};

const showErrorToast = (message: string) => {
  Alert.alert(
    "Error",
    message,
    [{ text: "OK", onPress: () => console.log("OK Pressed") }],
    { cancelable: false }
  );
};

function scanAndConnect() {
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error("ScanAndConnect failed: ", error);
      return;
    }

    //TODO:
    if (
      device &&
      (device.name === "TI BLE Sensor Tag" || device.name === "SensorTag")
    ) {
      manager.stopDeviceScan();

      // Proceed with connection.
      console.log("Device found: ", device.name);
      readDataFromBLE(device);
    }
  });
}

async function readDataFromBLE(device: Device): Promise<void> {
  let connectedDevice: Device | null = null;

  try {
    connectedDevice = await device.connect();
    console.log("Connected... Discovering services and characteristics");

    await connectedDevice.discoverAllServicesAndCharacteristics();
    console.log("Service and Characterisics found");
    const services = await connectedDevice.services();
    const characteristics = await services[0].characteristics();
    const characteristic = await manager.readCharacteristicForDevice(
      connectedDevice.id,
      services[0].uuid,
      characteristics[0].uuid
    );
    // console.log("Reading characteristic" + characteristic);
    console.log("Reading characteristic value" + characteristic.value);
  } catch (error) {
    console.error("Connect and read data fail", error);
  }
}

export default function App() {
  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log(
        "Android detected, requestBluetoothPermission is " + [result]
      );
      if (result) {
        console.log("Scanning for devices");
        scanAndConnect();
      }
    });
  }, []);

  return (
    <>
      {/* <View style={styles.container}>
        <Text>Bluetooh building: Hello world</Text>
      </View> */}
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <Image
            style={styles.map}
            source={require("./assets/images/dummy.png")}
          />
          <Button title="Start" onPress={() => alert("Your press START")} />
          <Button title="Stop" onPress={() => alert("You press STOP")} />
        </View>

        <StatusBar style="auto" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginVertical: 10,
    marginHorizontal: 10,
  },
});
