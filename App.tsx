import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Auth from "./src/components/Auth";

export default function App() {
  return (
    <View>
      <StatusBar style="auto" />
      <Auth />
    </View>
  );
}

const styles = StyleSheet.create({});
