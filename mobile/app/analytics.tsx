import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getAnalytics, type AnalyticsSummary } from '@/lib/api';

function BarChart({ data, color, colors }: {
  data: Array<{ date: string; count?: number; minutes?: number }>;
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const values = data.map(d => d.count ?? d.minutes ?? 0);
  const max = Math.max(...values, 1);
  return (
    <View style={ch.chart}>
      {data.map((d, i) => {
        const val = d.count ?? d.minutes ?? 0;
        const h = Math.max(4, (val / max) * 80);
        return (
          <View key={i} style={ch.barWrap}>
            <Text style={[ch.val, { color: colors.textSub }]}>{val > 0 ? val : ''}</Text>
            <View style={[ch.bar, { height: h, backgroundColor: val > 0 ? color : colors.grayLight, borderColor: colors.border }]} />
            <Text style={[ch.label, { color: colors.textSub }]}>{d.date.slice(8)}</Text>
          </View>
        );
      })}
    </View>
  );
}
const ch = StyleSheet.create({
  chart:   { flexDirection: 'row', alignItems: 'flex-end', height: 108, gap: 4, paddingTop: 20 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  bar:     { width: '80%', borderRadius: 3, borderWidth: 1 },
  val:     { fontSize: 9, fontWeight: '700' },
  label:   { fontSize: 9 },
});

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const res = await getAnalytics(); setData(res.data); }
    catch { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };
  const t = data?.totals;

  const statRows = [
    { label: 'Tasks Completed',  value: `${t?.tasks_done ?? 0}/${t?.tasks_total ?? 0}`, color: colors.red },
    { label: 'Goals Reached',    value: `${t?.goals_done ?? 0}/${t?.goals_total ?? 0}`, color: colors.blue },
    { label: 'Habits Tracked',   value: String(t?.habits_total ?? 0),                    color: colors.green },
    { label: 'Focus Minutes',    value: `${t?.pomodoro_minutes_week ?? 0}m`,             color: colors.yellow },
  ];

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }];

  return (
    <ScrollView
      style={[S.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <>
          <View style={[cardStyle, { marginBottom: 16 }]}>
            <Text style={[S.h3, { color: colors.text, marginBottom: 12 }]}>This Week</Text>
            {statRows.map(r => (
              <View key={r.label} style={[S.between, { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.grayLight }]}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={[styles.rowLabel, { color: colors.text, flex: 1, marginLeft: 10 }]}>{r.label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{r.value}</Text>
              </View>
            ))}
          </View>

          {data?.tasks_by_day && data.tasks_by_day.length > 0 && (
            <View style={[cardStyle, { marginBottom: 14 }]}>
              <Text style={[S.h3, { color: colors.text, marginBottom: 4 }]}>Tasks / Day</Text>
              <BarChart data={data.tasks_by_day} color={colors.red} colors={colors} />
            </View>
          )}

          {data?.habits_by_day && data.habits_by_day.length > 0 && (
            <View style={[cardStyle, { marginBottom: 14 }]}>
              <Text style={[S.h3, { color: colors.text, marginBottom: 4 }]}>Habits / Day</Text>
              <BarChart data={data.habits_by_day} color={colors.green} colors={colors} />
            </View>
          )}

          {data?.pomodoro_by_day && data.pomodoro_by_day.length > 0 && (
            <View style={[cardStyle, { marginBottom: 14 }]}>
              <Text style={[S.h3, { color: colors.text, marginBottom: 4 }]}>Focus (min) / Day</Text>
              <BarChart data={data.pomodoro_by_day} color={colors.blue} colors={colors} />
            </View>
          )}

          {data?.streaks && data.streaks.length > 0 && (
            <View style={[cardStyle, { marginBottom: 14 }]}>
              <Text style={[S.h3, { color: colors.text, marginBottom: 12 }]}>Habit Streaks 🔥</Text>
              {data.streaks.map(s => {
                const maxStreak = Math.max(...data.streaks.map(x => x.streak));
                return (
                  <View key={s.habit_id} style={{ marginBottom: 12 }}>
                    <View style={S.between}>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>{s.title}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.red }}>{s.streak}d</Text>
                    </View>
                    <View style={[styles.streakTrack, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
                      <View style={[styles.streakFill, { width: `${(s.streak / maxStreak) * 100}%`, backgroundColor: colors.red }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 16, paddingBottom: 40 },
  card:         { borderWidth: 2, borderRadius: 10, padding: 16, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  rowLabel:     { fontSize: 14, fontWeight: '600' },
  rowValue:     { fontSize: 16, fontWeight: '800' },
  streakTrack:  { height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  streakFill:   { height: '100%', borderRadius: 4 },
});
