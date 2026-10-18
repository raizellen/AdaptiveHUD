import { StyleSheet, Text, View } from "react-native";

import { Mission } from "../backend/mission/missionManager";

interface MissionPanelProps {
  mission: Mission | null;
}

export default function MissionPanel({ mission }: MissionPanelProps) {
  if (!mission) return null;

  const hasTitle = mission.title.length > 0;
  const hasObjective = mission.objective.length > 0;

  if (!hasTitle && !hasObjective) return null;

  return (
    <View style={styles.container}>
      {hasTitle && (
        <>
          <Text style={styles.label}>MISSION</Text>
          <Text style={styles.title}>{mission.title}</Text>
        </>
      )}

      {hasObjective && (
        <>
          <Text style={[styles.label, hasTitle && styles.objectiveLabel]}>
            OBJECTIVE
          </Text>
          <Text style={styles.objective}>{mission.objective}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    color: "#888",
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 4,
  },

  objectiveLabel: {
    marginTop: 20,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  objective: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 22,
  },
});