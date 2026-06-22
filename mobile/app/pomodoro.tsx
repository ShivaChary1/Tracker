import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { logPomodoro } from '@/lib/api';
import { schedulePomodoroNotification } from '@/lib/notifications';

type Mode = 'focus' | 'short' | 'long';
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const MODE_LABELS: Record<Mode, string> = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function PomodoroScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('focus');
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modeColor: Record<Mode, string> = {
    focus: colors.red, short: colors.green, long: colors.blue,
  };

  useEffect(() => {
    setSeconds(DURATIONS[mode]);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); handleComplete(); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  async function handleComplete() {
    if (mode === 'focus') {
      setSessions(s => s + 1);
      try { await logPomodoro({ duration_minutes: 25, label: 'Focus Session' }); await schedulePomodoroNotification('Focus Session'); } catch { /* silent */ }
      Alert.alert('🎉 Focus Complete!', 'Great work! Take a break.', [
        { text: 'Short Break', onPress: () => setMode('short') },
        { text: 'Long Break', onPress: () => setMode('long') },
        { text: 'Keep Going', style: 'cancel', onPress: () => setSeconds(DURATIONS.focus) },
      ]);
    } else {
      Alert.alert('Break Over!', 'Ready to focus again?', [
        { text: 'Start Focus', onPress: () => setMode('focus') },
        { text: 'Not Yet', style: 'cancel', onPress: () => setSeconds(DURATIONS[mode]) },
      ]);
    }
  }

  const total = DURATIONS[mode];
  const progress = (total - seconds) / total;
  const accent = modeColor[mode];
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const modeCards = [
    { key: 'focus' as Mode, label: 'Focus', duration: '25 min', bg: colors.peach },
    { key: 'short' as Mode, label: 'Short', duration: '5 min', bg: colors.mint },
    { key: 'long' as Mode, label: 'Long', duration: '15 min', bg: colors.sky },
  ];

  return (
    <ScrollView style={[S.screen, { backgroundColor: colors.bg }]} contentContainerStyle={styles.container}>
      {/* Mode selector */}
      <View style={styles.modeRow}>
        {modeCards.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeTab, { borderColor: colors.border, backgroundColor: mode === m.key ? modeColor[m.key] : colors.card }]}
            onPress={() => setMode(m.key)}
          >
            <Text style={[styles.modeLabel, { color: mode === m.key ? '#fff' : colors.textSub }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer ring */}
      <View style={[styles.ring, { borderColor: accent, backgroundColor: colors.card, shadowColor: colors.border }]}>
        <Text style={[S.label, { color: accent, marginBottom: 4 }]}>{MODE_LABELS[mode].toUpperCase()}</Text>
        <Text style={[styles.timerText, { color: colors.text }]}>{pad(mins)}:{pad(secs)}</Text>
        <Text style={[styles.sessionCount, { color: colors.textSub }]}>{sessions} sessions today</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => { setRunning(false); setSeconds(DURATIONS[mode]); }}>
          <Ionicons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: accent, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => setRunning(r => !r)}>
          <Ionicons name={running ? 'pause' : 'play'} size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]} onPress={() => { setRunning(false); handleComplete(); }}>
          <Ionicons name="play-skip-forward" size={22} color={colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* Info cards */}
      <View style={styles.infoRow}>
        {modeCards.map(m => (
          <View key={m.key} style={[styles.infoCard, { backgroundColor: m.bg, borderColor: colors.border, shadowColor: colors.border }]}>
            <Text style={[S.label, { color: colors.textSub }]}>{m.label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{m.duration}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 16, alignItems: 'center', paddingBottom: 40 },
  modeRow:       { flexDirection: 'row', gap: 8, marginBottom: 32, width: '100%' },
  modeTab:       { flex: 1, paddingVertical: 9, borderWidth: 2, borderRadius: 8, alignItems: 'center' },
  modeLabel:     { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  ring:          { width: 240, height: 240, borderRadius: 120, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
  timerText:     { fontSize: 58, fontWeight: '900', letterSpacing: -2, marginVertical: 4 },
  sessionCount:  { fontSize: 12, fontWeight: '600' },
  progressTrack: { width: '100%', height: 10, borderRadius: 5, borderWidth: 1, overflow: 'hidden', marginBottom: 32 },
  progressFill:  { height: '100%', borderRadius: 5 },
  controls:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  ctrlBtn:       { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  playBtn:       { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  infoRow:       { flexDirection: 'row', gap: 12, width: '100%' },
  infoCard:      { flex: 1, borderWidth: 2, borderRadius: 8, padding: 12, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  infoValue:     { fontSize: 20, fontWeight: '900', marginTop: 4 },
});
