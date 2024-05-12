import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
  View,
} from "react-native";
import base64 from "react-native-base64";
import ErrorToast from "./ErrorToast";
import { useEffect, useState } from "react";
import Button from "./Button";
import { Region } from "react-native-maps";
import React from "react";

type PermissionStatus = "granted" | "denied" | "never_ask_again";

const bluetoothManager = new BleManager();
let characteristicReference: Characteristic | null = null;
let notificationSubscription: Subscription | null = null;

interface BluetoothProp {
  deviceName: string | null;
  deviceId: string | null;
  serviceUUID: string | null;
  characteristicUUID: string | null;
  destination: Region;
  setDestination: (region: Region) => void;
  setCurrentLocation: (region: Region) => void;
  currentLocation: Region;
}

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
): Promise<boolean> {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await connectedDevice.services();

    // for (const service of services) {
    //   const characteristics = await service.characteristics();
    // }

    const customService = services.find((s) => s.uuid === serviceUUID);
    if (!customService) {
      console.error("Custom service: (FFE0) not found");
      return false;
    }

    const customCharacteristic = await customService.characteristics();
    const characteristic = customCharacteristic.find(
      (c) => c.uuid === characteristicUUID
    );
    if (!characteristic) {
      console.error("Custom characteristic: (FFE1) not found");
      return false;
    }

    characteristicReference = characteristic;
    return true;
  } catch (error) {
    console.error("Error in initBLEConnection: ", error);
    return false;
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
            // console.log(
            //   "Received Decoded Data:",
            //   decodedData
            // );

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

export default function Bluetooth({
  deviceName,
  deviceId,
  serviceUUID,
  characteristicUUID,
  currentLocation,
  setCurrentLocation,
  destination,
  setDestination,
}: BluetoothProp) {
  const [go, setGo] = useState(false);

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
    const fetchData = async () => {
      try {
        //data1 and data2 are the lat and long that are read from the BLE characteristic in two separate reads
        const data1 = await readBLECharacteristic();
        const data2 = await readBLECharacteristic();
        if (data1) {
          const updatedCurrentLocation = updateCurrentLocation(data1);
          setCurrentLocation(updatedCurrentLocation);
        }
        if (data2) {
          const updatedCurrentLocation = updateCurrentLocation(data2);
          setCurrentLocation(updatedCurrentLocation);
        }
      } catch (error) {
        console.error("Failed to read BLE characteristic: ", error);
        Alert.alert("Failed to read data");
      }
    };

    const intervalId = setInterval(() => {
      fetchData();
    }, 1500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log("RequestBluetoothPermission on this device is " + [result]);
      if (result) {
        console.log("Scanning for devices");
        initBluetooth(deviceName, deviceId, serviceUUID, characteristicUUID);
      }
    });
  }, []);

  useEffect(() => {
    const sendData = async () => {
      // stopMonitoringBLECharacteristic();
      writeBLECharacteristic(`GO!!\n`);
      writeBLECharacteristic(`LAT:${destination.latitude.toFixed(6)}\n`);
      writeBLECharacteristic(`LONG:${destination.longitude.toFixed(6)}\n`);

      Alert.alert(
        `data sent: ${destination.latitude.toFixed(
          6
        )},${destination.longitude.toFixed(6)}`
      );
    };

    if (go) {
      sendData();
    }
  }, [go]);

  return (
    <View style={styles.bluetooth}>
      {deviceId ? <Text>{deviceId}</Text> : <Text>Device ID not provided</Text>}
      <Button title={go ? "STOP" : "GO"} onPress={() => setGo(!go)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bluetooth: {
    alignItems: "center",
    justifyContent: "center",
  },
});
