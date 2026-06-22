import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getAnalytics, getTasks, type AnalyticsSummary, type Task } from '@/lib/api';
import { formatFullDate } from '@/lib/dates';

function priorityColor(p: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (p === 'high') return colors.red;
  if (p === 'medium') return colors.yellow;
  return colors.green;
}

function priorityBg(p: string) {
  if (p === 'high') return '#FFE4E4';
  if (p === 'medium') return '#FEF3C7';
  return '#D1FAE5';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sumRes, tasksRes] = await Promise.all([getAnalytics(), getTasks()]);
      setSummary(sumRes.data);
      const all: Task[] = tasksRes.data ?? [];
      setRecentTasks(all.filter(t => !t.completed).slice(0, 5));
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };
  const t = summary?.totals;

  const statCards = [
    { label: 'Tasks',   value: `${t?.tasks_done ?? 0}/${t?.tasks_total ?? 0}`,       sub: 'done',      bg: colors.peach    },
    { label: 'Goals',   value: `${t?.goals_done ?? 0}/${t?.goals_total ?? 0}`,       sub: 'this week', bg: colors.mint     },
    { label: 'Habits',  value: String(t?.habits_total ?? 0),                          sub: 'tracked',   bg: colors.lavender },
    { label: 'Focus',   value: `${t?.pomodoro_minutes_week ?? 0}m`,                  sub: 'this week', bg: colors.sky      },
  ];

  return (
    <ScrollView
      style={[S.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[S.h1, { color: colors.text }]}>Compass</Text>
        <Text style={[styles.date, { color: colors.textSub }]}>{formatFullDate(new Date())}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <>
          {/* Stat grid */}
          <View style={styles.grid}>
            {statCards.map(c => (
              <View key={c.label} style={[styles.statCard, { backgroundColor: c.bg, borderColor: colors.border, shadowColor: colors.border }]}>
                <Text style={[S.label, { color: colors.textSub }]}>{c.label}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{c.value}</Text>
                <Text style={[styles.statSub, { color: colors.textSub }]}>{c.sub}</Text>
              </View>
            ))}
          </View>

          {/* Open tasks */}
          <Text style={[S.h3, { color: colors.text, marginBottom: 10 }]}>Open Tasks</Text>
          {recentTasks.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
              <Ionicons name="checkmark-done-circle" size={32} color={colors.green} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>All caught up!</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {recentTasks.map(task => (
                <View key={String(task.id)} style={[styles.taskRow, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
                  <View style={[styles.dot, { backgroundColor: priorityColor(task.priority, colors) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                    {task.due_date ? <Text style={[styles.taskDue, { color: colors.textSub }]}>Due {task.due_date}</Text> : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: priorityBg(task.priority), borderColor: colors.border }]}>
                    <Text style={styles.badgeText}>{task.priority}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 16, paddingBottom: 40 },
  header:     { marginBottom: 22 },
  date:       { fontSize: 13, fontWeight: '500', marginTop: 2 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%', borderWidth: 2, borderRadius: 10, padding: 14,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  statValue:  { fontSize: 28, fontWeight: '900', marginTop: 4 },
  statSub:    { fontSize: 12, marginTop: 2, fontWeight: '500' },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderRadius: 8, padding: 12,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  taskTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  taskDue:    { fontSize: 12, marginTop: 1 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  badgeText:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#0a0a0a' },
  empty: {
    alignItems: 'center', gap: 8, paddingVertical: 28,
    borderWidth: 2, borderRadius: 10, padding: 16,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  emptyText:  { fontSize: 15, fontWeight: '600' },
});
