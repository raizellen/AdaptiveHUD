import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import TelemetryItem from './TelemetryItem';

import {
  getVisibleTelemetry,
  Workload,
} from '../services/adaptiveLogic';
import { fakeTelemetry } from '../services/telemetry';

export default function MainHUD() {
  const [workload, setWorkload] = useState<Workload>('low');

  const visibleTelemetry = getVisibleTelemetry(
    fakeTelemetry,
    workload
  );

  return (
    <View style={styles.container}>

      <Text style={styles.title}>EVA HUD</Text>

      <Text style={styles.workload}>
        WORKLOAD: {workload.toUpperCase()}
      </Text>

      <View style={styles.telemetry}>

        {visibleTelemetry.oxygen !== undefined && (
          <TelemetryItem
            label="O₂"
            value={`${visibleTelemetry.oxygen}%`}
          />
        )}

        {visibleTelemetry.pressure !== undefined && (
          <TelemetryItem
            label="PRESSURE"
            value={`${visibleTelemetry.pressure} psi`}
          />
        )}

        {visibleTelemetry.temperature !== undefined && (
          <TelemetryItem
            label="TEMP"
            value={`${visibleTelemetry.temperature}°C`}
          />
        )}

        {visibleTelemetry.battery !== undefined && (
          <TelemetryItem
            label="BATTERY"
            value={`${visibleTelemetry.battery}%`}
          />
        )}

        {visibleTelemetry.heartRate !== undefined && (
          <TelemetryItem
            label="HEART RATE"
            value={`${visibleTelemetry.heartRate} bpm`}
          />
        )}

      </View>

      <View style={styles.buttons}>

        <Pressable
          style={styles.button}
          onPress={() => setWorkload('low')}
        >
          <Text style={styles.buttonText}>LOW</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => setWorkload('medium')}
        >
          <Text style={styles.buttonText}>MEDIUM</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => setWorkload('high')}
        >
          <Text style={styles.buttonText}>HIGH</Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 40,
    justifyContent: 'center',
  },

  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  workload: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 40,
  },

  telemetry: {
    marginBottom: 40,
  },

  buttons: {
    flexDirection: 'row',
    gap: 10,
  },

  button: {
    borderWidth: 1,
    borderColor: 'white',
    padding: 12,
    borderRadius: 6,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});