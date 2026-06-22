import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ITEMS: { label: string; desc: string; icon: IoniconName; route: string; surface: 'mint' | 'peach' | 'sky' | 'lavender' | 'yellow' }[] = [
  { label: 'Notes',     desc: 'Ideas & thoughts',    icon: 'document-text', route: '/notes',     surface: 'mint'    },
  { label: 'Pomodoro',  desc: 'Focus timer',          icon: 'timer',         route: '/pomodoro',  surface: 'peach'   },
  { label: 'Analytics', desc: 'Progress overview',    icon: 'bar-chart',     route: '/analytics', surface: 'sky'     },
  { label: 'Calendar',  desc: 'Tasks by date',        icon: 'calendar',      route: '/calendar',  surface: 'lavender'},
  { label: 'Coach',     desc: 'AI productivity coach',icon: 'chatbubble-ellipses', route: '/coach', surface: 'yellow' },
];

export default function MoreScreen() {
  const { colors, isDark, toggle } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.header, { color: colors.text }]}>More</Text>

      {/* Dark / Light toggle card */}
      <TouchableOpacity
        style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}
        onPress={toggle}
        activeOpacity={0.8}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={isDark ? colors.yellow : colors.blue} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.toggleTitle, { color: colors.text }]}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
          <Text style={[styles.toggleDesc, { color: colors.textSub }]}>Tap to switch appearance</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: isDark ? colors.yellow : colors.blue }]}>
          <Text style={styles.pillText}>{isDark ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.grid}>
        {ITEMS.map(item => {
          const bg = colors[item.surface === 'yellow' ? 'peach' : item.surface];
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.card, { backgroundColor: bg, borderColor: colors.border, shadowColor: colors.border }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={item.icon} size={26} color={colors.text} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSub }]}>{item.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, paddingBottom: 40 },
  header:      { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16 },
  toggleCard:  {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 10, padding: 14, marginBottom: 20,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  toggleTitle: { fontSize: 15, fontWeight: '700' },
  toggleDesc:  { fontSize: 12, marginTop: 1 },
  pill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '47%', borderWidth: 2, borderRadius: 10, padding: 14,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  cardLabel:  { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardDesc:   { fontSize: 12, fontWeight: '500' },
});
