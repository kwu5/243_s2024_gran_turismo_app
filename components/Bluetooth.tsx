import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { PermissionsAndroid, Platform, Text } from "react-native";
import base64 from "react-native-base64";
import ErrorToast from "./ErrorToast";
import { Children, useEffect, useState } from "react";
import Button from "./Button";

type PermissionStatus = "granted" | "denied" | "never_ask_again";

const bluetoothManager = new BleManager();
let characteristicReference: Characteristic | null = null;
let notificationSubscription: Subscription | null = null;

interface BluetoothProp {
  deviceName: string | null;
  deviceId: string | null;
  serviceUUID: string | null;
  characteristicUUID: string | null;
}

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
  ErrorToast("BLE Permission have not been granted");
  return false;
};

const initBluetooth = async ({
  deviceName,
  deviceId,
  serviceUUID,
  characteristicUUID,
}: BluetoothProp) => {
  bluetoothManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error("ScanAndConnect failed: ", error);
      return;
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
  });
};

async function initBLEConnection(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string
) {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await connectedDevice.services();

    for (const service of services) {
      console.log(`Service: ${service.uuid}`);
      const characteristics = await service.characteristics();
      for (const characteristic of characteristics) {
        console.log(`  Characteristic: ${characteristic.uuid}`);
      }
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
  }
}

async function readBLECharacteristic(): Promise<string | null> {
  if (characteristicReference == null) {
    return null;
  }

  notificationSubscription = characteristicReference.monitor(
    (error, characteristic) => {
      if (error) {
        console.error(
          "readBLECharacteristic: Error during notification setup:",
          error
        );
        return;
      }
      if (characteristic?.value) {
        const decodedData = base64.decode(characteristic.value);
        console.log("Received Notification with Decoded Data:", decodedData);
        return decodedData;
      }
    }
  );
  return null;
}

async function writeBLECharacteristic(data: string): Promise<void> {
  if (characteristicReference == null) {
    return;
  }

  const encodedData = base64.encode(data);
  await characteristicReference.writeWithoutResponse(encodedData);
  console.log("Data has been written to BLE: ", data);
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
}: BluetoothProp) {
  const triggerStart = false;

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log(
        "Android detected, requestBluetoothPermission is " + [result]
      );
      if (result) {
        console.log("Scanning for devices");
        initBluetooth({
          deviceName,
          deviceId,
          serviceUUID,
          characteristicUUID,
        });
      }
    });
  }, []);

  const [start, setStart] = useState(false);
  useEffect(() => {
    if (start) {
      stopMonitoringBLECharacteristic();
      writeBLECharacteristic("start");
    } else {
      readBLECharacteristic();
    }
  }, [start]);

  return (
    <>
      <Text>Bluetooth enabled</Text>
      {/* {start ?  : "stop"} */}
      <Button
        title={start ? "Stop" : "Start"}
        onPress={() => setStart(!start)}
      />
      {/* <Button title="Start" onPress={() => setStart(true)} />
      <Button title="Stop" onPress={() => setStart(false)} /> */}
    </>
  );
}
function onDataReceived(decodedData: string) {
  throw new Error("Function not implemented.");
}
