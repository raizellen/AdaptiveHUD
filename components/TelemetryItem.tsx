import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string | number;
};

export default function TelemetryItem({ label, value }: Props) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  label: {
    color: 'white',
    fontSize: 18,
  },

  value: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});