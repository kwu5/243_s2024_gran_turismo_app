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

const bluetoothManager = new BleManager();
// let deviceReference = null;
// let characteristicReference = null;

// async function readCharacteristic() {}

// export async function readDataFromBLE(device: Device): Promise<void> {
//   let connectedDevice: Device | null = null;

//     // Subscribe to notifications on the characteristic
//     customCharacteristic.monitor((error, characteristic) => {
//       if (error) {
//         console.error("Error during notification setup:", error);
//         return;
//       }
//       if (characteristic?.value) {
//         const decodedData = base64.decode(characteristic.value);
//         // console.log("Received Notification with Decoded Data:", decodedData);
//       }
//     });

// }

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);

  // useEffect(() => {
  //   return () => bluetoothManager.destroy();
  // }, []);

  // useEffect(() => {
  //   requestBluetoothPermission().then((result) => {
  //     console.log(
  //       "Android detected, requestBluetoothPermission is " + [result]
  //     );
  //     if (result) {
  //       console.log("Scanning for devices");
  //       scanAndConnect();
  //     }
  //   });
  // }, []);

  // const requestBluetoothPermission = async (): Promise<boolean> => {
  //   if (Platform.OS === "ios") {
  //     console.log("ios platform detected");
  //     return true;
  //   }

  //   if (
  //     Platform.OS === "android" &&
  //     PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //   ) {
  //     const apiLevel = parseInt(Platform.Version.toString(), 10);

  //     if (apiLevel < 31) {
  //       const granted: PermissionStatus = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //       );
  //       return granted === PermissionsAndroid.RESULTS.GRANTED;
  //     }

  //     if (
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
  //     ) {
  //       const result: Record<string, PermissionStatus> =
  //         await PermissionsAndroid.requestMultiple([
  //           PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //         ]);

  //       return (
  //         result["android.permission.BLUETOOTH_CONNECT"] ===
  //           PermissionsAndroid.RESULTS.GRANTED &&
  //         result["android.permission.BLUETOOTH_SCAN"] ===
  //           PermissionsAndroid.RESULTS.GRANTED &&
  //         result["android.permission.ACCESS_FINE_LOCATION"] ===
  //           PermissionsAndroid.RESULTS.GRANTED
  //       );
  //     }
  //   }

  //   ErrorToast("Permission have not been granted");

  //   return false;
  // };

  // function scanAndConnect() {
  //   // setIsScanning(true);
  //   bluetoothManager.startDeviceScan(null, null, (error, device) => {
  //     if (error) {
  //       console.error("ScanAndConnect failed: ", error);
  //       // setIsScanning(false);
  //       return;
  //     }

  //   if (device) {
  //     setDevices((prevDevices) => {
  //       const deviceExists = prevDevices.some(
  //         (item: Device) => item.id === device.id && item.name === device.name
  //       );
  //       return deviceExists ? prevDevices : [...prevDevices, device];
  //     });
  //   }

  //     if (
  //       device &&
  //       (device.name === "DSD TECH" ||
  //         device.id === "68:5E:1C:4C:36:F6DSD TECH")
  //     ) {
  //       bluetoothManager.stopDeviceScan();

  //       // Proceed with connection.
  //       console.log("Device found: ", device.name);
  //       initBluetooth(device);
  //     }
  //   });
  // }

  // async function initBluetooth(device: Device) {
  //   try {
  //     const connectedDevice = await device.connect();
  //     await connectedDevice.discoverAllServicesAndCharacteristics();
  //     deviceReference = connectedDevice;
  //     const services = await connectedDevice.services();

  //     for (const service of services) {
  //       console.log(`Service: ${service.uuid}`);
  //       const characteristics = await service.characteristics();
  //       for (const characteristic of characteristics) {
  //         console.log(`  Characteristic: ${characteristic.uuid}`);
  //       }
  //     }

  //     const customService = services.find(
  //       (s) => s.uuid === "0000ffe0-0000-1000-8000-00805f9b34fb"
  //     );
  //     if (!customService) {
  //       console.error("Custom Service (FFE0) not found.");
  //       return false;
  //     }
  //     const characteristics = await customService.characteristics();
  //     characteristicReference = characteristics.find(
  //       (c) => c.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb"
  //     );

  //     if (!characteristicReference) {
  //       console.error("Custom Characteristic (FFE1) not found.");
  //       return false;
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error("initBluetooth fail", error);
  //     return false;
  //   }
  // }

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
          <Image
            style={styles.map}
            source={require("./assets/images/dummy.png")}
          />
        </View>
        <Bluetooth
          deviceName={"DSD TECH"}
          deviceId={"68:5E:1C:4C:36:F6DSD TECH"}
          serviceUUID={"0000ffe0-0000-1000-8000-00805f9b34fb"}
          characteristicUUID={"0000ffe1-0000-1000-8000-00805f9b34fb"}
        />

        <StatusBar style="auto" />
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
    alignItems: "center",
    justifyContent: "center",
  },

  mapContainer: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    height: "30%",
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
