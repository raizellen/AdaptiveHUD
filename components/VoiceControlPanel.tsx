import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { VoiceCommand } from "../backend/voice/commandParser";
import { useVoiceControl } from "../services/voiceControl";

interface VoiceControlPanelProps { onCommand?: (command: VoiceCommand) => void }

export default function VoiceControlPanel({
  onCommand,
}: VoiceControlPanelProps) {
  const [typedCommand, setTypedCommand] = useState("");
  const {
    listening,
    transcript,
    lastCommand,
    simulate,
    micAvailable,
  } = useVoiceControl(onCommand);

  const handleSimulate = () => {
    if (!typedCommand.trim()) return;
    simulate(typedCommand);
    setTypedCommand("");
  };

  return (
    <View style={styles.container}>

      <Text
        style={[
          styles.micStatus,
          micAvailable ? styles.micAvailable : styles.micUnavailable,
        ]}
      >
        {micAvailable ? "● Mic available" : "● Mic unavailable"}
      </Text>

      {transcript ? (
        <Text style={styles.transcript}>"{transcript}"</Text>
      ) : null}

      {lastCommand ? (
        <Text style={styles.command}>
          → {lastCommand.type}
          {lastCommand.metric ? ` (${lastCommand.metric})` : ""}
        </Text>
      ) : null}

      {/* Fallback for testing in Expo Go / without a mic */}
      <View style={styles.fallback}>
        <TextInput
          style={styles.input}
          placeholder="Type a command to test..."
          placeholderTextColor="#666"
          value={typedCommand}
          onChangeText={setTypedCommand}
          onSubmitEditing={handleSimulate}
          returnKeyType="send"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  micStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },

  micAvailable: {
    color: "#4ade80",
  },

  micUnavailable: {
    color: "#ef4444",
  },

  listening: {
    color: "#4ade80",
    marginTop: 6,
  },

  transcript: {
    color: "#aaa",
    marginTop: 12,
    fontStyle: "italic",
  },

  command: {
    color: "#8fd",
    marginTop: 6,
    fontSize: 16,
  },

  fallback: {
    marginTop: 16,
    width: "100%",
  },

  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
  },
});