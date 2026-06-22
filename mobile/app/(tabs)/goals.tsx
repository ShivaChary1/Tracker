import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getGoals, createGoal, updateGoal, deleteGoal, type Goal } from '@/lib/api';
import { currentWeekStart, getMondayOf, addDays, toYMD, MONTH_NAMES } from '@/lib/dates';

function weekLabel(monday: Date) {
  const sun = addDays(monday, 6);
  const m1 = MONTH_NAMES[monday.getMonth()].slice(0, 3);
  const m2 = MONTH_NAMES[sun.getMonth()].slice(0, 3);
  return m1 === m2
    ? `${m1} ${monday.getDate()}–${sun.getDate()}`
    : `${m1} ${monday.getDate()} – ${m2} ${sun.getDate()}`;
}

export default function GoalsScreen() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('1');
  const [saving, setSaving] = useState(false);

  const monday = addDays(getMondayOf(new Date()), weekOffset * 7);
  const weekStart = toYMD(monday);

  const load = useCallback(async () => {
    try {
      const res = await getGoals(weekStart);
      setGoals(res.data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleToggle(goal: Goal) {
    const next = goal.status === 'completed' ? 'active' : 'completed';
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: next } : g));
    try { await updateGoal(goal.id, { status: next }); } catch { load(); }
  }

  async function handleDelete(goal: Goal) {
    Alert.alert('Delete Goal', `Delete "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setGoals(prev => prev.filter(g => g.id !== goal.id));
        try { await deleteGoal(goal.id); } catch { load(); }
      }}
    ]);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await createGoal({ title: title.trim(), description: description.trim() || undefined, week_start: weekStart, target_value: parseInt(target) || 1 });
      setGoals(prev => [res.data, ...prev]);
      setShowModal(false); setTitle(''); setDescription(''); setTarget('1');
    } catch { Alert.alert('Error', 'Failed to create goal.'); } finally { setSaving(false); }
  }

  const progress = goals.length > 0
    ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0;

  const navBtnStyle = [styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }];

  return (
    <View style={[S.screen, { backgroundColor: colors.bg }]}>
      {/* Week nav */}
      <View style={[styles.weekNav, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={navBtnStyle} onPress={() => setWeekOffset(w => w - 1)}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.weekLabel, { color: colors.text }]}>{weekLabel(monday)}</Text>
          {weekOffset === 0 && <Text style={[S.label, { color: colors.red }]}>THIS WEEK</Text>}
        </View>
        <TouchableOpacity style={navBtnStyle} onPress={() => setWeekOffset(w => w + 1)}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {goals.length > 0 && (
        <View style={styles.progressWrap}>
          <View style={S.between}>
            <Text style={[S.label, { color: colors.textSub }]}>Weekly Progress</Text>
            <Text style={[styles.progressPct, { color: colors.text }]}>{progress}%</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
            <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.green }]} />
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        >
          {goals.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="flag-outline" size={32} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No goals this week</Text>
            </View>
          )}
          {goals.map(goal => (
            <View key={String(goal.id)} style={[
              styles.goalCard,
              { backgroundColor: goal.status === 'completed' ? colors.grayLight : colors.card, borderColor: colors.border, shadowColor: colors.border },
              goal.status === 'completed' && { opacity: 0.65 },
            ]}>
              <TouchableOpacity onPress={() => handleToggle(goal)} style={{ paddingTop: 2 }}>
                {goal.status === 'completed'
                  ? <Ionicons name="checkmark-circle" size={26} color={colors.green} />
                  : <Ionicons name="ellipse-outline" size={26} color={colors.textSub} />
                }
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: colors.text }, goal.status === 'completed' && { textDecorationLine: 'line-through', color: colors.textSub }]}>
                  {goal.title}
                </Text>
                {goal.description ? <Text style={[styles.goalDesc, { color: colors.textSub }]} numberOfLines={2}>{goal.description}</Text> : null}
                <View style={styles.progRow}>
                  <View style={[styles.track, { flex: 1, height: 6, borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                    <View style={[styles.fill, { width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%`, backgroundColor: colors.blue }]} />
                  </View>
                  <Text style={[styles.goalCount, { color: colors.textSub }]}>{goal.current_value}/{goal.target_value}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(goal)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={18} color={colors.textSub} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[S.h2, { color: colors.text }]}>New Goal</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Title</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 14 }]} placeholder="Goal title..." placeholderTextColor={colors.textSub} value={title} onChangeText={setTitle} autoFocus />
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Description</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 14, height: 80, textAlignVertical: 'top' }]} placeholder="Optional..." placeholderTextColor={colors.textSub} value={description} onChangeText={setDescription} multiline />
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Target Value</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 28 }]} placeholder="1" placeholderTextColor={colors.textSub} value={target} onChangeText={setTarget} keyboardType="number-pad" />
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={handleCreate} disabled={saving || !title.trim()}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Add Goal</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  weekNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 2 },
  navBtn:     { width: 36, height: 36, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  weekLabel:  { fontSize: 16, fontWeight: '800' },
  progressWrap: { padding: 16, paddingBottom: 4 },
  progressPct: { fontSize: 15, fontWeight: '800' },
  track:      { height: 10, borderRadius: 5, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 5 },
  list:       { padding: 16, gap: 10, paddingBottom: 90 },
  goalCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 2, borderRadius: 8, padding: 12, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  goalTitle:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  goalDesc:   { fontSize: 12, marginBottom: 6 },
  progRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalCount:  { fontSize: 11, fontWeight: '700' },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 32, borderWidth: 2, borderRadius: 10, padding: 16 },
  emptyText:  { fontSize: 15, fontWeight: '600' },
  modal:      { flex: 1, padding: 20, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  inp:        { borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15 },
  createBtn:  { paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
