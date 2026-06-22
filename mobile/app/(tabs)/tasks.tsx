import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, RefreshControl, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getTasks, createTask, updateTask, deleteTask, type Task } from '@/lib/api';
import { toYMD } from '@/lib/dates';
import { scheduleTaskNotification, cancelTaskNotification } from '@/lib/notifications';

type Filter = 'all' | 'open' | 'done';
type Priority = 'low' | 'medium' | 'high';
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

function priorityBg(p: string) {
  if (p === 'high') return '#FFE4E4';
  if (p === 'medium') return '#FEF3C7';
  return '#D1FAE5';
}
function priorityFg(p: string) {
  if (p === 'high') return '#FF5E5E';
  if (p === 'medium') return '#F59E0B';
  return '#10B981';
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('open');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getTasks();
      setTasks(res.data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = tasks.filter(t =>
    filter === 'open' ? !t.completed : filter === 'done' ? t.completed : true
  );

  async function handleToggle(task: Task) {
    const next = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: next } : t));
    try {
      await updateTask(task.id, { completed: next });
      if (next) await cancelTaskNotification(task.id);
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !next } : t));
    }
  }

  async function handleDelete(task: Task) {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setTasks(prev => prev.filter(t => t.id !== task.id));
          try { await deleteTask(task.id); await cancelTaskNotification(task.id); } catch { load(); }
        }
      }
    ]);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await createTask({ title: title.trim(), priority, due_date: dueDate ? toYMD(dueDate) : undefined });
      const newTask: Task = res.data;
      setTasks(prev => [newTask, ...prev]);
      if (dueDate) await scheduleTaskNotification(newTask.id, newTask.title, toYMD(dueDate));
      setShowModal(false);
      setTitle(''); setPriority('medium'); setDueDate(null);
    } catch { Alert.alert('Error', 'Failed to create task.'); } finally { setSaving(false); }
  }

  const FILTERS: Filter[] = ['all', 'open', 'done'];

  return (
    <View style={[S.screen, { backgroundColor: colors.bg }]}>
      {/* Filter row */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { borderBottomColor: colors.red }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterLabel, { color: filter === f ? colors.red : colors.textSub }]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        >
          {filtered.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="clipboard-outline" size={32} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No tasks here</Text>
            </View>
          )}
          {filtered.map(task => (
            <View key={String(task.id)} style={[
              styles.taskCard,
              { backgroundColor: task.completed ? colors.grayLight : colors.card, borderColor: colors.border, shadowColor: colors.border },
              task.completed && { opacity: 0.65 },
            ]}>
              <TouchableOpacity onPress={() => handleToggle(task)} style={{ padding: 2 }}>
                {task.completed
                  ? <Ionicons name="checkmark-circle" size={24} color={colors.green} />
                  : <Ionicons name="ellipse-outline" size={24} color={colors.textSub} />
                }
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, { color: colors.text }, task.completed && { textDecorationLine: 'line-through', color: colors.textSub }]} numberOfLines={2}>
                  {task.title}
                </Text>
                <View style={S.row}>
                  <View style={[styles.badge, { backgroundColor: priorityBg(task.priority) }]}>
                    <Text style={[styles.badgeText, { color: priorityFg(task.priority) }]}>{task.priority}</Text>
                  </View>
                  {task.due_date ? <Text style={[styles.dueText, { color: colors.textSub }]}>{task.due_date}</Text> : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(task)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={18} color={colors.textSub} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[S.h2, { color: colors.text }]}>New Task</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 16 }]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.textSub}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <Text style={[S.label, { color: colors.textSub, marginBottom: 8 }]}>Priority</Text>
          <View style={[S.row, { gap: 8, marginBottom: 16 }]}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityBtn, { borderColor: colors.border, backgroundColor: priority === p ? priorityBg(p) : colors.card }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityBtnText, { color: priority === p ? priorityFg(p) : colors.textSub }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[S.label, { color: colors.textSub, marginBottom: 8 }]}>Due Date (optional)</Text>
          <TouchableOpacity
            style={[S.row, styles.input, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 28 }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textSub} style={{ marginRight: 8 }} />
            <Text style={{ color: dueDate ? colors.text : colors.textSub, flex: 1 }}>
              {dueDate ? toYMD(dueDate) : 'Select date'}
            </Text>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(null)}>
                <Ionicons name="close-circle" size={16} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setDueDate(date); }}
            />
          )}

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]}
            onPress={handleCreate}
            disabled={saving || !title.trim()}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Add Task</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow:  { flexDirection: 'row', borderBottomWidth: 2 },
  filterTab:  { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  filterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  list:       { padding: 16, gap: 10, paddingBottom: 90 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderRadius: 8, padding: 12,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  taskTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  badge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
  badgeText:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dueText:    { fontSize: 11 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 32, borderWidth: 2, borderRadius: 10, padding: 16 },
  emptyText:  { fontSize: 15, fontWeight: '600' },
  modal:      { flex: 1, padding: 20, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  input:      { borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderWidth: 2, borderRadius: 6, alignItems: 'center' },
  priorityBtnText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  createBtn: {
    paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
