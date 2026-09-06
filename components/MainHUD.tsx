import { StyleSheet, Text, View } from "react-native";
import { HUDData } from "../services/socket";

interface MainHUDProps {
  data: HUDData | null;
}

export default function MainHUD({ data }: MainHUDProps) {

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Connecting to EVA system...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        EVA HUD
      </Text>

      <Text style={styles.text}>
        O₂: {data.telemetry.oxygen}%
      </Text>

      <Text style={styles.text}>
        CO₂: {data.telemetry.co2}
      </Text>

      <Text style={styles.text}>
        Battery: {data.telemetry.battery}%
      </Text>

      <Text style={styles.text}>
        Temperature: {data.telemetry.temperature}°C
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 32,
    marginBottom: 30,
  },

  text: {
    color: "#fff",
    fontSize: 20,
    marginVertical: 5,
  },
});