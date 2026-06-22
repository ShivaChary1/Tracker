import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getNotes, createNote, deleteNote, type Note } from '@/lib/api';

type NoteColor = 'white' | 'mint' | 'peach' | 'lavender' | 'sky';
const NOTE_COLORS: NoteColor[] = ['white', 'mint', 'peach', 'lavender', 'sky'];

export default function NotesScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState<NoteColor>('white');
  const [saving, setSaving] = useState(false);

  const noteBg = (c: NoteColor) => c === 'white' ? colors.card : colors[c as 'mint' | 'peach' | 'lavender' | 'sky'];

  const load = useCallback(async () => {
    try { const res = await getNotes(); setNotes(res.data ?? []); }
    catch { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  async function handleDelete(note: Note) {
    Alert.alert('Delete Note', `Delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setNotes(prev => prev.filter(n => n.id !== note.id));
        try { await deleteNote(note.id); } catch { load(); }
      }}
    ]);
  }

  async function handleCreate() {
    if (!noteTitle.trim()) return;
    setSaving(true);
    try {
      const res = await createNote({ title: noteTitle.trim(), content: noteContent.trim(), color: noteColor });
      setNotes(prev => [res.data, ...prev]);
      setShowModal(false); setNoteTitle(''); setNoteContent(''); setNoteColor('white');
    } catch { Alert.alert('Error', 'Failed to save note.'); } finally { setSaving(false); }
  }

  return (
    <View style={[S.screen, { backgroundColor: colors.bg }]}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        >
          {notes.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={40} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>No notes yet</Text>
              <Text style={[styles.emptyHint, { color: colors.textSub }]}>Tap + to add one</Text>
            </View>
          )}
          {notes.map(note => (
            <TouchableOpacity
              key={String(note.id)}
              style={[styles.noteCard, { backgroundColor: noteBg(note.color as NoteColor), borderColor: colors.border, shadowColor: colors.border }]}
              onLongPress={() => handleDelete(note)}
              activeOpacity={0.85}
            >
              <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={2}>{note.title}</Text>
              <Text style={[styles.noteContent, { color: colors.textSub }]} numberOfLines={5}>{note.content}</Text>
              {note.tags && note.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {note.tags.slice(0, 3).map((tag, i) => (
                    <View key={i} style={[styles.tag, { backgroundColor: `${colors.border}18` }]}>
                      <Text style={[styles.tagText, { color: colors.text }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      {notes.length > 0 && (
        <Text style={[styles.hint, { color: colors.textSub }]}>Long press to delete</Text>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[S.h2, { color: colors.text }]}>New Note</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Title</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 14 }]} placeholder="Note title..." placeholderTextColor={colors.textSub} value={noteTitle} onChangeText={setNoteTitle} autoFocus />
          <Text style={[S.label, { color: colors.textSub, marginBottom: 6 }]}>Content</Text>
          <TextInput style={[styles.inp, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 14, height: 120, textAlignVertical: 'top' }]} placeholder="Write your note..." placeholderTextColor={colors.textSub} value={noteContent} onChangeText={setNoteContent} multiline />
          <Text style={[S.label, { color: colors.textSub, marginBottom: 8 }]}>Color</Text>
          <View style={[S.row, { gap: 10, marginBottom: 28 }]}>
            {NOTE_COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: noteBg(c), borderColor: noteColor === c ? colors.red : colors.border, borderWidth: noteColor === c ? 3 : 2 }]} onPress={() => setNoteColor(c)}>
                {noteColor === c && <Ionicons name="checkmark" size={14} color={colors.text} />}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.red, borderColor: colors.border, shadowColor: colors.border }]} onPress={handleCreate} disabled={saving || !noteTitle.trim()}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Save Note</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  grid:       { padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 90 },
  noteCard:   { width: '47%', borderWidth: 2, borderRadius: 10, padding: 12, minHeight: 110, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  noteTitle:  { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  noteContent: { fontSize: 12, lineHeight: 17 },
  tagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tag:        { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagText:    { fontSize: 10, fontWeight: '600' },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  hint:       { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 11 },
  emptyWrap:  { flex: 1, width: '100%', alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:  { fontSize: 15, fontWeight: '600' },
  emptyHint:  { fontSize: 13 },
  modal:      { flex: 1, padding: 20, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  inp:        { borderWidth: 2, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15 },
  colorDot:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  createBtn:  { paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
