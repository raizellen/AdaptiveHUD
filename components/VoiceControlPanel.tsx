import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { VoiceCommand } from "../backend/voice/commandParser";
import { useVoiceControl } from "../services/voiceControl";

interface VoiceControlPanelProps {
  onCommand?: (command: VoiceCommand) => void;
}

export default function VoiceControlPanel({
  onCommand,
}: VoiceControlPanelProps) {
  const [typedCommand, setTypedCommand] = useState("");
  const {
    listening,
    transcript,
    lastCommand,
    start,
    stop,
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
      <TouchableOpacity
        style={[
          styles.micButton,
          listening && styles.micButtonActive,
          !micAvailable && styles.micButtonDisabled,
        ]}
        onPress={listening ? stop : start}
        disabled={!micAvailable}
      >
        <Text style={styles.micButtonText}>
          {!micAvailable
            ? "Mic unavailable (use dev build)"
            : listening
            ? "Listening..."
            : "Hold to Talk"}
        </Text>
      </TouchableOpacity>

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
    marginTop: 24,
    width: "80%",
    alignItems: "center",
  },

  micButton: {
    backgroundColor: "#1a3a8a",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  micButtonActive: {
    backgroundColor: "#1a8a3a",
  },

  micButtonDisabled: {
    backgroundColor: "#333",
  },

  micButtonText: {
    color: "#fff",
    fontWeight: "bold",
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