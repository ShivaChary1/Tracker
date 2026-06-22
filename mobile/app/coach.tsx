import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { S } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

const BASE_URL = 'https://tracker-odkl.onrender.com/api';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function CoachScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I'm your AI productivity coach. Ask me about goals, tasks, or habits. I can also break down goals into actionable steps!",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(`session_${Date.now()}`);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const placeholder: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, placeholder]);

      const res = await fetch(`${BASE_URL}/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message: text, session_id: sessionId.current, history: messages.slice(-10) }),
      });
      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: updated[updated.length - 1].content + json.content };
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { role: 'assistant', content: "Couldn't connect to the server. Please try again." };
        }
        return updated;
      });
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView
      style={[S.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.msgList}
        keyboardDismissMode="on-drag"
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' && styles.userBubble]}>
            {msg.role === 'assistant' && (
              <View style={[styles.botIcon, { backgroundColor: colors.text }]}>
                <Ionicons name="sparkles" size={13} color={colors.bg} />
              </View>
            )}
            <View style={[
              styles.bubbleInner,
              msg.role === 'user'
                ? { backgroundColor: colors.text, borderColor: colors.border }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
              {msg.content === '' && loading && i === messages.length - 1
                ? <ActivityIndicator size="small" color={colors.textSub} />
                : <Text style={[styles.bubbleText, { color: msg.role === 'user' ? colors.bg : colors.text }]}>{msg.content}</Text>
              }
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.textSub}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: !input.trim() || loading ? colors.textSub : colors.red, borderColor: colors.border }]}
          onPress={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  msgList:    { padding: 16, gap: 14, paddingBottom: 12 },
  bubble:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userBubble: { flexDirection: 'row-reverse' },
  botIcon:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleInner: { maxWidth: '80%', borderWidth: 2, borderRadius: 14, borderBottomLeftRadius: 2, padding: 12, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  bubbleText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 2 },
  textInput:  { flex: 1, borderWidth: 2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
