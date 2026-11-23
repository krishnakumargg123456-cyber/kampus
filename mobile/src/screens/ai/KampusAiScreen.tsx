import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  StatusBar as RNStatusBar,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  Sparkles,
  Send,
  FileText,
  Plus,
  Clock,
  History,
  Globe,
  BookOpen,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Paperclip,
  X,
  ArrowLeft,
  Search,
  CheckCircle2,
  Code,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Compass,
  Square,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  kampusAiApi,
  AiChatMessage,
  AiConversation,
  AiAttachmentItem,
  AiCitation,
  AiServiceStatus,
} from '../../services/kampusAiApi';

export const KampusAiScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();

  // Active Workspace State
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [recentConversations, setRecentConversations] = useState<AiConversation[]>([]);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);

  // Composer State
  const [inputText, setInputText] = useState('');
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AiAttachmentItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI & History Modals
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const isCancelledRef = useRef(false);

  // Load Status & Initial Conversations
  const refreshAiWorkspace = useCallback(async () => {
    try {
      const [statusData, convs] = await Promise.all([
        kampusAiApi.getStatus(token, user?.userId),
        kampusAiApi.getConversations(token, user?.userId),
      ]);
      setAiStatus(statusData);
      setRecentConversations(convs);
    } catch (err) {
      console.warn('[KAMPUS AI] Refresh failed:', err);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    refreshAiWorkspace();
  }, [refreshAiWorkspace]);

  // Load an existing conversation
  const handleSelectConversation = async (conv: AiConversation) => {
    try {
      setHistoryModalVisible(false);
      setIsGenerating(true);
      const data = await kampusAiApi.getConversation(conv.id, token, user?.userId);
      setActiveConversation(data.conversation);
      setMessages(data.messages);
      setIsStudyMode(data.conversation.mode === 'study');
      setIsWebSearch(data.conversation.webSearchEnabled);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load conversation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start fresh conversation
  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setInputText('');
    setAttachedFiles([]);
    setIsGenerating(false);
  };

  // Delete Conversation
  const handleDeleteConversation = async (convId: string) => {
    Alert.alert('Delete Conversation', 'Are you sure you want to delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await kampusAiApi.deleteConversation(convId, token, user?.userId);
            setRecentConversations((prev) => prev.filter((c) => c.id !== convId));
            if (activeConversation?.id === convId) {
              handleNewChat();
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete conversation.');
          }
        },
      },
    ]);
  };

  // File Attachment Picker
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingFile(true);

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const extracted = await kampusAiApi.extractDocument(
            base64Data,
            asset.name,
            asset.mimeType,
            token,
            user?.userId
          );

          setAttachedFiles((prev) => [...prev, extracted]);
        } catch (uploadErr: any) {
          Alert.alert('Document Error', uploadErr.message || 'Could not process document.');
        } finally {
          setIsUploadingFile(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsUploadingFile(false);
      Alert.alert('Error', err.message || 'Could not attach file.');
    }
  };

  // Send Prompt to AI Engine
  const handleSendPrompt = async (forcedText?: string) => {
    const textToSend = (forcedText || inputText).trim();
    if (!textToSend || isGenerating) return;

    isCancelledRef.current = false;
    setInputText('');
    const currentAttachments = [...attachedFiles];
    setAttachedFiles([]);

    const userMessageId = 'u_' + Date.now();
    const newUserMsg: AiChatMessage = {
      id: userMessageId,
      conversationId: activeConversation?.id || 'pending',
      role: 'user',
      content: textToSend,
      mode: isStudyMode ? 'study' : 'normal',
      webSearch: isWebSearch,
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsGenerating(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await kampusAiApi.sendMessage(
        {
          conversationId: activeConversation?.id,
          message: textToSend,
          mode: isStudyMode ? 'study' : 'normal',
          webSearch: isWebSearch,
          attachments: currentAttachments,
          studentContext: user?.college ? `${user.college} - ${user.course}` : undefined,
        },
        token,
        user?.userId
      );

      if (isCancelledRef.current) return;

      // Update active conversation reference
      if (!activeConversation) {
        const freshConv: AiConversation = {
          id: response.conversationId,
          userId: user?.userId || 'guest',
          title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
          mode: isStudyMode ? 'study' : 'normal',
          webSearchEnabled: isWebSearch,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 2,
        };
        setActiveConversation(freshConv);
        setRecentConversations((prev) => [freshConv, ...prev.filter((c) => c.id !== freshConv.id)]);
      }

      setMessages((prev) => [...prev, response.message]);
      refreshAiWorkspace();
    } catch (err: any) {
      if (isCancelledRef.current) return;
      const errorMsg: AiChatMessage = {
        id: 'err_' + Date.now(),
        conversationId: activeConversation?.id || 'error',
        role: 'assistant',
        content: `**Request Notice**: ${err.message || 'Unable to complete AI generation. Please retry.'}`,
        provider: 'system',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleStopGeneration = () => {
    isCancelledRef.current = true;
    setIsGenerating(false);
  };

  const handleFeedback = async (msgId: string, rating: 'up' | 'down') => {
    await kampusAiApi.submitFeedback(msgId, rating, undefined, token, user?.userId);
    Alert.alert('Thank you', 'Your feedback helps improve KAMPUS AI.');
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    setCopyFeedbackId(msgId);
    setTimeout(() => setCopyFeedbackId(null), 2000);
    Alert.alert('Copied', 'AI response text copied to clipboard.');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const studentName = user?.fullName ? user.fullName.split(' ')[0] : 'Scholar';

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  const safeTopPadding = Platform.OS === 'ios'
    ? Math.max(insets.top, 44)
    : Math.max(insets.top, statusBarHeight, 38) + 8;

  const SUGGESTED_PROMPTS = [
    {
      id: 'p1',
      title: 'Explain a difficult concept',
      desc: 'Get an intuitive, step-by-step breakdown with analogies',
      prompt: 'Explain how the Attention Mechanism works in Transformers with an intuitive student analogy.',
      icon: Lightbulb,
      mode: 'study',
    },
    {
      id: 'p2',
      title: 'Help me understand code',
      desc: 'Debug, explain complexity & optimize algorithms',
      prompt: 'Explain Dijkstra algorithm in Python, its time complexity, and when it fails on negative cycles.',
      icon: Code,
      mode: 'study',
    },
    {
      id: 'p3',
      title: 'Summarize a document',
      desc: 'Attach notes or lecture slides for instant takeaways',
      prompt: 'Summarize the core exam takeaways and key definitions from this study document.',
      icon: FileText,
      mode: 'normal',
    },
    {
      id: 'p4',
      title: 'Research a current topic',
      desc: 'Verify recent syllabus updates & technical breakthroughs',
      prompt: 'What are the most significant developments in quantum computing and AI hardware this year?',
      icon: Globe,
      mode: 'normal',
      webSearch: true,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor="#070d1e" translucent={true} />

      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: safeTopPadding,
            backgroundColor: '#070d1e',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {activeConversation ? (
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={handleNewChat}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#f8fafc" />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandIconBox}>
              <Sparkles size={18} color="#38bdf8" />
            </View>
          )}

          <View style={styles.headerTitleGroup}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitleText}>
                {activeConversation ? activeConversation.title : 'KAMPUS AI'}
              </Text>
              {aiStatus?.providers.openai.configured && (
                <View style={styles.activeModelBadge}>
                  <Text style={styles.activeModelText}>GPT-4o Mini</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitleText} numberOfLines={1}>
              {activeConversation
                ? `${messages.length} messages • ${activeConversation.mode === 'study' ? 'Study Mode' : 'General Workspace'}`
                : 'Your intelligent learning workspace'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setHistoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <History size={20} color="#f8fafc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Workspace Body */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!activeConversation && messages.length === 0 ? (
          // ==========================================
          // 1. HOME WORKSPACE VIEW
          // ==========================================
          <View style={styles.homeContainer}>
            {/* Greeting Hero */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeAccentDot} />
              <Text style={styles.welcomeGreeting}>
                {getGreeting()}, <Text style={styles.welcomeStudentName}>{studentName}</Text>
              </Text>
              <Text style={styles.welcomePromptTitle}>What would you like to explore today?</Text>
            </View>

            {/* 4 Interactive Suggested Prompts */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUGGESTED WORKFLOWS</Text>
            <View style={styles.promptsGrid}>
              {SUGGESTED_PROMPTS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.promptCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      if (item.mode === 'study') setIsStudyMode(true);
                      if (item.webSearch) setIsWebSearch(true);
                      handleSendPrompt(item.prompt);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.promptIconRow}>
                      <View style={[styles.promptIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                        <IconComponent size={18} color="#38bdf8" />
                      </View>
                      {item.mode === 'study' && (
                        <View style={styles.modeTagPill}>
                          <Text style={styles.modeTagText}>Study Mode</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.promptCardTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.promptCardDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recent Conversation History List */}
            {recentConversations.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                    RECENT SESSIONS
                  </Text>
                  <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.recentCardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {recentConversations.slice(0, 4).map((c, idx) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.recentRow,
                        idx < Math.min(recentConversations.length, 4) - 1 && [
                          styles.recentBorder,
                          { borderBottomColor: colors.borderLight },
                        ],
                      ]}
                      onPress={() => handleSelectConversation(c)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.recentIconBox, { backgroundColor: colors.surfaceElevated }]}>
                        {c.mode === 'study' ? (
                          <BookOpen size={16} color="#818cf8" />
                        ) : (
                          <Sparkles size={16} color="#38bdf8" />
                        )}
                      </View>
                      <View style={styles.recentTexts}>
                        <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                          {c.title}
                        </Text>
                        <Text style={[styles.recentSub, { color: colors.textMuted }]}>
                          {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {c.messageCount} messages
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          // ==========================================
          // 2. ACTIVE CHAT WORKSPACE VIEW
          // ==========================================
          <View style={styles.chatContainer}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
                  ]}
                >
                  {/* User Bubble */}
                  {isUser ? (
                    <View style={styles.userBubble}>
                      {/* Attached Documents if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <View style={styles.bubbleAttachmentsRow}>
                          {msg.attachments.map((att, aIdx) => (
                            <View key={aIdx} style={styles.attachmentChip}>
                              <FileText size={12} color="#38bdf8" />
                              <Text style={styles.attachmentChipText} numberOfLines={1}>
                                {att.fileName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <Text style={styles.userMessageText}>{msg.content}</Text>
                    </View>
                  ) : (
                    // AI Response Card
                    <View style={[styles.aiResponseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {/* Provider & Model Badge */}
                      <View style={styles.aiCardHeader}>
                        <View style={styles.aiBadgeRow}>
                          <Sparkles size={14} color="#38bdf8" />
                          <Text style={styles.aiBadgeText}>
                            {msg.model || 'KAMPUS AI'}
                          </Text>
                          {msg.fallbackUsed && (
                            <View style={styles.fallbackPill}>
                              <Text style={styles.fallbackPillText}>Fallback Active</Text>
                            </View>
                          )}
                          {msg.mode === 'study' && (
                            <View style={[styles.fallbackPill, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
                              <Text style={[styles.fallbackPillText, { color: '#818cf8' }]}>Study Mode</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.aiActionsRow}>
                          <TouchableOpacity
                            onPress={() => handleCopyMessage(msg.id, msg.content)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Copy size={15} color={copyFeedbackId === msg.id ? '#10b981' : colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleFeedback(msg.id, 'up')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <ThumbsUp size={15} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* AI Content Text */}
                      <Text style={[styles.aiMessageText, { color: colors.text }]}>{msg.content}</Text>

                      {/* Clickable Citations Section if Live Search returned sources */}
                      {msg.citations && msg.citations.length > 0 && (
                        <View style={styles.citationsSection}>
                          <View style={styles.citationsHeaderRow}>
                            <Globe size={13} color="#38bdf8" />
                            <Text style={styles.citationsHeaderTitle}>Verified Web Sources</Text>
                          </View>
                          <View style={styles.citationsGrid}>
                            {msg.citations.map((cit) => (
                              <TouchableOpacity
                                key={cit.id}
                                style={[styles.citationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                                onPress={() => Linking.openURL(cit.url)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.citationDomain, { color: colors.primary }]}>{cit.domain}</Text>
                                <Text style={[styles.citationTitle, { color: colors.text }]} numberOfLines={1}>
                                  {cit.title}
                                </Text>
                                <ExternalLink size={12} color={colors.textMuted} style={styles.citationIcon} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Generating Loading State */}
            {isGenerating && (
              <View style={[styles.aiThinkingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.thinkingHeader}>
                  <ActivityIndicator size="small" color="#38bdf8" />
                  <Text style={[styles.thinkingText, { color: colors.textMuted }]}>
                    {isWebSearch ? 'Searching web & reasoning...' : 'Analyzing & formulating answer...'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.stopButton} onPress={handleStopGeneration} activeOpacity={0.7}>
                  <Square size={13} color="#ef4444" />
                  <Text style={styles.stopButtonText}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating / Anchored Message Composer */}
      <View
        style={[
          styles.composerContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: '#070d1e',
            borderTopColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        {/* Attachment Preview Chips */}
        {attachedFiles.length > 0 && (
          <View style={styles.composerAttachmentsRow}>
            {attachedFiles.map((att, idx) => (
              <View key={idx} style={[styles.composerAttChip, { backgroundColor: colors.surfaceElevated }]}>
                <FileText size={13} color="#38bdf8" />
                <Text style={[styles.composerAttChipText, { color: colors.text }]} numberOfLines={1}>
                  {att.fileName}
                </Text>
                <TouchableOpacity
                  onPress={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={13} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Feature Switches Bar (Web Search & Study Mode) */}
        <View style={styles.featureTogglesBar}>
          {/* Web Search Toggle */}
          <TouchableOpacity
            style={[
              styles.togglePill,
              isWebSearch && styles.togglePillActiveWeb,
            ]}
            onPress={() => setIsWebSearch(!isWebSearch)}
            activeOpacity={0.7}
          >
            <Globe size={13} color={isWebSearch ? '#38bdf8' : '#94a3b8'} />
            <Text style={[styles.togglePillText, isWebSearch && { color: '#38bdf8', fontWeight: '700' }]}>
              Web Search
            </Text>
          </TouchableOpacity>

          {/* Study Mode Toggle */}
          <TouchableOpacity
            style={[
              styles.togglePill,
              isStudyMode && styles.togglePillActiveStudy,
            ]}
            onPress={() => setIsStudyMode(!isStudyMode)}
            activeOpacity={0.7}
          >
            <BookOpen size={13} color={isStudyMode ? '#818cf8' : '#94a3b8'} />
            <Text style={[styles.togglePillText, isStudyMode && { color: '#818cf8', fontWeight: '700' }]}>
              Study Mode
            </Text>
          </TouchableOpacity>

          {/* Attach Document Button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickDocument}
            disabled={isUploadingFile}
            activeOpacity={0.7}
          >
            {isUploadingFile ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <>
                <Paperclip size={13} color="#94a3b8" />
                <Text style={styles.attachBtnText}>Attach</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Text Input Row */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text, maxHeight: 100 }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              isStudyMode
                ? 'Ask an academic question or concept to explain...'
                : 'Ask KAMPUS AI anything...'
            }
            placeholderTextColor="#64748b"
            multiline={true}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendPrompt()}
            disabled={!inputText.trim() || isGenerating}
            activeOpacity={0.8}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* History Modal Drawer */}
      <Modal
        visible={historyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDrawer, { backgroundColor: '#070d1e' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Conversation History</Text>
                <Text style={styles.modalSubtitle}>All workspace chat sessions</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X size={22} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            {/* Search History */}
            <View style={[styles.historySearchBar, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Search size={16} color="#64748b" />
              <TextInput
                style={styles.historySearchInput}
                value={historySearchQuery}
                onChangeText={setHistorySearchQuery}
                placeholder="Search past conversations..."
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Conversations List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              {recentConversations
                .filter((c) => c.title.toLowerCase().includes(historySearchQuery.toLowerCase()))
                .map((conv) => (
                  <View
                    key={conv.id}
                    style={[styles.historyItemRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <TouchableOpacity
                      style={styles.historyItemClickable}
                      onPress={() => handleSelectConversation(conv)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.historyIconBox, { backgroundColor: colors.surfaceElevated }]}>
                        {conv.mode === 'study' ? (
                          <BookOpen size={16} color="#818cf8" />
                        ) : (
                          <Sparkles size={16} color="#38bdf8" />
                        )}
                      </View>
                      <View style={styles.historyTexts}>
                        <Text style={[styles.historyItemTitle, { color: colors.text }]} numberOfLines={1}>
                          {conv.title}
                        </Text>
                        <Text style={[styles.historyItemDate, { color: colors.textMuted }]}>
                          {new Date(conv.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.historyDeleteBtn}
                      onPress={() => handleDeleteConversation(conv.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}

              {recentConversations.length === 0 && (
                <View style={styles.emptyHistoryState}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>No past conversations yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  activeModelBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeModelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  homeContainer: {
    paddingTop: 10,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
    marginBottom: 10,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.4,
  },
  welcomeStudentName: {
    color: '#38bdf8',
  },
  welcomePromptTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  promptsGrid: {
    gap: 10,
    marginBottom: 28,
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  promptIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTagPill: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#818cf8',
  },
  promptCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  promptCardDesc: {
    fontSize: 12,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentCardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentBorder: {
    borderBottomWidth: 1,
  },
  recentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentTexts: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentSub: {
    fontSize: 11,
    marginTop: 2,
  },
  chatContainer: {
    gap: 16,
  },
  messageWrapper: {
    width: '100%',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleAttachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachmentChipText: {
    fontSize: 10,
    color: '#38bdf8',
  },
  userMessageText: {
    fontSize: 14,
    color: '#f8fafc',
    lineHeight: 20,
  },
  aiResponseCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  fallbackPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fallbackPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#f59e0b',
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiMessageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  citationsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  citationsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  citationsHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  citationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  citationCard: {
    width: '48%',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    position: 'relative',
  },
  citationDomain: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  citationTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    paddingRight: 14,
  },
  citationIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  aiThinkingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 12,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  stopButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  composerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  composerAttachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  composerAttChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  composerAttChipText: {
    fontSize: 11,
    maxWidth: 160,
  },
  featureTogglesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  togglePillActiveWeb: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  togglePillActiveStudy: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  togglePillText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  attachBtnText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    minHeight: 40,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  historySearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    height: 42,
  },
  historySearchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  historyItemClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTexts: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyItemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyDeleteBtn: {
    padding: 8,
  },
  emptyHistoryState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
