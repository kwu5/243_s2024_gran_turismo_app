import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import { Device, Subscription } from "react-native-ble-plx";
import React, { useEffect, useState } from "react";

import { BleManager, Characteristic } from "react-native-ble-plx";
import base64 from "react-native-base64";
import Bluetooth from "./components/Bluetooth";
import GoogleMap, { getInitialRegion } from "./components/googleMap";
import { Region } from "react-native-maps";
import DataDisplayView from "./components/DataDisplayView";
import Button from "./components/Button";

type PermissionStatus = "granted" | "denied" | "never_ask_again";

const bluetoothManager = new BleManager();
let characteristicReference: Characteristic | undefined = undefined;
let notificationSubscription: Subscription | null = null;

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

  return false;
};

// const scanAndConnect = async (
//   deviceName: string | null,
//   deviceId: string | null,
//   serviceUUID: string | null,
//   characteristicUUID: string | null
// ) => {
//   bluetoothManager.startDeviceScan(null, null, async (error, device) => {
//     if (error) {
//       console.error("ScanAndConnect failed: ", error);
//       return false;
//     }

//     if (device && (device.name == deviceName || device.id == deviceId)) {
//       bluetoothManager.stopDeviceScan();
//       console.log(`Device found: ${device.name}, id: ${device.id}`);

//       await initBLEConnection(
//         device,
//         serviceUUID ? serviceUUID : "",
//         characteristicUUID ? characteristicUUID : ""
//       );
//     }
//     return false;
//   });
// };

// async function initBLEConnection(
//   device: Device,
//   serviceUUID: string,
//   characteristicUUID: string
// ): Promise<boolean> {
//   try {
//     const connectedDevice = await device.connect();
//     await connectedDevice.discoverAllServicesAndCharacteristics();
//     const services = await connectedDevice.services();

//     const customService = services.find((s) => s.uuid === serviceUUID);
//     if (!customService) {
//       console.error("Custom service: (FFE0) not found");
//       return false;
//     }

//     const customCharacteristic = await customService.characteristics();
//     const characteristic = customCharacteristic.find(
//       (c) => c.uuid === characteristicUUID
//     );
//     if (!characteristic) {
//       console.error("Custom characteristic: (FFE1) not found");
//       return false;
//     }

//     characteristicReference = characteristic;
//     return true;
//   } catch (error) {
//     console.error("Error in initBLEConnection: ", error);
//     return false;
//   }
// }

// async function readBLECharacteristic(): Promise<string | null> {
//   if (characteristicReference == null) {
//     return null;
//   }

//   return new Promise((resolve, reject) => {
//     try {
//       if (characteristicReference) {
//         notificationSubscription = characteristicReference.monitor(
//           (error, characteristic) => {
//             if (error) {
//               console.error(
//                 "readBLECharacteristic: Error during notification setup:",
//                 error
//               );
//               reject(error);
//             }
//             if (characteristic?.value) {
//               const decodedData = base64.decode(characteristic.value);
//               // console.log(
//               //   "Received Decoded Data:",
//               //   decodedData
//               // );

