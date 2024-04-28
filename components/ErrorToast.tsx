import { Alert } from "react-native";

const ErrorToast = (message: string) => {
  return {
    showErrorToast: (message: string) => {
      Alert.alert(
        "Error",
        message,
        [{ text: "OK", onPress: () => console.log("OK Pressed") }],
        { cancelable: false }
      );
    },
  };
};

export default ErrorToast;
