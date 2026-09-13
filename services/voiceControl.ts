import { useCallback, useRef, useState } from "react";

import {
    parseVoiceCommand,
    VoiceCommand,
} from "../backend/voice/commandParser";

// Guard the native import: in Expo Go (or before a dev client has
// been built) this module doesn't exist and would otherwise crash
// on load. We detect that once, up front, instead of at call time.
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
let speechModuleAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const speechRecognition = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule =
    speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent =
    speechRecognition.useSpeechRecognitionEvent;
  speechModuleAvailable = true;
} catch (err) {
  console.log(
    "expo-speech-recognition native module not available " +
      "(expected in Expo Go) — voice input falls back to the " +
      "typed-command box until a dev client is built."
  );
}

export function useVoiceControl(
  onCommand?: (command: VoiceCommand) => void
) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] =
    useState<VoiceCommand | null>(null);

  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  // These no-op if the native module isn't available.
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));

  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript ?? "";
    setTranscript(text);

    if (event.isFinal) {
      const command = parseVoiceCommand(text);
      setLastCommand(command);
      onCommandRef.current?.(command);
    }
  });

  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Voice recognition error:", event.error, event.message);
    setListening(false);
  });

  const start = useCallback(async () => {
    if (!speechModuleAvailable) {
      console.log(
        "Mic input isn't available in this build — use the " +
          "typed-command box below, or build a dev client to " +
          "enable real speech recognition."
      );
      return;
    }

    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permission.granted) {
      console.log("Microphone/speech permission not granted");
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  }, []);

  const stop = useCallback(() => {
    if (!speechModuleAvailable) return;
    ExpoSpeechRecognitionModule.stop();
  }, []);

  // Lets you exercise the pipeline without a mic — this is the
  // primary way to test voice commands until you build a dev client.
  const simulate = useCallback((text: string) => {
    setTranscript(text);
    const command = parseVoiceCommand(text);
    setLastCommand(command);
    onCommandRef.current?.(command);
  }, []);

  return {
    listening,
    transcript,
    lastCommand,
    start,
    stop,
    simulate,
    micAvailable: speechModuleAvailable,
  };
}