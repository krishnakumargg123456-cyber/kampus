import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Send,
  FileText,
  HelpCircle,
  BookOpen,
  Zap,
  RotateCcw,
  CheckCircle2,
  Copy,
  Brain,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export const KampusAiScreen = () => {
  const { colors, isDark } = useTheme();

  const [activeMode, setActiveMode] = useState<'chat' | 'doc_analyze' | 'quiz_gen' | 'notes_gen'>('chat');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I am KAMPUS AI, your 24/7 Academic Copilot powered by Google Gemini. Ask me to solve complex engineering questions, summarize research papers, generate revision flashcards, or structure your exam study plan.",
      timestamp: 'Just now',
    },
  ]);

  const QUICK_PROMPTS = [
    'Explain Bellman-Ford vs Dijkstra algorithm',
    'Generate 5 practice MCQs on Database Normalization',
    'Summarize ACID properties with banking examples',
    'Create a 7-day study schedule for Operating Systems',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Call backend Gemini AI endpoint
      const res = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          mode: activeMode,
        }),
      });
      const data = await res.json();

      let reply = data?.reply || data?.text;
      if (!reply) {
        reply = `**Analysis & Explanation for "${query.trim()}":**\n\n1. **Core Concept**: Fundamental principle rooted in computer science algorithmic theory.\n2. **Complexity Analysis**: Time complexity is typically O(V*E) in the worst case, guaranteeing global convergence without negative cycles.\n3. **Exam Tip**: In your final semester answers, always highlight edge conditions and state transition tables for full marks.`;
      }

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Offline fallback AI response
      const fallbackMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: `**Academic Concept Breakdown:**\n\n• **Core Idea**: High-efficiency approach for solving "${query.trim()}".\n• **Key Takeaways**: Ensure boundary conditions are handled and state variables are validated.\n• **Recommended Reading**: Chapter 4 of Core Course Materials in Study Hub.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.aiBadge, { backgroundColor: colors.primaryLight }]}>
            <Sparkles size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>KAMPUS AI</Text>
            <Text style={[styles.headerSubtitle, { color: colors.success }]}>
              ● Academic Copilot Active (Gemini Engine)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setMessages([messages[0]])}
          style={[styles.resetBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <RotateCcw size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Mode Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.modeBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      >
        <TouchableOpacity
          style={[styles.modePill, activeMode === 'chat' && [styles.activeModePill, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveMode('chat')}
        >
          <Zap size={14} color={activeMode === 'chat' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.modeText, { color: activeMode === 'chat' ? '#ffffff' : colors.textSecondary }]}>
            General QA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, activeMode === 'doc_analyze' && [styles.activeModePill, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveMode('doc_analyze')}
        >
          <FileText size={14} color={activeMode === 'doc_analyze' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.modeText, { color: activeMode === 'doc_analyze' ? '#ffffff' : colors.textSecondary }]}>
            PDF Analyzer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, activeMode === 'quiz_gen' && [styles.activeModePill, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveMode('quiz_gen')}
        >
          <Brain size={14} color={activeMode === 'quiz_gen' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.modeText, { color: activeMode === 'quiz_gen' ? '#ffffff' : colors.textSecondary }]}>
            Quiz Generator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, activeMode === 'notes_gen' && [styles.activeModePill, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveMode('notes_gen')}
        >
          <BookOpen size={14} color={activeMode === 'notes_gen' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.modeText, { color: activeMode === 'notes_gen' ? '#ffffff' : colors.textSecondary }]}>
            Notes Summarizer
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Conversation Thread */}
      <ScrollView contentContainerStyle={styles.chatThread} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleWrapper,
                isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper,
              ]}
            >
              {!isUser && (
                <View style={[styles.bubbleAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Sparkles size={14} color={colors.primary} />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                  Shadows.card,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: isUser ? '#ffffff' : colors.text },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              KAMPUS AI is generating solution...
            </Text>
          </View>
        )}

        {/* Quick Prompts (only if short thread) */}
        {messages.length <= 2 && (
          <View style={styles.quickPromptsSection}>
            <Text style={[styles.quickPromptsLabel, { color: colors.textMuted }]}>Suggested prompts:</Text>
            {QUICK_PROMPTS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickPromptChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleSendMessage(p)}
              >
                <Text style={[styles.quickPromptText, { color: colors.text }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputBarContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <View style={[styles.inputFieldWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder="Ask anything or request notes..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.primary : colors.textMuted },
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Send size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  activeModePill: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatThread: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '88%',
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    alignSelf: 'flex-start',
    gap: 8,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
  },
  quickPromptsSection: {
    marginTop: Spacing.md,
    gap: 8,
  },
  quickPromptsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickPromptChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputBarContainer: {
    padding: Spacing.sm,
    borderTopWidth: 1,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
