import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  Compass,
  ArrowLeft,
  Bell,
  Calendar,
  Users,
  Megaphone,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Trophy,
  Filter,
  Plus,
  X,
  Share2,
  Sparkles,
  AlertCircle,
  FileText,
  Phone,
  Tag,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  campusLifeApi,
  CampusEvent,
  CampusClub,
  CampusAnnouncement,
  LostAndFoundItem,
  CampusLifeOverview,
} from '../../services/campusLifeApi';
import { notificationsApi } from '../../services/notificationsApi';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const CampusLifeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'notices' | 'lostfound'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventCategory, setSelectedEventCategory] = useState('All');
  const [selectedClubCategory, setSelectedClubCategory] = useState('All');
  const [lostFoundFilter, setLostFoundFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Data state
  const [overview, setOverview] = useState<CampusLifeOverview | null>(null);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Report form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportType, setReportType] = useState<'Lost' | 'Found'>('Lost');
  const [reportCategory, setReportCategory] = useState('Electronics');
  const [reportLocation, setReportLocation] = useState('');
  const [reportContact, setReportContact] = useState('');

  const EVENT_CATEGORIES = ['All', 'Hackathon', 'Cultural Fest', 'Workshop', 'Sports', 'Technical'];
  const CLUB_CATEGORIES = ['All', 'Technical', 'Cultural', 'Literary', 'Sports', 'Entrepreneurship'];
  const LF_CATEGORIES = ['Electronics', 'IDs & Cards', 'Books & Notes', 'Accessories', 'Keys', 'Other'];

  const fetchCampusLife = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [overviewData, unread] = await Promise.all([
        campusLifeApi.getOverview(token, user?.userId),
        notificationsApi.getUnreadCount(token, user?.userId).catch(() => 0),
      ]);

      setOverview(overviewData);
      setUnreadNotifCount(unread);
    } catch (err: any) {
      console.warn('Campus Life fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    fetchCampusLife();
  }, [fetchCampusLife]);

  // Handle Event Registration
  const handleRegisterEvent = async (event: CampusEvent) => {
    try {
      setActionLoading(true);
      const studentName = user?.fullName || user?.email?.split('@')[0] || 'KAMPUS Student';
      const res = await campusLifeApi.registerForEvent(
        event.id,
        studentName,
        user?.email,
        token,
        user?.userId
      );

      Alert.alert('Registration Confirmed! 🎉', res.message);

      // Update local state
      setOverview((prev) => {
        if (!prev) return prev;
        const updatedEvents = prev.events.map((e) => (e.id === event.id ? res.event : e));
        const updatedFeatured =
          prev.featuredEvent?.id === event.id ? res.event : prev.featuredEvent;
        return {
          ...prev,
          events: updatedEvents,
          featuredEvent: updatedFeatured,
        };
      });

      if (selectedEvent?.id === event.id) {
        setSelectedEvent(res.event);
      }
      setUnreadNotifCount((c) => c + 1);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to register at this time.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Registration
  const handleCancelRegistration = async (event: CampusEvent) => {
    Alert.alert(
      'Cancel Registration',
      `Are you sure you want to cancel your seat for "${event.title}"?`,
      [
        { text: 'Keep Registration', style: 'cancel' },
        {
          text: 'Cancel Seat',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await campusLifeApi.cancelEventRegistration(
                event.id,
                token,
                user?.userId
              );

              setOverview((prev) => {
                if (!prev) return prev;
                const updatedEvents = prev.events.map((e) => (e.id === event.id ? res.event : e));
                const updatedFeatured =
                  prev.featuredEvent?.id === event.id ? res.event : prev.featuredEvent;
                return {
                  ...prev,
                  events: updatedEvents,
                  featuredEvent: updatedFeatured,
                };
              });

              if (selectedEvent?.id === event.id) {
                setSelectedEvent(res.event);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel registration.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle Join Club
  const handleJoinClub = async (club: CampusClub) => {
    try {
      setActionLoading(true);
      const studentName = user?.fullName || user?.email?.split('@')[0] || 'KAMPUS Student';
      const res = await campusLifeApi.joinClub(club.id, studentName, token, user?.userId);

      Alert.alert('Welcome to the Club! 🚀', res.message);

      setOverview((prev) => {
        if (!prev) return prev;
        const updatedClubs = prev.clubs.map((c) => (c.id === club.id ? res.club : c));
        return { ...prev, clubs: updatedClubs };
      });
      setUnreadNotifCount((c) => c + 1);
    } catch (err: any) {
      Alert.alert('Club Membership', err.message || 'Unable to join club.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Lost & Found
  const handleSubmitReport = async () => {
    if (!reportTitle.trim() || !reportLocation.trim() || !reportDesc.trim()) {
      Alert.alert('Incomplete Details', 'Please enter a title, location, and description.');
      return;
    }

    try {
      setActionLoading(true);
      const studentName = user?.fullName || user?.email?.split('@')[0] || 'KAMPUS Student';

      const newItem = await campusLifeApi.reportLostAndFound(
        {
          title: reportTitle.trim(),
          description: reportDesc.trim(),
          type: reportType,
          category: reportCategory,
          location: reportLocation.trim(),
          reporterName: studentName,
          reporterContact: reportContact.trim() || undefined,
        },
        token,
        user?.userId
      );

      Alert.alert('Report Published! 📢', `Your ${reportType.toLowerCase()} item report is now visible to all students.`);

      setOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lostAndFound: [newItem, ...prev.lostAndFound],
        };
      });

      // Reset form
      setReportTitle('');
      setReportDesc('');
      setReportLocation('');
      setReportContact('');
      setReportModalOpen(false);
    } catch (err: any) {
      Alert.alert('Report Failed', err.message || 'Could not submit report.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resolve Lost & Found
  const handleResolveLF = async (item: LostAndFoundItem) => {
    Alert.alert(
      'Mark as Resolved',
      `Mark "${item.title}" as resolved / claimed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Resolved',
          onPress: async () => {
            try {
              const updated = await campusLifeApi.resolveLostAndFound(item.id, token, user?.userId);
              setOverview((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  lostAndFound: prev.lostAndFound.map((i) => (i.id === item.id ? updated : i)),
                };
              });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update item.');
            }
          },
        },
      ]
    );
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!overview?.events) return [];
    return overview.events.filter((e) => {
      const matchCat =
        selectedEventCategory === 'All' ||
        e.category.toLowerCase() === selectedEventCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [overview?.events, selectedEventCategory, searchQuery]);

  // Filtered Clubs
  const filteredClubs = useMemo(() => {
    if (!overview?.clubs) return [];
    return overview.clubs.filter((c) => {
      const matchCat =
        selectedClubCategory === 'All' ||
        c.category.toLowerCase() === selectedClubCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [overview?.clubs, selectedClubCategory, searchQuery]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    if (!overview?.announcements) return [];
    return overview.announcements.filter((a) => {
      if (!searchQuery) return true;
      return (
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [overview?.announcements, searchQuery]);

  // Filtered Lost & Found
  const filteredLostFound = useMemo(() => {
    if (!overview?.lostAndFound) return [];
    return overview.lostAndFound.filter((item) => {
      const matchType = lostFoundFilter === 'All' || item.type === lostFoundFilter;
      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [overview?.lostAndFound, lostFoundFilter, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <View style={styles.campusBadgeRow}>
              <Text style={[styles.topBarTitle, { color: colors.text }]}>Campus Life</Text>
              <View style={[styles.campusPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Text style={[styles.campusPillText, { color: '#0284c7' }]}>GLA Campus</Text>
              </View>
            </View>
            <Text style={[styles.topBarSubtitle, { color: colors.textMuted }]}>
              Events, societies, circulars & lost corner
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell size={20} color={colors.text} />
          {unreadNotifCount > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.notifBadgeText}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBarWrap, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.searchInputBox, { backgroundColor: inputBg }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events, clubs, circulars, items..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Tab Navigation Switcher */}
      <View style={[styles.mainTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'events' && [styles.mainTabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('events')}
        >
          <Calendar size={16} color={activeTab === 'events' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: activeTab === 'events' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'events' ? '700' : '500' }]}>
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'clubs' && [styles.mainTabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('clubs')}
        >
          <Users size={16} color={activeTab === 'clubs' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: activeTab === 'clubs' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'clubs' ? '700' : '500' }]}>
            Clubs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'notices' && [styles.mainTabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('notices')}
        >
          <Megaphone size={16} color={activeTab === 'notices' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: activeTab === 'notices' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'notices' ? '700' : '500' }]}>
            Notices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'lostfound' && [styles.mainTabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('lostfound')}
        >
          <Tag size={16} color={activeTab === 'lostfound' ? colors.primary : colors.textMuted} />
          <Text style={[styles.mainTabText, { color: activeTab === 'lostfound' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'lostfound' ? '700' : '500' }]}>
            Lost & Found
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Connecting to campus discovery hub...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCampusLife(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* TAB 1: EVENTS */}
          {activeTab === 'events' && (
            <View>
              {/* Featured Event Card */}
              {overview?.featuredEvent && !searchQuery && (
                <View style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <View style={styles.featuredBadgeWrap}>
                    <Sparkles size={12} color="#ffffff" />
                    <Text style={styles.featuredBadgeText}>FEATURED FLAGSHIP</Text>
                  </View>

                  <View style={styles.featuredImgPlaceholder}>
                    <Trophy size={48} color={colors.primary} />
                    <Text style={[styles.featuredTag, { color: colors.textSecondary }]}>
                      {overview.featuredEvent.category.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.featuredBody}>
                    <Text style={[styles.featuredTitle, { color: colors.text }]}>
                      {overview.featuredEvent.title}
                    </Text>
                    <Text style={[styles.featuredDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {overview.featuredEvent.description}
                    </Text>

                    <View style={styles.featuredMetaRow}>
                      <View style={styles.metaItem}>
                        <Calendar size={14} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {overview.featuredEvent.date}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {overview.featuredEvent.venue}
                        </Text>
                      </View>
                    </View>

                    {overview.featuredEvent.prizePool && (
                      <View style={[styles.prizeBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                        <Trophy size={14} color="#f59e0b" />
                        <Text style={[styles.prizeText, { color: '#f59e0b' }]}>
                          {overview.featuredEvent.prizePool}
                        </Text>
                      </View>
                    )}

                    {/* Progress Bar */}
                    <View style={styles.capacityProgressWrap}>
                      <View style={styles.capacityLabels}>
                        <Text style={[styles.capacityLabelText, { color: colors.textMuted }]}>
                          Registered: {overview.featuredEvent.registeredCount} / {overview.featuredEvent.capacity}
                        </Text>
                        <Text style={[styles.capacityLabelText, { color: colors.primary, fontWeight: '700' }]}>
                          {overview.featuredEvent.spotsLeft} spots left
                        </Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${Math.min(100, (overview.featuredEvent.registeredCount / overview.featuredEvent.capacity) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Registration Button */}
                    <View style={styles.featuredActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.registerBtn,
                          {
                            backgroundColor: overview.featuredEvent.isRegistered
                              ? '#10b981'
                              : colors.primary,
                          },
                        ]}
                        disabled={actionLoading}
                        onPress={() => {
                          if (overview.featuredEvent?.isRegistered) {
                            handleCancelRegistration(overview.featuredEvent);
                          } else if (overview.featuredEvent) {
                            handleRegisterEvent(overview.featuredEvent);
                          }
                        }}
                      >
                        {overview.featuredEvent.isRegistered ? (
                          <>
                            <CheckCircle2 size={16} color="#ffffff" />
                            <Text style={styles.registerBtnText}>Registered (Tap to Cancel)</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.registerBtnText}>Register Now</Text>
                            <ChevronRight size={16} color="#ffffff" />
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailsBtn, { borderColor: colors.borderLight }]}
                        onPress={() => setSelectedEvent(overview.featuredEvent)}
                      >
                        <Text style={[styles.detailsBtnText, { color: colors.text }]}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Category Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subFilterBar}>
                {EVENT_CATEGORIES.map((cat) => {
                  const active = selectedEventCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.subFilterPill,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.borderLight,
                        },
                      ]}
                      onPress={() => setSelectedEventCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.subFilterText,
                          {
                            color: active ? '#ffffff' : colors.textSecondary,
                            fontWeight: active ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Events Feed Cards */}
              <View style={styles.cardsFeed}>
                {filteredEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    activeOpacity={0.88}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <View style={styles.eventCardTop}>
                      <View style={[styles.eventCatBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                        <Text style={[styles.eventCatText, { color: '#0284c7' }]}>{event.category}</Text>
                      </View>
                      <Text style={[styles.spotsPill, { color: colors.textMuted }]}>
                        {event.spotsLeft} seats left
                      </Text>
                    </View>

                    <Text style={[styles.eventCardTitle, { color: colors.text }]}>{event.title}</Text>
                    <Text style={[styles.eventOrganizer, { color: colors.textMuted }]}>
                      By {event.organizer}
                    </Text>

                    <View style={styles.eventInfoGrid}>
                      <View style={styles.eventInfoItem}>
                        <Calendar size={13} color={colors.primary} />
                        <Text style={[styles.eventInfoText, { color: colors.textSecondary }]}>
                          {event.date}
                        </Text>
                      </View>
                      <View style={styles.eventInfoItem}>
                        <MapPin size={13} color={colors.primary} />
                        <Text style={[styles.eventInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {event.venue}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.eventCardFooter, { borderTopColor: colors.borderLight }]}>
                      {event.prizePool ? (
                        <Text style={[styles.eventPrizeText, { color: '#f59e0b' }]} numberOfLines={1}>
                          🏆 {event.prizePool}
                        </Text>
                      ) : (
                        <Text style={[styles.eventPrizeText, { color: colors.textMuted }]}>
                          Verified Pass Included
                        </Text>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.cardActionPill,
                          {
                            backgroundColor: event.isRegistered ? '#10b981' : colors.primary,
                          },
                        ]}
                        onPress={() => {
                          if (event.isRegistered) handleCancelRegistration(event);
                          else handleRegisterEvent(event);
                        }}
                      >
                        <Text style={styles.cardActionPillText}>
                          {event.isRegistered ? 'Registered ✓' : 'Register'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}

                {filteredEvents.length === 0 && (
                  <View style={styles.emptyView}>
                    <Calendar size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyViewTitle, { color: colors.text }]}>No Events Found</Text>
                    <Text style={[styles.emptyViewSubtitle, { color: colors.textMuted }]}>
                      No campus events match the selected criteria.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: CLUBS */}
          {activeTab === 'clubs' && (
            <View>
              {/* Club Category Switcher */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subFilterBar}>
                {CLUB_CATEGORIES.map((cat) => {
                  const active = selectedClubCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.subFilterPill,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.borderLight,
                        },
                      ]}
                      onPress={() => setSelectedClubCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.subFilterText,
                          {
                            color: active ? '#ffffff' : colors.textSecondary,
                            fontWeight: active ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.cardsFeed}>
                {filteredClubs.map((club) => (
                  <View
                    key={club.id}
                    style={[styles.clubCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <View style={styles.clubCardHeader}>
                      <View style={[styles.clubIconWrap, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe' }]}>
                        <Users size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.clubNameRow}>
                          <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                        </View>
                        <Text style={[styles.clubCategory, { color: colors.primary }]}>
                          {club.category.toUpperCase()} • {club.membersCount} SCHOLARS
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.clubDesc, { color: colors.textSecondary }]}>
                      {club.description}
                    </Text>

                    <View style={[styles.clubLeadBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                      <Text style={[styles.clubLeadLabel, { color: colors.textMuted }]}>
                        President / Convener:
                      </Text>
                      <Text style={[styles.clubLeadName, { color: colors.text }]}>
                        {club.leadName} ({club.leadRole})
                      </Text>
                      <Text style={[styles.clubMeetText, { color: colors.textMuted }]}>
                        📍 {club.venue} • {club.meetingSchedule}
                      </Text>
                    </View>

                    <View style={styles.clubFooter}>
                      <TouchableOpacity
                        style={[
                          styles.joinClubBtn,
                          {
                            backgroundColor: club.isMember ? '#10b981' : colors.primary,
                          },
                        ]}
                        disabled={club.isMember || actionLoading}
                        onPress={() => handleJoinClub(club)}
                      >
                        <Text style={styles.joinClubBtnText}>
                          {club.isMember ? 'Active Member ✓' : 'Join Club'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {filteredClubs.length === 0 && (
                  <View style={styles.emptyView}>
                    <Users size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyViewTitle, { color: colors.text }]}>No Clubs Found</Text>
                    <Text style={[styles.emptyViewSubtitle, { color: colors.textMuted }]}>
                      Try selecting another club domain or clearing search.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {activeTab === 'notices' && (
            <View style={styles.cardsFeed}>
              {filteredAnnouncements.map((notice) => (
                <View
                  key={notice.id}
                  style={[styles.noticeCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                >
                  <View style={styles.noticeHeader}>
                    <View style={styles.noticeHeaderLeft}>
                      <ShieldCheck size={16} color={colors.primary} />
                      <Text style={[styles.noticeDept, { color: colors.primary }]}>
                        {notice.department}
                      </Text>
                    </View>

                    {notice.priority === 'Urgent' && (
                      <View style={[styles.priorityPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Text style={[styles.priorityPillText, { color: '#ef4444' }]}>URGENT</Text>
                      </View>
                    )}
                    {notice.priority === 'High' && (
                      <View style={[styles.priorityPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Text style={[styles.priorityPillText, { color: '#f59e0b' }]}>HIGH</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</Text>
                  <Text style={[styles.noticeDate, { color: colors.textMuted }]}>
                    Published by {notice.publishedBy} • {notice.date}
                  </Text>

                  <Text style={[styles.noticeContent, { color: colors.textSecondary }]}>
                    {notice.content}
                  </Text>

                  {notice.attachmentName && (
                    <View style={[styles.attachmentPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                      <FileText size={14} color={colors.primary} />
                      <Text style={[styles.attachmentText, { color: colors.text }]} numberOfLines={1}>
                        {notice.attachmentName}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {filteredAnnouncements.length === 0 && (
                <View style={styles.emptyView}>
                  <Megaphone size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyViewTitle, { color: colors.text }]}>No Circulars Found</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: LOST & FOUND */}
          {activeTab === 'lostfound' && (
            <View>
              {/* Top Controls: Filter & Report Button */}
              <View style={styles.lostFoundControls}>
                <View style={styles.lfPills}>
                  {(['All', 'Lost', 'Found'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.lfFilterBtn,
                        {
                          backgroundColor: lostFoundFilter === mode ? colors.primary : colors.surface,
                          borderColor: lostFoundFilter === mode ? colors.primary : colors.borderLight,
                        },
                      ]}
                      onPress={() => setLostFoundFilter(mode)}
                    >
                      <Text
                        style={[
                          styles.lfFilterText,
                          {
                            color: lostFoundFilter === mode ? '#ffffff' : colors.textSecondary,
                            fontWeight: lostFoundFilter === mode ? '700' : '500',
                          },
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.reportNewBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setReportModalOpen(true)}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.reportNewText}>Report Item</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardsFeed}>
                {filteredLostFound.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.lfCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <View style={styles.lfCardHeader}>
                      <View
                        style={[
                          styles.lfTypePill,
                          {
                            backgroundColor:
                              item.type === 'Lost'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.lfTypeText,
                            { color: item.type === 'Lost' ? '#ef4444' : '#10b981' },
                          ]}
                        >
                          {item.type.toUpperCase()}
                        </Text>
                      </View>

                      <View style={[styles.lfStatusPill, { backgroundColor: item.status === 'Resolved' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                        <Text
                          style={[
                            styles.lfStatusText,
                            { color: item.status === 'Resolved' ? colors.textMuted : '#f59e0b' },
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.lfTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.lfDesc, { color: colors.textSecondary }]}>{item.description}</Text>

                    <View style={styles.lfMeta}>
                      <View style={styles.lfMetaItem}>
                        <MapPin size={13} color={colors.primary} />
                        <Text style={[styles.lfMetaText, { color: colors.textSecondary }]}>
                          {item.location}
                        </Text>
                      </View>
                      <View style={styles.lfMetaItem}>
                        <Clock size={13} color={colors.textMuted} />
                        <Text style={[styles.lfMetaText, { color: colors.textMuted }]}>
                          Reported {item.dateReported}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.lfFooter, { borderTopColor: colors.borderLight }]}>
                      <View>
                        <Text style={[styles.reporterLabel, { color: colors.textMuted }]}>Reported By:</Text>
                        <Text style={[styles.reporterName, { color: colors.text }]}>
                          {item.reporterName} {item.reporterContact ? `(${item.reporterContact})` : ''}
                        </Text>
                      </View>

                      {item.status !== 'Resolved' && (
                        <TouchableOpacity
                          style={[styles.claimBtn, { borderColor: colors.primary }]}
                          onPress={() => handleResolveLF(item)}
                        >
                          <Text style={[styles.claimBtnText, { color: colors.primary }]}>
                            Mark Claimed
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                {filteredLostFound.length === 0 && (
                  <View style={styles.emptyView}>
                    <Tag size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyViewTitle, { color: colors.text }]}>No Items Reported</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL 1: EVENT DETAILS & REGISTRATION */}
      <Modal visible={Boolean(selectedEvent)} animationType="slide" transparent onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.eventCatBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)', alignSelf: 'flex-start', marginBottom: 4 }]}>
                  <Text style={[styles.eventCatText, { color: '#0284c7' }]}>{selectedEvent?.category}</Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedEvent?.title}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Organized by {selectedEvent?.organizer}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalSectionHeading, { color: colors.primary }]}>ABOUT THE EVENT</Text>
              <Text style={[styles.modalBodyText, { color: colors.textSecondary }]}>
                {selectedEvent?.description}
              </Text>

              <View style={[styles.modalInfoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                <View style={styles.modalInfoRow}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoVal, { color: colors.text }]}>{selectedEvent?.date}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoVal, { color: colors.text }]}>{selectedEvent?.time}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.modalInfoVal, { color: colors.text }]}>{selectedEvent?.venue}</Text>
                </View>
                {selectedEvent?.prizePool && (
                  <View style={styles.modalInfoRow}>
                    <Trophy size={16} color="#f59e0b" />
                    <Text style={[styles.modalInfoVal, { color: '#f59e0b', fontWeight: '700' }]}>
                      {selectedEvent.prizePool}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.capacityProgressWrap}>
                <View style={styles.capacityLabels}>
                  <Text style={[styles.capacityLabelText, { color: colors.textMuted }]}>
                    Capacity: {selectedEvent?.registeredCount} / {selectedEvent?.capacity} Scholars
                  </Text>
                  <Text style={[styles.capacityLabelText, { color: colors.primary, fontWeight: '700' }]}>
                    {selectedEvent?.spotsLeft} spots remaining
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min(100, ((selectedEvent?.registeredCount || 0) / (selectedEvent?.capacity || 1)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              {selectedEvent?.isRegistered ? (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#ef4444' }]}
                  disabled={actionLoading}
                  onPress={() => selectedEvent && handleCancelRegistration(selectedEvent)}
                >
                  <Text style={styles.modalActionBtnText}>Cancel Registration</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                  disabled={actionLoading}
                  onPress={() => selectedEvent && handleRegisterEvent(selectedEvent)}
                >
                  <Text style={styles.modalActionBtnText}>Confirm Registration</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: REPORT LOST & FOUND ITEM */}
      <Modal visible={reportModalOpen} animationType="slide" transparent onRequestClose={() => setReportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Report Lost or Found Item</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Broadcast item details to campus noticeboards
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReportModalOpen(false)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Type Selector (Lost vs Found) */}
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    reportType === 'Lost' && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' },
                  ]}
                  onPress={() => setReportType('Lost')}
                >
                  <Text style={[styles.typeOptionText, { color: reportType === 'Lost' ? '#ef4444' : colors.textMuted }]}>
                    I LOST AN ITEM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    reportType === 'Found' && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
                  ]}
                  onPress={() => setReportType('Found')}
                >
                  <Text style={[styles.typeOptionText, { color: reportType === 'Found' ? '#10b981' : colors.textMuted }]}>
                    I FOUND AN ITEM
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Item Name / Headline *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: colors.text, borderColor: colors.borderLight }]}
                placeholder="e.g. boAt Airdopes Case, Casio Calculator, Blue Wallet..."
                placeholderTextColor={colors.textMuted}
                value={reportTitle}
                onChangeText={setReportTitle}
              />

              {/* Category Picker */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {LF_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: reportCategory === c ? colors.primary : inputBg,
                        borderColor: reportCategory === c ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => setReportCategory(c)}
                  >
                    <Text style={{ color: reportCategory === c ? '#fff' : colors.textSecondary, fontSize: 12 }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Location Input */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Location *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: colors.text, borderColor: colors.borderLight }]}
                placeholder="e.g. CS Block Room 204, Cafeteria, Football Ground..."
                placeholderTextColor={colors.textMuted}
                value={reportLocation}
                onChangeText={setReportLocation}
              />

              {/* Description Input */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description & Identifying Marks *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: inputBg, color: colors.text, borderColor: colors.borderLight, height: 80 },
                ]}
                placeholder="Specific color, stickers, model number, where it was left..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={reportDesc}
                onChangeText={setReportDesc}
              />

              {/* Contact Info */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Your Contact / Room No. (Optional)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: colors.text, borderColor: colors.borderLight }]}
                placeholder="e.g. Hostel 4 Room 312 or +91 98765..."
                placeholderTextColor={colors.textMuted}
                value={reportContact}
                onChangeText={setReportContact}
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                disabled={actionLoading}
                onPress={handleSubmitReport}
              >
                <Text style={styles.modalActionBtnText}>
                  {actionLoading ? 'Publishing...' : 'Publish Report'}
                </Text>
              </TouchableOpacity>
            </View>
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
  topBar: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  campusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  campusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  campusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  notifBtn: {
    padding: 9,
    borderRadius: 10,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  mainTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomWidth: 2,
  },
  mainTabText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  featuredCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    ...Shadows.card,
  },
  featuredBadgeWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredImgPlaceholder: {
    height: 140,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  featuredTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredBody: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  featuredDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  prizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  capacityProgressWrap: {
    marginBottom: 14,
  },
  capacityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  capacityLabelText: {
    fontSize: 11,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  featuredActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  registerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subFilterBar: {
    marginBottom: 14,
  },
  subFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  subFilterText: {
    fontSize: 12,
  },
  cardsFeed: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Shadows.card,
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventCatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventCatText: {
    fontSize: 10,
    fontWeight: '800',
  },
  spotsPill: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  eventOrganizer: {
    fontSize: 11,
    marginBottom: 10,
  },
  eventInfoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventInfoText: {
    fontSize: 12,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventPrizeText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  cardActionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardActionPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  clubCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Shadows.card,
  },
  clubCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  clubIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
  },
  clubCategory: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  clubDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  clubLeadBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  clubLeadLabel: {
    fontSize: 10,
  },
  clubLeadName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  clubMeetText: {
    fontSize: 11,
    marginTop: 4,
  },
  clubFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinClubBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinClubBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Shadows.card,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noticeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeDept: {
    fontSize: 11,
    fontWeight: '800',
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 20,
  },
  noticeDate: {
    fontSize: 11,
    marginBottom: 8,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lostFoundControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lfPills: {
    flexDirection: 'row',
    gap: 6,
  },
  lfFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  lfFilterText: {
    fontSize: 12,
  },
  reportNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  reportNewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  lfCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Shadows.card,
  },
  lfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lfTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lfTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lfStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lfStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  lfTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  lfDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  lfMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  lfMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lfMetaText: {
    fontSize: 11,
  },
  lfFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reporterLabel: {
    fontSize: 10,
  },
  reporterName: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyViewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyViewSubtitle: {
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  modalSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalBodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  modalInfoCard: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfoVal: {
    fontSize: 13,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
});
