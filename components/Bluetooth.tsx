import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { Alert, PermissionsAndroid, Platform, Text } from "react-native";
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
  region: Region;
  setRegion: (region: Region) => void;
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

    for (const service of services) {
      // console.log(`Service: ${service.uuid}`);
      const characteristics = await service.characteristics();
      // for (const characteristic of characteristics) {
      //   console.log(`  Characteristic: ${characteristic.uuid}`);
      // }
    }

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
            //   "Received Notification with Decoded Data:",
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
  region,
  setRegion,
}: BluetoothProp) {
  const [go, setGo] = useState(false);

  const updateRegion = (regiondata: string): Region => {
    if (typeof regiondata !== "string") {
      console.warn("updateRegion: Expected regiondata to be a string");
      return region;
    }

    const regionArray = regiondata.split(/[:\n]/);
    // console.log("regionArray: ", regionArray);

    if (regionArray.length < 4) {
      console.warn(
        "updateRegion: Expected regiondata to have at least 4 elements"
      );
      return region;
    }

    if (regionArray[0] == "LAT") {
      const lat_temp = parseInt(regionArray[1]);
      const latitude_update = lat_temp / 1000000;
      console.log("latitude_update: ", region.latitude + latitude_update);

      const long_temp = parseInt(regionArray[3]);
      const longitude_update = long_temp / 1000000;
      console.log("longitude_update: ", region.longitude + longitude_update);

      return {
        ...region,
        latitude: region.latitude + latitude_update,
        longitude: region.longitude + longitude_update,
      };
    }

    return region;
  };

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log(
        "Android detected, requestBluetoothPermission is " + [result]
      );
      if (result) {
        console.log("Scanning for devices");
        initBluetooth(deviceName, deviceId, serviceUUID, characteristicUUID);
      }
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (go) {
        stopMonitoringBLECharacteristic();
        // writeBLECharacteristic(
        //   `GO!!,LAT:${region.latitude.toFixed(
        //     6
        //   )},LONG:${region.longitude.toFixed(6)}`
        // );
        writeBLECharacteristic(`GO!!\n`);
        writeBLECharacteristic(`LAT:${region.latitude.toFixed(6)}\n`);
        writeBLECharacteristic(`LONG:${region.longitude.toFixed(6)}\n`);

        Alert.alert(
          `data sent: ${region.latitude.toFixed(6)},${region.longitude.toFixed(
            6
          )}`
        );
      } else {
        try {
          const data = await readBLECharacteristic();
          // console.log("data read: ", data);
          // Alert.alert(`data received: ${data}`);
          if (data) {
            const updatedRegion = updateRegion(data);
            setRegion(updatedRegion);
          }
        } catch (error) {
          console.error("Failed to read BLE characteristic: ", error);
        }
      }
      //  else {
      //   stopMonitoringBLECharacteristic();
      // }
    };

    fetchData();
  }, [go, region, updateRegion]);

  return (
    <>
      {deviceId ? <Text>{deviceId}</Text> : <Text>Device ID not provided</Text>}
      <Button title={go ? "Stop" : "go"} onPress={() => setGo(!go)} />
    </>
  );
}
