import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";

import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import base64 from "react-native-base64";

import GoogleMap, { getInitialRegion } from "./components/googleMap";
import { Region } from "react-native-maps";
import DataDisplayView from "./components/DataDisplayView";
import ErrorToast from "./components/ErrorToast";

let characteristicReference: Characteristic | undefined = undefined;
let notificationSubscription: Subscription | null = null;

type PermissionStatus = "granted" | "denied" | "never_ask_again";

const requestBluetoothPermission = async () => {
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
  ErrorToast("BLE Permission have not been granted");
  return false;
};

const initBluetooth = async (
  bluetoothManager: BleManager,
  deviceName: string | null,
  deviceId: string | null,
  serviceUUID: string | null,
  characteristicUUID: string | null
) => {
  bluetoothManager.startDeviceScan(null, null, async (error, device) => {
    if (error) {
      console.error("ScanAndConnect failed: ", error);
      return false;
    }

    if (device && (device.name == deviceName || device.id == deviceId)) {
      bluetoothManager.stopDeviceScan();
      console.log(`Device found: ${device.name}, id: ${device.id}`);

      initBLEConnection(
        device,
        serviceUUID ? serviceUUID : "",
        characteristicUUID ? characteristicUUID : ""
      );
    }
    return false;
  });
};

async function initBLEConnection(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string
): Promise<Characteristic | undefined> {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await connectedDevice.services();

    const customService = services.find((s) => s.uuid === serviceUUID);
    if (!customService) {
      console.error("Custom service: (FFE0) not found");
      return undefined;
    }

    const customCharacteristic = await customService.characteristics();
    const characteristic = customCharacteristic.find(
      (c) => c.uuid === characteristicUUID
    );
    if (!characteristic) {
      console.error("Custom characteristic: (FFE1) not found");
      return undefined;
    } else {
      return characteristic;
    }
  } catch (error) {
    console.error("Error in initBLEConnection: ", error);
    return undefined;
  }
}

async function readBLECharacteristic(): Promise<string | null> {
  if (characteristicReference == null) {
    return null;
  }

  return new Promise((resolve, reject) => {
    if (characteristicReference) {
      notificationSubscription = characteristicReference.monitor(
        (error, characteristic) => {
          if (error) {
            console.error(
              "readBLECharacteristic: Error during notification setup:",
              error
            );
            reject(error);
          }
          if (characteristic?.value) {
            const decodedData = base64.decode(characteristic.value);
            // console.log("Received Decoded Data:", decodedData);

            resolve(decodedData);
          }
        }
      );
    }
  });
}

async function writeBLECharacteristic(data: string): Promise<void> {
  if (characteristicReference == null) {
    console.error("Characteristic reference is not provided.");
    return;
  }

  if (!characteristicReference.isWritableWithoutResponse) {
    console.error(
      "This characteristic does not support write without response."
    );
    return;
  }

  if (!characteristicReference) {
    console.log("No characteristic reference available.");
    return;
  }

  try {
    const encodedData = base64.encode(data);

    await characteristicReference.writeWithoutResponse(encodedData);
    console.log("Data has been written to BLE without response: ", data);
  } catch (error) {
    console.error("Failed to write data to BLE without response:", error);
  }
}
function stopMonitoringBLECharacteristic() {
  if (notificationSubscription) {
    notificationSubscription.remove();
    notificationSubscription = null;
    console.log("Monitoring stopped.");
  } else {
    console.log("No monitoring to stop.");
  }
}

export default function App_temp() {
  const [currentLocation, setCurrentLocation] = useState<Region>(
    getInitialRegion().region
  );
  const [destination, setDestination] = useState<Region>(
    getInitialRegion().region
  );

  const [bluetoothManager, setBluetoothManger] = useState<BleManager>(
    new BleManager()
  );

  const updateCurrentLocation = (regiondata: string): Region => {
    let latitude_update = 0;
    let longitude_update = 0;

    if (typeof regiondata !== "string") {
      console.warn("updateCurrentLocation: Expected regiondata to be a string");
      Alert.alert("updateCurrentLocation: Expected regiondata to be a string");
      return currentLocation;
    }

    const regionArray = regiondata.split(/[:\n]/);
    console.log("updateCurrentLocation: ", regionArray);

    if (regionArray.length < 2) {
      console.warn(
        "updateCurrentLocation: Expected regiondata to have at least 2 elements"
      );
      Alert.alert(
        "updateCurrentLocation: Expected regiondata to have at least 2 elements"
      );
      return currentLocation;
    }

    if (regionArray[0] == "LAT") {
      latitude_update = parseFloat(regionArray[1]);
      // console.log("latitude_update: ", latitude_update);
    } else if (regionArray[0] == "LONG") {
      longitude_update = parseFloat(regionArray[1]);
      // console.log("longitude_update: ", longitude_update);
    }

    return {
      ...currentLocation,
      latitude:
        latitude_update == 0 ? currentLocation.latitude : latitude_update,
      longitude:
        longitude_update == 0 ? currentLocation.longitude : longitude_update,
    };
  };

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log("RequestBluetoothPermission on this device is " + [result]);
      if (result) {
        console.log("Scanning for devices");

        initBluetooth(
          bluetoothManager,
          "DSD TECH",
          "68:5E:1C:4C:36:F6DSD TECH",
          "0000ffe0-0000-1000-8000-00805f9b34fb",
          "0000ffe1-0000-1000-8000-00805f9b34fb"
        );
      }
    });
  }, []);

  return (
    <Text> hello</Text>
    // <>
    //   <StatusBar style="auto" />
    //   <View style={styles.container}>
    //     <View style={styles.mapContainer}>
    //       <GoogleMap
    //         destination={destination}
    //         setDestination={setDestination}
    //         currentLocation={currentLocation}
    //         setCurrentLocation={setCurrentLocation}
    //       />
    //     </View>

    //     <DataDisplayView
    //       destination={destination}
    //       setDestination={setDestination}
    //       currentLocation={currentLocation}
    //       setCurrentLocation={setCurrentLocation}
    //     />

    //     <View style={styles.bluetooth}>
    //       {deviceId ? (
    //         <Text>{deviceId}</Text>
    //       ) : (
    //         <Text>Device ID not provided</Text>
    //       )}
    //       <Button title={go ? "STOP" : "GO"} onPress={() => handleButton(go)} />
    //     </View>
    //   </View>
    // </>
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
  bluetooth: {
    alignItems: "center",
    justifyContent: "center",
  },
});