//               resolve(decodedData);
//             }
//           }
//         );
//       }
//     } catch (error) {
//       return console.error("Error in readBLECharacteristic: ", error);
//     }
//   });
// }

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<Region>(
    getInitialRegion().region
  );
  const [destination, setDestination] = useState<Region>(
    getInitialRegion().region
  );
  //   const [characteristicReference, setCharacteristicReference] =
  //     useState<Characteristic>();

  const [goState, setGostate] = useState(false);

  const updateCurrentLocation = (regiondata: string): void => {
    if (typeof regiondata !== "string") {
      console.warn("updateCurrentLocation: Expected regiondata to be a string");
      return;
    }

    const regionArray = regiondata.split(/[:\n]/);
    // console.log("updateCurrentLocation: ", regionArray);

    if (regionArray.length < 2) {
      console.warn(
        "updateCurrentLocation: Expected regiondata to have at least 2 elements"
      );
      return;
    }

    if (regionArray[0] == "LAT") {
      const latitude_update = parseFloat(regionArray[1]);
      // console.log("latitude_update: ", latitude_update);
      setCurrentLocation((prevState) => ({
        ...prevState,
        latitude: latitude_update,
      }));
    } else if (regionArray[0] == "LONG") {
      const longitude_update = parseFloat(regionArray[1]);
      // console.log("longitude_update: ", longitude_update);
      setCurrentLocation((prevState) => ({
        ...prevState,
        longitude: longitude_update,
      }));
    }
  };

  async function writeBLECharacteristic(data: string): Promise<void> {
    if (
      !characteristicReference ||
      characteristicReference == null ||
      !characteristicReference.isWritableWithoutResponse
    ) {
      console.error(
        "writeBLECharacteristic: No characteristic reference available."
      );
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

  //mount approach:
  //   useEffect(() => {
  //     requestBluetoothPermission().then((result) => {
  //       console.log("RequestBluetoothPermission on this device is " + [result]);
  //       if (result) {
  //         console.log("Scanning for devices");
  //         scanAndConnect(
  //           "DSD TECH",
  //           "68:5E:1C:4C:36:F6DSD TECH",
  //           "0000ffe0-0000-1000-8000-00805f9b34fb",
  //           "0000ffe1-0000-1000-8000-00805f9b34fb"
  //         );
  //         /**
  //          *  deviceName={"DSD TECH"}
  //           deviceId={"68:5E:1C:4C:36:F6DSD TECH"}
  //           serviceUUID={"0000ffe0-0000-1000-8000-00805f9b34fb"}
  //           characteristicUUID={"0000ffe1-0000-1000-8000-00805f9b34fb"}
  //          */
  //       }
  //     });

  //     let isMounted = true; // Flag to manage mount status
  //     let timeoutId: NodeJS.Timeout | null = null;

  //     const fetchData = async () => {
  //       try {
  //         if (!isMounted) return;
  //         const data = await readBLECharacteristic();
  //         console.log(`fetchData: `, data);
  //         if (data && isMounted) {
  //           updateCurrentLocation(data);
  //         }
  //       } catch (error) {
  //         if (!isMounted) console.error(error);
  //         else {
  //           console.error("Failed to read BLE characteristic: ", error);
  //         }
  //         Alert.alert("Failed to read data");
  //       } finally {
  //         if (isMounted) {
  //           // Schedule the next fetch
  //           timeoutId = setTimeout(fetchData, 4500);
  //         }
  //       }
  //     };

  //     fetchData(); // fetch immediately on mount

  //     return () => {
  //       isMounted = false;
  //       if (timeoutId !== null) {
  //         clearTimeout(timeoutId);
  //       }
  //     };
  //   }, []);

  //current
  //   useEffect(() => {
  //     requestBluetoothPermission().then((result) => {
  //       console.log("RequestBluetoothPermission on this device is " + [result]);
  //       if (result) {
  //         console.log("Scanning for devices");
  //         scanAndConnect(
  //           "DSD TECH",
  //           "68:5E:1C:4C:36:F6DSD TECH",
  //           "0000ffe0-0000-1000-8000-00805f9b34fb",
  //           "0000ffe1-0000-1000-8000-00805f9b34fb"
  //         ).then(() => {
  //           bluetoothManager.monitorCharacteristicForDevice(
  //             "68:5E:1C:4C:36:F6DSD TECH",
  //             "0000ffe0-0000-1000-8000-00805f9b34fb",
  //             "0000ffe1-0000-1000-8000-00805f9b34fb",
  //             (error, characteristic) => {
  //               if (error) {
  //                 console.error("Notification setup failed", error);
  //                 return;
  //               }
  //               if (characteristic && characteristic.value) {
  //                 console.log(
  //                   "Received new data from",
  //                   characteristic.uuid,
  //                   characteristic.value
  //                 );
  //                 updateCurrentLocation(characteristic.value);
  //               }
  //             }
  //           );
  //         });
  //       }
  //     });
  //   }, []);

  //correct
  //   useEffect(() => {
  //     requestBluetoothPermission().then((result) => {
  //       console.log("RequestBluetoothPermission on this device is " + [result]);
  //       if (result) {
  //         console.log("Scanning for devices");

  //         bluetoothManager.startDeviceScan(null, null, (error, device) => {
  //           if (error) {
  //             console.error("Scan failed", error);
  //             return;
  //           }

  //           if (device && device.name === "DSD TECH") {
  //             bluetoothManager.stopDeviceScan();

  //             device
  //               .connect()
  //               .then((device) => {
  //                 return device.discoverAllServicesAndCharacteristics();
  //               })
  //               .then((device) => {

  //                 bluetoothManager.monitorCharacteristicForDevice(
  //                   device.id,
  //                   "0000ffe0-0000-1000-8000-00805f9b34fb",
  //                   "0000ffe1-0000-1000-8000-00805f9b34fb",
  //                   (error, characteristic) => {
  //                     if (error) {
  //                       console.error("Notification setup failed", error);
  //                       return;
  //                     }
  //                     if (characteristic && characteristic.value) {
  //                       //   console.log(
  //                       //     "Received new data from",
  //                       //     characteristic.uuid,
  //                       //     characteristic.value
  //                       //   );
  //                       const decodedData = base64.decode(characteristic.value);

  //                       updateCurrentLocation(decodedData);
  //                     }
  //                   }
  //                 );
  //               })
  //               .catch((error) => {
  //                 console.error("Connection failed", error);
  //               });
  //           }
  //         });
  //       }
  //     });
  //   }, []);

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log("RequestBluetoothPermission on this device is " + [result]);
      if (result) {
        console.log("Scanning for devices");

        bluetoothManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.error("Scan failed", error);
            return;
          }

          if (device && device.name === "DSD TECH") {
            bluetoothManager.stopDeviceScan();

            device
              .connect()
              .then((device) => {
                return device.discoverAllServicesAndCharacteristics();
              })
              .then((device) => {
                return device.services();
              })
              .then((services) => {
                const promises = services.map((service) =>
                  service.characteristics()
                );
                return Promise.all(promises);
              })
              .then((characteristicsNestedArray) => {
                const characteristics = characteristicsNestedArray.flat();
                characteristicReference = characteristics.find(
                  (char) => char.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb"
                );

                if (characteristicReference) {
                  Alert.alert("Connected to DSD TECH BLE");
                  bluetoothManager.monitorCharacteristicForDevice(
                    device.id,
                    "0000ffe0-0000-1000-8000-00805f9b34fb",
                    characteristicReference.uuid,
                    (error, characteristic) => {
                      if (error) {
                        console.error("Notification setup failed", error);
                        return;
                      }
                      if (characteristic && characteristic.value) {
                        const decodedData = base64.decode(characteristic.value);
                        updateCurrentLocation(decodedData);
                      }
                    }
                  );
                }
              })
              .catch((error) => {
                console.error("Connection failed", error);
              });
          }
        });
      }
    });
  }, []);

  const handleSendData = async () => {
    if (!goState) {
      writeBLECharacteristic(`GO!!\n`);
      writeBLECharacteristic(`LAT:${destination.latitude.toFixed(6)}\n`);
      writeBLECharacteristic(`LONG:${destination.longitude.toFixed(6)}\n`);

      Alert.alert(
        `data sent: ${destination.latitude.toFixed(
          6
        )},${destination.longitude.toFixed(6)}`
      );
    } else {
      writeBLECharacteristic(`STOP!!\n`);
      Alert.alert(`STOP!!`);
    }
    setGostate(!goState);
  };

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <GoogleMap
            destination={destination}
            setDestination={setDestination}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
          />
        </View>

        <DataDisplayView
          destination={destination}
          setDestination={setDestination}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
        />

        <Button title={goState ? "STOP" : "GO"} onPress={handleSendData} />
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
    alignItems: "center",
    justifyContent: "center",
  },
});
