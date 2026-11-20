import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  Wrench,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Lock,
  Award,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const StudentToolkitScreen = () => {
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'todo' | 'pomodoro' | 'locker' | 'rewards'>('todo');

  // To-do tasks state
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Revise Graph Dijkstra Algorithm for Lab Test', subject: 'CS301', completed: true },
    { id: 't2', title: 'Submit Operating Systems Lab Assignment 4', subject: 'CS303', completed: false },
    { id: 't3', title: 'Prepare 10-slide deck for Hackathon Pitch', subject: 'Project', completed: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Pomodoro Focus state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      Alert.alert('Focus Session Complete!', 'Great work! Take a 5-minute break.');
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: 't_' + Date.now(), title: newTaskInput.trim(), subject: 'General', completed: false },
    ]);
    setNewTaskInput('');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const LOCKER_DOCS = [
    { id: 'd1', name: 'Class 10th & 12th Verified Marksheets.pdf', category: 'Academic Credentials', size: '2.1 MB' },
    { id: 'd2', name: 'College Admission Allotment Letter.pdf', category: 'Official Allotment', size: '1.4 MB' },
    { id: 'd3', name: 'Aadhaar Identity Verification Card.pdf', category: 'Government ID', size: '840 KB' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Student Toolkit</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Study Planner, Focus Timer, Digital Locker & Badges
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'todo' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('todo')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'todo' ? colors.primary : colors.textMuted }]}>
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'pomodoro' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('pomodoro')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'pomodoro' ? colors.primary : colors.textMuted }]}>
            Focus Timer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'locker' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('locker')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'locker' ? colors.primary : colors.textMuted }]}>
            Locker Vault
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rewards' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'rewards' ? colors.primary : colors.textMuted }]}>
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'todo' && (
          <View>
            {/* Add Task Input */}
            <View style={[styles.addTaskBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addTaskInput, { color: colors.text }]}
                placeholder="Add a study goal or homework task..."
                placeholderTextColor={colors.textMuted}
                value={newTaskInput}
                onChangeText={setNewTaskInput}
              />
              <TouchableOpacity
                style={[styles.addTaskBtn, { backgroundColor: colors.primary }]}
                onPress={addTask}
              >
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Tasks List */}
            {tasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <TouchableOpacity onPress={() => toggleTask(task.id)} style={styles.taskCheckTouch}>
                  {task.completed ? (
                    <CheckCircle2 size={22} color={colors.success} fill={colors.success + '20'} />
                  ) : (
                    <Circle size={22} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: colors.text },
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.taskSubject, { color: colors.textMuted }]}>{task.subject}</Text>
                </View>

                <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.taskDeleteBtn}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'pomodoro' && (
          <View style={styles.pomodoroContainer}>
            <View
              style={[
                styles.timerCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
            >
              <Text style={[styles.timerTitle, { color: colors.textMuted }]}>Deep Study Focus Session</Text>
              <Text style={[styles.timerDisplay, { color: colors.primary }]}>{formatTimer(secondsLeft)}</Text>
              <Text style={[styles.timerSubtitle, { color: colors.textSecondary }]}>
                {timerRunning ? 'Stay focused. Notifications silenced.' : '25 Min Focus • 5 Min Break'}
              </Text>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: timerRunning ? colors.warning : colors.primary }]}
                  onPress={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? <Pause size={20} color="#ffffff" /> : <Play size={20} color="#ffffff" />}
                  <Text style={styles.timerBtnText}>{timerRunning ? 'Pause Session' : 'Start Focus'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timerResetBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setTimerRunning(false);
                    setSecondsLeft(25 * 60);
                  }}
                >
                  <RotateCcw size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'locker' && (
          <View>
            <View style={[styles.vaultBanner, { backgroundColor: colors.secondary }]}>
              <View style={styles.vaultIconWrapper}>
                <Lock size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vaultTitle}>Digital Locker Vault</Text>
                <Text style={styles.vaultSub}>
                  Client-side encrypted storage for your academic degree certificates, mark sheets & identity papers.
                </Text>
              </View>
            </View>

            {LOCKER_DOCS.map((doc) => (
              <View
                key={doc.id}
                style={[
                  styles.lockerItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <ShieldCheck size={20} color={colors.success} style={{ marginRight: Spacing.sm }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lockerDocName, { color: colors.text }]}>{doc.name}</Text>
                  <Text style={[styles.lockerDocMeta, { color: colors.textMuted }]}>
                    {doc.category} • {doc.size}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.viewDocBtn, { backgroundColor: colors.surfaceElevated }]}
                  onPress={() => Alert.alert('Decrypted Document', 'Opening secure document viewer with watermarking.')}
                >
                  <Text style={[styles.viewDocText, { color: colors.primary }]}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'rewards' && (
          <View>
            <View
              style={[
                styles.rewardsCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
            >
              <Award size={36} color="#f59e0b" style={{ marginBottom: 6 }} />
              <Text style={[styles.pointsVal, { color: colors.text }]}>1,450</Text>
              <Text style={[styles.pointsLabel, { color: colors.textMuted }]}>KAMPUS Academic Karma Points</Text>
              <Text style={[styles.tierTag, { color: colors.primary }]}>Tier: Silver Scholar Level 3</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  addTaskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.md,
  },
  addTaskInput: {
    flex: 1,
    fontSize: 14,
  },
  addTaskBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskCheckTouch: {
    marginRight: Spacing.sm,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskSubject: {
    fontSize: 11,
    marginTop: 2,
  },
  taskDeleteBtn: {
    padding: 6,
  },
  pomodoroContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  timerCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timerDisplay: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: Spacing.md,
  },
  timerSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.xl,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  timerBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  timerResetBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultBanner: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  vaultIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  vaultSub: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  lockerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lockerDocName: {
    fontSize: 13,
    fontWeight: '700',
  },
  lockerDocMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  viewDocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  viewDocText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  pointsVal: {
    fontSize: 40,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  tierTag: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
});
