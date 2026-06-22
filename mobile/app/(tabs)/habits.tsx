import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getHabits, createHabit, deleteHabit, getHabitLogs, toggleHabitLog, type Habit, type HabitLog } from '@/lib/api';
import { getMondayOf, weekDays, toYMD, DAY_LABELS } from '@/lib/dates';

type HabitColor = 'mint' | 'peach' | 'lavender' | 'sky';
const COLORS: HabitColor[] = ['mint', 'peach', 'lavender', 'sky'];

export default function HabitsScreen() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitColor, setHabitColor] = useState<HabitColor>('mint');
  const [target, setTarget] = useState('5');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState('');

  const monday = getMondayOf(new Date());
  const days = weekDays(monday);
  const startYMD = toYMD(monday);
  const endYMD = toYMD(days[6]);

  const load = useCallback(async () => {
    try {
      const [hRes, lRes] = await Promise.all([getHabits(), getHabitLogs(startYMD, endYMD)]);
      setHabits(hRes.data ?? []); setLogs(lRes.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  }, [startYMD, endYMD]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const isLogged = (hId: string | number, date: Date) => {
    const ymd = toYMD(date);
    return logs.some(l => String(l.habit_id) === String(hId) && l.log_date === ymd);
  };

  async function handleToggle(hId: string | number, date: Date) {
    const ymd = toYMD(date);
    const key = `${hId}_${ymd}`;
    if (toggling === key) return;
    setToggling(key);
    const was = isLogged(hId, date);
    setLogs(prev => was
      ? prev.filter(l => !(String(l.habit_id) === String(hId) && l.log_date === ymd))
      : [...prev, { habit_id: hId, log_date: ymd }]
    );
    try { await toggleHabitLog(hId, ymd); } catch { load(); } finally { setToggling(''); }
  }

  async function handleDelete(habit: Habit) {
    Alert.alert('Delete Habit', `Delete "${habit.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setHabits(prev => prev.filter(h => h.id !== habit.id));
        try { await deleteHabit(habit.id); } catch { load(); }
      }}
    ]);
  }

  async function handleCreate() {
    if (!habitTitle.trim()) return;
    setSaving(true);
    try {
      const res = await createHabit({ title: habitTitle.trim(), color: habitColor, target_per_week: parseInt(target) || 5 });
      setHabits(prev => [...prev, res.data]);
      setShowModal(false); setHabitTitle(''); setHabitColor('mint'); setTarget('5');
    } catch { Alert.alert('Error', 'Failed to create habit.'); } finally { setSaving(false); }
  }

  return (
    <View style={[S.screen, { backgroundColor: colors.bg }]}>
      {/* Day headers */}
      <View style={[styles.dayHeader, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
        <View style={{ width: 104 }} />
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={[styles.dayLabel, { color: colors.textSub }]}>{d}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        >
          {habits.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="refresh-circle-outline" size={32} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No habits yet</Text>
            </View>
          )}
          {habits.map(habit => {
            const count = days.filter(d => isLogged(habit.id, d)).length;
            const surfaceBg = colors[habit.color as HabitColor] ?? colors.card;
            return (
              <View key={String(habit.id)} style={[styles.habitRow, { backgroundColor: surfaceBg, borderColor: colors.border, shadowColor: colors.border }]}>
                <TouchableOpacity style={styles.habitMeta} onLongPress={() => handleDelete(habit)}>
                  <Text style={[styles.habitTitle, { color: colors.text }]} numberOfLines={2}>{habit.title}</Text>
                  <Text style={[styles.habitCount, { color: colors.textSub }]}>{count}/{habit.target_per_week}</Text>
                </TouchableOpacity>
                {days.map((day, i) => {
                  const logged = isLogged(habit.id, day);
                  const future = day > new Date();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dot, { borderColor: colors.border, backgroundColor: logged ? colors.border : colors.card }, future && { opacity: 0.3 }]}
                      onPress={() => !future && handleToggle(habit.id, day)}
                      disabled={future}
                    >
                      {logged && !future && <Ionicons name="checkmark" size={12} color={colors.bg} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          <Text style={[styles.hint, { color: colors.textSub }]}>Long press a habit to delete</Text>
        </ScrollView>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[S.h2, { color: colors.text }]}>New Habit</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Name</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 16 }]} placeholder="Habit name..." placeholderTextColor={colors.textSub} value={habitTitle} onChangeText={setHabitTitle} autoFocus />
          <Text style={[S.label, { color: colors.textSub, marginBottom: 8 }]}>Color</Text>
          <View style={[S.row, { gap: 10, marginBottom: 16 }]}>
            {COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: colors[c], borderColor: habitColor === c ? colors.red : colors.border, borderWidth: habitColor === c ? 3 : 2 }]} onPress={() => setHabitColor(c)}>
                {habitColor === c && <Ionicons name="checkmark" size={14} color={colors.text} />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Target per week</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 28 }]} placeholder="5" placeholderTextColor={colors.textSub} value={target} onChangeText={setTarget} keyboardType="number-pad" />
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={handleCreate} disabled={saving || !habitTitle.trim()}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Add Habit</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 2 },
  dayCell:    { flex: 1, alignItems: 'center' },
  dayLabel:   { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  list:       { padding: 10, gap: 8, paddingBottom: 90 },
  habitRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, gap: 3, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  habitMeta:  { width: 96, marginRight: 4 },
  habitTitle: { fontSize: 12, fontWeight: '700' },
  habitCount: { fontSize: 10, marginTop: 2 },
  dot:        { flex: 1, aspectRatio: 1, maxWidth: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  hint:       { textAlign: 'center', fontSize: 11, marginTop: 8 },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 32, borderWidth: 2, borderRadius: 10, padding: 16 },
  emptyText:  { fontSize: 15, fontWeight: '600' },
  modal:      { flex: 1, padding: 20, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  inp:        { borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15 },
  colorDot:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  createBtn:  { paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
