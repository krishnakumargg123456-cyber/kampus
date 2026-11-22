import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  ChevronRight,
  BookOpen,
  History,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  quizApi,
  QuizSubject,
  QuizQuestion,
  QuizSubmitResult,
  QuizAttempt,
} from '../../services/studyHubApi';

export const QuizPracticeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  // Mode: 'overview' | 'in_quiz' | 'results'
  const [mode, setMode] = useState<'overview' | 'in_quiz' | 'results'>('overview');
  const [activeTab, setActiveTab] = useState<'subjects' | 'history'>('subjects');

  // Subjects & History
  const [subjects, setSubjects] = useState<QuizSubject[]>([]);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results State
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subs, hist] = await Promise.all([
        quizApi.getSubjects(token, user?.userId),
        quizApi.getHistory(token, user?.userId),
      ]);
      setSubjects(subs);
      setHistory(hist);
    } catch (err: any) {
      console.warn('Failed to load quiz data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startQuiz = async (subject: string) => {
    try {
      setQuizLoading(true);
      setSelectedSubject(subject);
      const qList = await quizApi.getQuestions(subject, 5, token, user?.userId);

      if (!qList || qList.length === 0) {
        Alert.alert('No Questions', 'No questions available for this subject yet.');
        return;
      }

      setQuestions(qList);
      setCurrentIndex(0);
      setAnswers({});
      setMode('in_quiz');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    const confirmMsg =
      unansweredCount > 0
        ? `You have ${unansweredCount} unanswered questions. Submit anyway?`
        : 'Are you sure you want to submit your answers?';

    Alert.alert('Submit Practice Test', confirmMsg, [
      { text: 'Review', style: 'cancel' },
      {
        text: 'Submit',
        style: 'default',
        onPress: async () => {
          setSubmitting(true);
          try {
            const res = await quizApi.submitQuiz(
              {
                subject: selectedSubject,
                answers,
              },
              token,
              user?.userId
            );
            setResult(res);
            setMode('results');
            loadData(); // reload history
          } catch (err: any) {
            Alert.alert('Submission Error', err.message || 'Failed to submit quiz.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const bg = isDark ? '#080d1a' : '#f8fafc';
  const cardBg = isDark ? '#11192d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  // -------------------------------------------------------------
  // VIEW 1: ACTIVE QUIZ RUNNER
  // -------------------------------------------------------------
  if (mode === 'in_quiz' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const selectedChoice = answers[currentQ.id];
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;

    return (
      <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Runner Header */}
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Exit Quiz', 'Are you sure you want to quit? Your progress will not be saved.', [
                { text: 'Keep Practicing', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => setMode('overview') },
              ]);
            }}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
          >
            <ArrowLeft size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>{selectedSubject}</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmitQuiz}
            disabled={submitting}
            style={styles.finishTopBtn}
          >
            <Text style={styles.finishTopBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {/* Linear Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Question Content */}
        <ScrollView contentContainerStyle={styles.quizScrollContent}>
          <View style={styles.topicBadgeRow}>
            {currentQ.topic && (
              <View style={[styles.topicTag, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}>
                <Text style={styles.topicTagText}>{currentQ.topic}</Text>
              </View>
            )}
            {currentQ.difficulty && (
              <View style={[styles.difficultyTag, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Text style={styles.difficultyTagText}>{currentQ.difficulty}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.questionText, { color: textPrimary }]}>{currentQ.question}</Text>

          {/* Options List */}
          <View style={styles.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedChoice === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectOption(currentQ.id, idx)}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : cardBg,
                      borderColor: isSelected ? '#38bdf8' : cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      {
                        borderColor: isSelected ? '#38bdf8' : textSecondary,
                        backgroundColor: isSelected ? '#38bdf8' : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.radioChar,
                        { color: isSelected ? '#080d1a' : textSecondary, fontWeight: '700' },
                      ]}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: textPrimary, flex: 1 }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Navigation Footer */}
        <View
          style={[
            styles.runnerFooter,
            { borderTopColor: cardBorder, backgroundColor: cardBg, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            style={[
              styles.navBtn,
              { opacity: currentIndex === 0 ? 0.3 : 1, borderColor: cardBorder },
            ]}
          >
            <Text style={[styles.navBtnText, { color: textPrimary }]}>Previous</Text>
          </TouchableOpacity>

          {currentIndex < questions.length - 1 ? (
            <TouchableOpacity
              onPress={() => setCurrentIndex((prev) => prev + 1)}
              style={[styles.navBtn, styles.nextBtn]}
            >
              <Text style={styles.nextBtnText}>Next Question</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmitQuiz}
              disabled={submitting}
              style={[styles.navBtn, styles.submitBtn]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Test</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: RESULTS & REVIEW
  // -------------------------------------------------------------
  if (mode === 'results' && result) {
    const isPassing = result.percentage >= 60;

    return (
      <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Results Header */}
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity
            onPress={() => setMode('overview')}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
          >
            <ArrowLeft size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Quiz Results</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>{selectedSubject}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.resultsScrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Card */}
          <View style={[styles.scoreHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View
              style={[
                styles.trophyBg,
                { backgroundColor: isPassing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Award size={40} color={isPassing ? '#10b981' : '#ef4444'} />
            </View>

            <Text style={[styles.scorePercentText, { color: isPassing ? '#10b981' : '#ef4444' }]}>
              {result.percentage}%
            </Text>
            <Text style={[styles.scoreSummaryText, { color: textPrimary }]}>
              {result.score} out of {result.totalQuestions} Correct
            </Text>
            <Text style={[styles.scoreMessageText, { color: textSecondary }]}>
              {isPassing
                ? 'Great job! You have demonstrated strong conceptual understanding.'
                : 'Keep practicing! Review the detailed explanations below to strengthen weak areas.'}
            </Text>

            <TouchableOpacity
              onPress={() => startQuiz(selectedSubject)}
              style={styles.retakeBtn}
            >
              <RotateCcw size={16} color="#ffffff" />
              <Text style={styles.retakeBtnText}>Retake Practice Test</Text>
            </TouchableOpacity>
          </View>

          {/* Detailed Question Review List */}
          <Text style={[styles.reviewSectionTitle, { color: textPrimary }]}>Detailed Answers Review</Text>

          {result.review.map((item, idx) => {
            return (
              <View
                key={idx}
                style={[styles.reviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <View style={styles.reviewCardHeader}>
                  <Text style={[styles.reviewQuestionNum, { color: textSecondary }]}>Question {idx + 1}</Text>
                  {item.isCorrect ? (
                    <View style={styles.correctPill}>
                      <CheckCircle2 size={13} color="#10b981" />
                      <Text style={styles.correctPillText}>Correct</Text>
                    </View>
                  ) : (
                    <View style={styles.incorrectPill}>
                      <XCircle size={13} color="#ef4444" />
                      <Text style={styles.incorrectPillText}>Incorrect</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.reviewQuestionText, { color: textPrimary }]}>{item.question}</Text>

                <View style={styles.reviewOptionsList}>
                  {item.options.map((opt, optIdx) => {
                    const isUserChoice = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctAnswer === optIdx;

                    let optBg = 'transparent';
                    let optBorder = cardBorder;
                    let optText = textSecondary;

                    if (isCorrectAnswer) {
                      optBg = 'rgba(16, 185, 129, 0.15)';
                      optBorder = '#10b981';
                      optText = '#10b981';
                    } else if (isUserChoice && !item.isCorrect) {
                      optBg = 'rgba(239, 68, 68, 0.15)';
                      optBorder = '#ef4444';
                      optText = '#ef4444';
                    }

                    return (
                      <View
                        key={optIdx}
                        style={[
                          styles.reviewOptionRow,
                          { backgroundColor: optBg, borderColor: optBorder },
                        ]}
                      >
                        <Text style={[styles.reviewOptionChar, { color: optText, fontWeight: '700' }]}>
                          {String.fromCharCode(65 + optIdx)}.
                        </Text>
                        <Text style={[styles.reviewOptionText, { color: isCorrectAnswer ? textPrimary : optText }]}>
                          {opt}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Explanation */}
                <View
                  style={[
                    styles.explanationBox,
                    { backgroundColor: isDark ? '#141e33' : '#f1f5f9', borderColor: cardBorder },
                  ]}
                >
                  <Text style={[styles.explanationLabel, { color: '#38bdf8' }]}>EXPLANATION</Text>
                  <Text style={[styles.explanationText, { color: textSecondary }]}>{item.explanation}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: PRACTICE OVERVIEW & SUBJECT SELECTION
  // -------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
        >
          <ArrowLeft size={20} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Quiz & Practice</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Curated mock tests & auto-grading
          </Text>
        </View>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('subjects')}
          style={[
            styles.tabBtn,
            activeTab === 'subjects' && { borderBottomColor: '#38bdf8', borderBottomWidth: 2 },
          ]}
        >
          <BookOpen size={16} color={activeTab === 'subjects' ? '#38bdf8' : textSecondary} />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'subjects' ? '#38bdf8' : textSecondary, fontWeight: '700' },
            ]}
          >
            Practice Subjects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={[
            styles.tabBtn,
            activeTab === 'history' && { borderBottomColor: '#38bdf8', borderBottomWidth: 2 },
          ]}
        >
          <History size={16} color={activeTab === 'history' ? '#38bdf8' : textSecondary} />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'history' ? '#38bdf8' : textSecondary, fontWeight: '700' },
            ]}
          >
            Attempt History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading questions bank...</Text>
        </View>
      ) : activeTab === 'subjects' ? (
        <ScrollView
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {subjects.map((sub, idx) => (
            <View
              key={idx}
              style={[styles.subjectCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.subjectCardTop}>
                <View style={styles.subjectTitleWrap}>
                  <Text style={[styles.subjectName, { color: textPrimary }]}>{sub.subject}</Text>
                  <Text style={[styles.subjectQCount, { color: textSecondary }]}>
                    {sub.questionCount} Questions Available
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => startQuiz(sub.subject)}
                  disabled={quizLoading}
                  style={styles.startTestBtn}
                >
                  <Text style={styles.startTestBtnText}>Start Quiz</Text>
                  <ChevronRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {sub.topics && sub.topics.length > 0 && (
                <View style={styles.topicsRow}>
                  {sub.topics.map((t, tIdx) => (
                    <View
                      key={tIdx}
                      style={[styles.topicChip, { backgroundColor: isDark ? '#141e33' : '#f1f5f9' }]}
                    >
                      <Text style={[styles.topicChipText, { color: textSecondary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        /* History Tab */
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 40 }]}
          renderItem={({ item }) => {
            const isGood = item.percentage >= 60;
            return (
              <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.historyLeft}>
                  <Text style={[styles.historySubject, { color: textPrimary }]}>{item.subject}</Text>
                  <Text style={[styles.historyDate, { color: textSecondary }]}>
                    {new Date(item.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.historyScoreBadge,
                    { backgroundColor: isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyScoreText,
                      { color: isGood ? '#10b981' : '#ef4444', fontWeight: '800' },
                    ]}
                  >
                    {item.percentage}%
                  </Text>
                  <Text style={[styles.historyFraction, { color: isGood ? '#10b981' : '#ef4444' }]}>
                    {item.score}/{item.totalQuestions}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <HelpCircle size={36} color="#38bdf8" />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No quiz attempts yet</Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                Select any subject from the Practice tab to begin your first test.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  finishTopBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  finishTopBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabBtnText: {
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  quizScrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  topicBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  topicTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyTagText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChar: {
    fontSize: 12,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  runnerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    backgroundColor: '#0284c7',
    borderWidth: 0,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderWidth: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsScrollContent: {
    padding: 16,
    gap: 16,
  },
  scoreHeroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  trophyBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scorePercentText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreSummaryText: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreMessageText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 18,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewQuestionNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  correctPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  correctPillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  incorrectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  incorrectPillText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  reviewOptionsList: {
    gap: 8,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  reviewOptionChar: {
    fontSize: 13,
  },
  reviewOptionText: {
    fontSize: 13,
    flex: 1,
  },
  explanationBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 17,
  },
  contentScroll: {
    padding: 16,
    gap: 12,
  },
  subjectCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    gap: 12,
  },
  subjectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  subjectQCount: {
    fontSize: 12,
  },
  startTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  startTestBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicChipText: {
    fontSize: 11,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  historyLeft: {
    flex: 1,
  },
  historySubject: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
  },
  historyScoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 54,
  },
  historyScoreText: {
    fontSize: 15,
  },
  historyFraction: {
    fontSize: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
