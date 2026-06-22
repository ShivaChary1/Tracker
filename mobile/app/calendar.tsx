import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getTasks, type Task } from '@/lib/api';
import { toYMD, MONTH_NAMES } from '@/lib/dates';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildCalendar(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const rows: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) { rows.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); rows.push(week); }
  return rows;
}

function priorityBg(p: string) {
  if (p === 'high') return '#FFE4E4';
  if (p === 'medium') return '#FEF3C7';
  return '#D1FAE5';
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const res = await getTasks(); setTasks(res.data ?? []); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelected(null); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelected(null); }

  const calendar = buildCalendar(year, month);
  const todayYMD = toYMD(new Date());

  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (t.due_date) { if (!acc[t.due_date]) acc[t.due_date] = []; acc[t.due_date].push(t); }
    return acc;
  }, {});

  const selectedTasks = selected ? tasksByDate[selected] ?? [] : [];

  const navBtnStyle = [styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }];

  return (
    <ScrollView style={[S.screen, { backgroundColor: colors.bg }]} contentContainerStyle={styles.container}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={navBtnStyle} onPress={prevMonth}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity style={navBtnStyle} onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayRow}>
        {DAY_HEADERS.map(d => (
          <View key={d} style={styles.dayHeaderCell}>
            <Text style={[styles.dayHeaderText, { color: colors.textSub }]}>{d}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 32 }} />
      ) : (
        <>
          {calendar.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={styles.dayCell} />;
                const ymd = toYMD(day);
                const isToday = ymd === todayYMD;
                const isSel = ymd === selected;
                const dayTasks = tasksByDate[ymd] ?? [];
                const hasOpen = dayTasks.some(t => !t.completed);

                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.dayCell,
                      isToday && [styles.todayCell, { backgroundColor: colors.peach, borderColor: colors.border }],
                      isSel && { backgroundColor: colors.text },
                    ]}
                    onPress={() => setSelected(isSel ? null : ymd)}
                  >
                    <Text style={[styles.dayNum, { color: colors.text }, isSel && { color: colors.bg }, isToday && { fontWeight: '900' }]}>
                      {day.getDate()}
                    </Text>
                    {dayTasks.length > 0 && (
                      <View style={[styles.taskDot, { backgroundColor: hasOpen ? colors.red : colors.green }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {selected && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{selected}</Text>
              {selectedTasks.length === 0 ? (
                <Text style={[styles.noTasks, { color: colors.textSub }]}>No tasks on this day</Text>
              ) : (
                selectedTasks.map(t => (
                  <View key={String(t.id)} style={[styles.taskItem, { borderBottomColor: colors.grayLight }, t.completed && { opacity: 0.55 }]}>
                    <Ionicons name={t.completed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={t.completed ? colors.green : colors.textSub} />
                    <Text style={[styles.taskText, { color: colors.text }, t.completed && { textDecorationLine: 'line-through', color: colors.textSub }]} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: priorityBg(t.priority) }]}>
                      <Text style={styles.badgeText}>{t.priority}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 16, paddingBottom: 40 },
  monthNav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:        { width: 36, height: 36, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  monthLabel:    { fontSize: 20, fontWeight: '800' },
  dayRow:        { flexDirection: 'row', marginBottom: 4 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dayHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  weekRow:       { flexDirection: 'row', marginBottom: 2 },
  dayCell:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, minHeight: 44 },
  todayCell:     { borderWidth: 2 },
  dayNum:        { fontSize: 14, fontWeight: '600' },
  taskDot:       { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  detailCard:    { marginTop: 18, borderWidth: 2, borderRadius: 10, padding: 14, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  detailTitle:   { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  noTasks:       { fontSize: 14, fontStyle: 'italic' },
  taskItem:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1 },
  taskText:      { flex: 1, fontSize: 14, fontWeight: '600' },
  badge:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText:     { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#0a0a0a' },
});
