import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/lib/theme';

export default function ModalScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Modal</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.text, borderColor: colors.border, shadowColor: colors.border }]}
        onPress={() => router.back()}
      >
        <Text style={{ color: colors.bg, fontWeight: '700' }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { marginTop: 20, borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
});
