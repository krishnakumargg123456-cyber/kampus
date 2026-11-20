import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Compass,
  Bell,
  Calendar,
  Users,
  MessageSquare,
  Ticket,
  MapPin,
  Clock,
  CheckCircle2,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const CampusLifeScreen = () => {
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'events' | 'notices' | 'clubs' | 'voice'>('events');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [upvotedVoice, setUpvotedVoice] = useState<string[]>([]);

  const EVENTS = [
    {
      id: 'ev_1',
      title: 'Annual Flagship Hackathon 2026: CodeWave',
      date: 'Dec 05 - 07, 2026',
      venue: 'Main Convocation Hall & Virtual',
      category: 'Hackathon',
      organizer: 'Google Developer Student Clubs (GDSC)',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
      prize: '₹2,50,000 Cash Pool',
      registeredCount: 480,
    },
    {
      id: 'ev_2',
      title: 'KAMPUS Cultural Extravaganza: Mood Indigo prelims',
      date: 'Dec 12, 2026 • 6:00 PM',
      venue: 'Open Air Theatre (OAT)',
      category: 'Cultural Fest',
      organizer: 'Student Cultural Council',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
      prize: 'Trophies & National Passes',
      registeredCount: 1200,
    },
  ];

  const NOTICES = [
    {
      id: 'not_1',
      title: 'Mandatory Submission of End-Sem Laboratory Journals',
      department: 'Dean of Academic Affairs',
      date: 'Nov 20, 2026',
      urgent: true,
      content:
        'All B.Tech semester 4, 6 and 8 candidates must produce hardcopy journals signed by internal examiners before Nov 28.',
    },
    {
      id: 'not_2',
      title: 'Hostel Wi-Fi Upgradation & Fiber Maintenance Downtime',
      department: 'Computer Center Operations',
      date: 'Nov 18, 2026',
      urgent: false,
      content:
        'Scheduled router firmware updates in Hostels 12, 13, and 14 between 2:00 AM and 5:00 AM this Saturday.',
    },
  ];

  const CLUBS = [
    {
      id: 'cl_1',
      name: 'Robotics & Automation Guild',
      category: 'Technical',
      members: 340,
      description: 'Designing autonomous rovers, drones, and combat bots for national tech fests.',
      logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'cl_2',
      name: 'KAMPUS Literary & Debating Society',
      category: 'Literary',
      members: 190,
      description: 'Parliamentary debates, MUN delegations, slam poetry, and creative writing seminars.',
      logo: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&auto=format&fit=crop&q=80',
    },
  ];

  const VOICE_POSTS = [
    {
      id: 'v_1',
      title: 'Extend Central Library Night Reading Hall Timings to 24x7',
      category: 'Academic Facility',
      upvotes: 142,
      status: 'Approved & Implemented',
      author: 'Student Council Rep',
    },
    {
      id: 'v_2',
      title: 'Install Additional High-Speed EV Charging Points at North Gate',
      category: 'Campus Infrastructure',
      upvotes: 89,
      status: 'Under Dean Review',
      author: 'Hostel 14 Resident',
    },
  ];

  const handleRegisterEvent = (id: string, title: string) => {
    if (registeredEvents.includes(id)) {
      Alert.alert('Already Registered', 'You already have an e-pass for this event in your Digital Locker.');
      return;
    }
    setRegisteredEvents((prev) => [...prev, id]);
    Alert.alert(
      'Registration Confirmed!',
      `You are officially registered for "${title}". Your digital QR pass is ready.`
    );
  };

  const handleUpvoteVoice = (id: string) => {
    setUpvotedVoice((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Campus Life</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Notices, Events, Student Clubs & Transparent Voice
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'events' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'events' ? colors.primary : colors.textMuted }]}>
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'notices' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('notices')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'notices' ? colors.primary : colors.textMuted }]}>
            Notices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'clubs' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('clubs')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'clubs' ? colors.primary : colors.textMuted }]}>
            Clubs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'voice' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('voice')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'voice' ? colors.primary : colors.textMuted }]}>
            Voice
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'events' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Campus Events</Text>
            </View>

            {EVENTS.map((ev) => {
              const isRegistered = registeredEvents.includes(ev.id);
              return (
                <View
                  key={ev.id}
                  style={[
                    styles.eventCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    Shadows.card,
                  ]}
                >
                  <Image source={{ uri: ev.image }} style={styles.eventImage} resizeMode="cover" />
                  <View style={styles.eventBody}>
                    <View style={styles.eventCategoryBadge}>
                      <Text style={[styles.eventCategoryText, { color: colors.primary }]}>{ev.category}</Text>
                    </View>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{ev.title}</Text>

                    <View style={styles.eventMetaRow}>
                      <Calendar size={14} color={colors.textMuted} />
                      <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>{ev.date}</Text>
                    </View>

                    <View style={styles.eventMetaRow}>
                      <MapPin size={14} color={colors.textMuted} />
                      <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>{ev.venue}</Text>
                    </View>

                    <View style={[styles.eventFooter, { borderTopColor: colors.borderLight }]}>
                      <Text style={[styles.eventOrganizer, { color: colors.textMuted }]}>By {ev.organizer}</Text>
                      <TouchableOpacity
                        style={[
                          styles.registerBtn,
                          { backgroundColor: isRegistered ? colors.success : colors.primary },
                        ]}
                        onPress={() => handleRegisterEvent(ev.id, ev.title)}
                      >
                        <Ticket size={14} color="#ffffff" />
                        <Text style={styles.registerBtnText}>
                          {isRegistered ? 'Ticket Confirmed' : 'Register Free'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'notices' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Official College Circulars</Text>
            </View>

            {NOTICES.map((not) => (
              <View
                key={not.id}
                style={[
                  styles.noticeCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <View style={styles.noticeHeader}>
                  <View style={[styles.deptPill, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.deptText, { color: colors.primary }]}>{not.department}</Text>
                  </View>
                  {not.urgent && (
                    <View style={[styles.urgentPill, { backgroundColor: colors.error + '20' }]}>
                      <AlertCircle size={12} color={colors.error} />
                      <Text style={[styles.urgentText, { color: colors.error }]}>CRITICAL</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>{not.title}</Text>
                <Text style={[styles.noticeContent, { color: colors.textSecondary }]}>{not.content}</Text>
                <Text style={[styles.noticeDate, { color: colors.textMuted }]}>Published: {not.date}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'clubs' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Clubs & Guilds</Text>
            </View>

            {CLUBS.map((club) => (
              <View
                key={club.id}
                style={[
                  styles.clubCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <Image source={{ uri: club.logo }} style={styles.clubLogo} />
                <View style={styles.clubInfo}>
                  <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                  <Text style={[styles.clubCategory, { color: colors.primary }]}>
                    {club.category} • {club.members} active members
                  </Text>
                  <Text style={[styles.clubDesc, { color: colors.textSecondary }]}>{club.description}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinClubBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}
                  onPress={() => Alert.alert('Membership Request', `Application submitted to ${club.name} Council.`)}
                >
                  <Text style={[styles.joinClubBtnText, { color: colors.primary }]}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'voice' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Voice & Grievances</Text>
            </View>

            {VOICE_POSTS.map((voice) => {
              const isUpvoted = upvotedVoice.includes(voice.id);
              return (
                <View
                  key={voice.id}
                  style={[
                    styles.voiceCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.voiceTop}>
                    <Text style={[styles.voiceCategory, { color: colors.primary }]}>{voice.category}</Text>
                    <View style={[styles.statusTag, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.statusText, { color: colors.success }]}>{voice.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.voiceTitle, { color: colors.text }]}>{voice.title}</Text>
                  <View style={[styles.voiceFooter, { borderTopColor: colors.borderLight }]}>
                    <TouchableOpacity
                      style={styles.upvoteBtn}
                      onPress={() => handleUpvoteVoice(voice.id)}
                    >
                      <ThumbsUp
                        size={16}
                        color={isUpvoted ? colors.primary : colors.textMuted}
                        fill={isUpvoted ? colors.primary : 'transparent'}
                      />
                      <Text style={[styles.upvoteCount, { color: isUpvoted ? colors.primary : colors.textSecondary }]}>
                        {voice.upvotes + (isUpvoted ? 1 : 0)} Endorsements
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  eventCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  eventBody: {
    padding: Spacing.md,
  },
  eventCategoryBadge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  eventCategoryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  eventOrganizer: {
    fontSize: 11,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deptPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  deptText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  noticeDate: {
    fontSize: 11,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
  },
  clubCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  clubDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  joinClubBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  joinClubBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  voiceCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  voiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voiceCategory: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  voiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  voiceFooter: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upvoteCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
