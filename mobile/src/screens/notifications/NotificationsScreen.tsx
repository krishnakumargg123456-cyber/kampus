import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Trash2,
  Settings,
  GraduationCap,
  Compass,
  Users,
  ShoppingBag,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  Inbox,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  notificationsApi,
  NotificationItem,
  NotificationCategory,
  NotificationPreferences,
} from '../../services/notificationsApi';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const NotificationsScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    academicAlerts: true,
    campusEvents: true,
    communityAlerts: true,
    marketAlerts: true,
    careerAlerts: true,
    systemAlerts: true,
    pushEnabled: true,
    emailEnabled: false,
  });

  const CATEGORIES = [
    { id: 'All', label: 'All' },
    { id: 'Unread', label: 'Unread' },
    { id: 'Academic', label: 'Academic' },
    { id: 'Campus', label: 'Campus' },
    { id: 'Community', label: 'Community' },
    { id: 'Market', label: 'Market' },
    { id: 'Career', label: 'Career' },
    { id: 'System', label: 'System' },
  ];

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await notificationsApi.getNotifications(token, user?.userId);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);

      // Fetch preferences in background
      notificationsApi.getPreferences(token, user?.userId).then(setPreferences).catch(() => {});
    } catch (err: any) {
      console.warn('Notifications fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.read) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await notificationsApi.markAsRead(item.id, token, user?.userId);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await notificationsApi.markAllRead(token, user?.userId);
    } catch {
      Alert.alert('Notice', 'Failed to mark all as read. Pull down to refresh.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (item && !item.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      await notificationsApi.deleteNotification(id, token, user?.userId);
    } catch {}
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to dismiss all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            setUnreadCount(0);
            await notificationsApi.clearAll(token, user?.userId);
          },
        },
      ]
    );
  };

  const handleDeepLink = (route?: string) => {
    if (!route) return;
    try {
      if (route === 'CampusLife') navigation.navigate('CampusLife');
      else if (route === 'Market') navigation.navigate('Market');
      else if (route === 'StudyHub') navigation.navigate('StudyHub');
      else if (route === 'Community') navigation.navigate('Community');
      else if (route === 'Career') navigation.navigate('Career');
      else if (route === 'Profile') navigation.navigate('Profile');
      else if (route === 'Settings') navigation.navigate('Settings');
      else navigation.navigate(route);
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await notificationsApi.updatePreferences(updated, token, user?.userId);
    } catch {
      setPreferences(preferences);
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    let list = notifications;
    if (activeCategory === 'Unread') {
      list = list.filter((n) => !n.read);
    } else if (activeCategory !== 'All') {
      list = list.filter((n) => n.category.toLowerCase() === activeCategory.toLowerCase());
    }
    return list;
  }, [notifications, activeCategory]);

  const getCategoryTheme = (category: NotificationCategory) => {
    switch (category) {
      case 'Academic':
        return {
          bg: isDark ? 'rgba(99, 102, 241, 0.16)' : '#eef2ff',
          color: '#6366f1',
          icon: <GraduationCap size={18} color="#6366f1" />,
        };
      case 'Campus':
        return {
          bg: isDark ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe',
          color: '#0284c7',
          icon: <Compass size={18} color="#0284c7" />,
        };
      case 'Community':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
          color: '#10b981',
          icon: <Users size={18} color="#10b981" />,
        };
      case 'Market':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
          color: '#f59e0b',
          icon: <ShoppingBag size={18} color="#f59e0b" />,
        };
      case 'Career':
        return {
          bg: isDark ? 'rgba(168, 85, 247, 0.16)' : '#f3e8ff',
          color: '#a855f7',
          icon: <Briefcase size={18} color="#a855f7" />,
        };
      case 'System':
      default:
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.16)' : '#f1f5f9',
          color: colors.primary,
          icon: <ShieldAlert size={18} color={colors.primary} />,
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return 'Yesterday';
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderNotificationCard = ({ item }: { item: NotificationItem }) => {
    const cat = getCategoryTheme(item.category);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: item.read
              ? colors.surface
              : isDark
              ? 'rgba(30, 41, 59, 0.95)'
              : '#f8fafc',
            borderColor: !item.read ? 'rgba(37, 99, 235, 0.3)' : colors.borderLight,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => {
          handleMarkAsRead(item);
          if (item.linkRoute) handleDeepLink(item.linkRoute);
        }}
      >
        {/* Unread indicator */}
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}

        <View style={styles.cardHeader}>
          <View style={[styles.categoryIconWrap, { backgroundColor: cat.bg }]}>
            {cat.icon}
          </View>

          <View style={styles.cardHeaderInfo}>
            <View style={styles.categoryRow}>
              <Text style={[styles.categoryBadge, { color: cat.color }]}>
                {item.category.toUpperCase()}
              </Text>

              {item.priority === 'Urgent' && (
                <View style={[styles.priorityBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.priorityText, { color: '#ef4444' }]}>URGENT</Text>
                </View>
              )}
              {item.priority === 'Important' && (
                <View style={[styles.priorityBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.priorityText, { color: '#f59e0b' }]}>IMPORTANT</Text>
                </View>
              )}
            </View>

            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>

        {item.details && (
          <Text style={[styles.cardDetails, { color: colors.textMuted }]}>{item.details}</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatTimestamp(item.createdAt)}
          </Text>

          {item.linkRoute && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                handleMarkAsRead(item);
                handleDeepLink(item.linkRoute);
              }}
            >
              <Text style={styles.actionBtnText}>{item.actionLabel || 'View'}</Text>
              <ChevronRight size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Campus alerts, deadlines & activity
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}
              onPress={handleMarkAllRead}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}
            onPress={() => setPreferencesOpen(true)}
            accessibilityLabel="Preferences"
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={[styles.filterBar, { borderBottomColor: colors.borderLight }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: active ? '#ffffff' : colors.textSecondary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                  {cat.id === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading campus notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                <Inbox size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeCategory === 'Unread' ? 'All Caught Up!' : 'No Notifications'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {activeCategory === 'Unread'
                  ? 'You have read all pending campus and course notifications.'
                  : `No notifications recorded under ${activeCategory}.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Preferences Modal */}
      <Modal visible={preferencesOpen} animationType="slide" transparent onRequestClose={() => setPreferencesOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Notification Settings</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Customize which alerts reach your feed
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreferencesOpen(false)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.prefSectionTitle, { color: colors.primary }]}>CHANNELS</Text>
              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>Push Notifications</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Receive urgent campus alerts on this mobile device
                  </Text>
                </View>
                <Switch
                  value={preferences.pushEnabled}
                  onValueChange={() => handleTogglePref('pushEnabled')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>Email Digest</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Weekly summary of deadlines & club events
                  </Text>
                </View>
                <Switch
                  value={preferences.emailEnabled}
                  onValueChange={() => handleTogglePref('emailEnabled')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <Text style={[styles.prefSectionTitle, { color: colors.primary, marginTop: 20 }]}>
                TOPICS & CATEGORIES
              </Text>

              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>Academic & Exams</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Timetable releases, attendance & exam seating
                  </Text>
                </View>
                <Switch
                  value={preferences.academicAlerts}
                  onValueChange={() => handleTogglePref('academicAlerts')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>Campus Life & Fests</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Hackathons, sports cups & cultural nights
                  </Text>
                </View>
                <Switch
                  value={preferences.campusEvents}
                  onValueChange={() => handleTogglePref('campusEvents')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>Community & Groups</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Replies to notes, study room invites & discussions
                  </Text>
                </View>
                <Switch
                  value={preferences.communityAlerts}
                  onValueChange={() => handleTogglePref('communityAlerts')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <View style={[styles.prefRow, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.prefLabel, { color: colors.text }]}>KAMPUS Market</Text>
                  <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
                    Buyer orders, seller updates & price drops
                  </Text>
                </View>
                <Switch
                  value={preferences.marketAlerts}
                  onValueChange={() => handleTogglePref('marketAlerts')}
                  trackColor={{ false: '#64748b', true: colors.primary }}
                />
              </View>

              <TouchableOpacity
                style={[styles.clearAllBtn, { borderColor: '#ef4444' }]}
                onPress={handleClearAll}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    position: 'relative',
    ...Shadows.card,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 4,
    marginRight: 10,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardDetails: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    marginTop: 8,
  },
  prefSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  prefDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
    marginBottom: 20,
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
