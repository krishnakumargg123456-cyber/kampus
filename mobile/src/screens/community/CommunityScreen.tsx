import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Send,
  Plus,
  Repeat,
  Radio,
  BookOpen,
  Sparkles,
  ShieldAlert,
  Search,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const CommunityScreen = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'feed' | 'chats' | 'partners' | 'skillswap'>('feed');
  const [newPostText, setNewPostText] = useState('');
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const POSTS = [
    {
      id: 'post_1',
      author: 'Rohan Mehra',
      authorCollege: 'IIT Bombay • CSE Year 3',
      authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      timeAgo: '2 hours ago',
      category: 'Project Collaboration',
      content:
        'Building an autonomous drone navigation agent using ROS2 and Computer Vision. Looking for 1 mechanical undergrad for gimbal design and 1 embedded dev. Ping if interested!',
      initialLikes: 24,
      commentsCount: 9,
      tags: ['#ROS2', '#Robotics', '#Hackathon'],
    },
    {
      id: 'post_2',
      author: 'Ananya Deshmukh',
      authorCollege: 'VJTI Mumbai • IT Year 2',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      timeAgo: '4 hours ago',
      category: 'Exam Q&A',
      content:
        'Can someone clarify the difference between Strict 2PL and Rigorous 2PL in DBMS? Specifically regarding dirty read prevention versus cascade abort prevention?',
      initialLikes: 18,
      commentsCount: 14,
      tags: ['#DBMS', '#ExamPrep', '#Academics'],
    },
  ];

  const STUDY_PARTNERS = [
    {
      id: 'sp_1',
      name: 'Aditya Verma',
      college: 'IIT Delhi',
      target: 'GATE CS 2026',
      hoursPerDay: '4-5 hrs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      skills: ['Algorithms', 'Math', 'OS'],
    },
    {
      id: 'sp_2',
      name: 'Sneha Patel',
      college: 'BITS Pilani',
      target: 'LeetCode & Placement Grind',
      hoursPerDay: '3 hrs',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
      skills: ['Dynamic Prog', 'System Design'],
    },
  ];

  const handleLike = (id: string, initial: number) => {
    const isLiked = likedPosts.includes(id);
    if (isLiked) {
      setLikedPosts((prev) => prev.filter((p) => p !== id));
      setLikesMap((prev) => ({ ...prev, [id]: (prev[id] ?? initial) - 1 }));
    } else {
      setLikedPosts((prev) => [...prev, id]);
      setLikesMap((prev) => ({ ...prev, [id]: (prev[id] ?? initial) + 1 }));
    }
  };

  const handleAddPost = () => {
    if (!newPostText.trim()) return;
    Alert.alert('Post Published', 'Your question has been broadcast to the KAMPUS student community!');
    setNewPostText('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Student Community</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Verified Student Feed, Real-time Chat & Study Partners
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.liveRoomBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
          onPress={() => Alert.alert('Live Study Room', 'Connecting to 24/7 Silent Study Room #4 (42 Scholars Studying)')}
        >
          <Radio size={14} color={colors.error} />
          <Text style={[styles.liveRoomText, { color: colors.error }]}>Live Rooms</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'feed' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'feed' ? colors.primary : colors.textMuted }]}>
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'partners' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('partners')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'partners' ? colors.primary : colors.textMuted }]}>
            Study Partners
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'skillswap' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('skillswap')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'skillswap' ? colors.primary : colors.textMuted }]}>
            SkillSwap
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'feed' && (
          <>
            {/* Create Post Box */}
            <View
              style={[
                styles.createPostCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
            >
              <View style={styles.createPostTop}>
                <Image
                  source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                  style={styles.myAvatar}
                />
                <TextInput
                  style={[styles.postInput, { color: colors.text }]}
                  placeholder="Ask a question, share academic project, or start a discussion..."
                  placeholderTextColor={colors.textMuted}
                  value={newPostText}
                  onChangeText={setNewPostText}
                  multiline
                />
              </View>

              <View style={[styles.createPostFooter, { borderTopColor: colors.borderLight }]}>
                <View style={styles.postTagsRow}>
                  <Text style={[styles.tagHelper, { color: colors.textMuted }]}>Topic: Academic Q&A</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.publishBtn,
                    { backgroundColor: newPostText.trim() ? colors.primary : colors.textMuted },
                  ]}
                  onPress={handleAddPost}
                  disabled={!newPostText.trim()}
                >
                  <Send size={14} color="#ffffff" />
                  <Text style={styles.publishBtnText}>Post to Campus</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Posts List */}
            {POSTS.map((post) => {
              const isLiked = likedPosts.includes(post.id);
              const currentLikes = likesMap[post.id] ?? post.initialLikes;
              return (
                <View
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.postHeader}>
                    <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
                    <View style={styles.authorInfo}>
                      <Text style={[styles.authorName, { color: colors.text }]}>{post.author}</Text>
                      <Text style={[styles.authorCollege, { color: colors.textMuted }]}>
                        {post.authorCollege} • {post.timeAgo}
                      </Text>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{post.category}</Text>
                    </View>
                  </View>

                  <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

                  <View style={styles.hashTagsRow}>
                    {post.tags.map((tag, idx) => (
                      <Text key={idx} style={[styles.hashTag, { color: colors.primary }]}>
                        {tag}{' '}
                      </Text>
                    ))}
                  </View>

                  <View style={[styles.postFooter, { borderTopColor: colors.borderLight }]}>
                    <TouchableOpacity
                      style={styles.footerActionBtn}
                      onPress={() => handleLike(post.id, post.initialLikes)}
                    >
                      <Heart
                        size={18}
                        color={isLiked ? colors.error : colors.textMuted}
                        fill={isLiked ? colors.error : 'transparent'}
                      />
                      <Text style={[styles.actionCount, { color: isLiked ? colors.error : colors.textSecondary }]}>
                        {currentLikes}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.footerActionBtn}
                      onPress={() => Alert.alert('Comments', 'Opening discussion thread...')}
                    >
                      <MessageSquare size={18} color={colors.textMuted} />
                      <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
                        {post.commentsCount} Answers
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.footerActionBtn}
                      onPress={() => Alert.alert('Share', 'Link copied to clipboard.')}
                    >
                      <Share2 size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'partners' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Study Partner Matching</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Pair with peers targeting identical goals and exam deadlines
              </Text>
            </View>

            {STUDY_PARTNERS.map((partner) => (
              <View
                key={partner.id}
                style={[
                  styles.partnerCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <Image source={{ uri: partner.avatar }} style={styles.partnerAvatar} />
                <View style={styles.partnerInfo}>
                  <Text style={[styles.partnerName, { color: colors.text }]}>{partner.name}</Text>
                  <Text style={[styles.partnerCollege, { color: colors.textMuted }]}>{partner.college}</Text>
                  <Text style={[styles.partnerTarget, { color: colors.primary }]}>
                    Goal: {partner.target} ({partner.hoursPerDay})
                  </Text>
                  <View style={styles.partnerSkillsRow}>
                    {partner.skills.map((s, idx) => (
                      <View key={idx} style={[styles.skillPill, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={[styles.skillPillText, { color: colors.textSecondary }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Request Sent', `Collaboration request dispatched to ${partner.name}.`)}
                >
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'skillswap' && (
          <View>
            <View style={[styles.skillSwapBanner, { backgroundColor: colors.primary }]}>
              <Text style={styles.skillSwapTitle}>SkillSwap: Learn Free from Students</Text>
              <Text style={styles.skillSwapSub}>
                Teach a skill you know (e.g. Flutter, Blender, Python) in exchange for what you want to learn (e.g. Machine Learning, UI Design).
              </Text>
              <TouchableOpacity
                style={[styles.offerSkillBtn, { backgroundColor: '#ffffff' }]}
                onPress={() => Alert.alert('Offer Skill', 'SkillSwap listing creator opened.')}
              >
                <Text style={[styles.offerSkillBtnText, { color: colors.primary }]}>Offer a Skill</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  liveRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  liveRoomText: {
    fontSize: 11,
    fontWeight: '700',
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
  createPostCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  createPostTop: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  myAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
  },
  postInput: {
    flex: 1,
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  createPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  postTagsRow: {},
  tagHelper: {
    fontSize: 12,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  postCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorCollege: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  hashTagsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  hashTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm + 4,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  partnerCollege: {
    fontSize: 12,
    marginTop: 1,
  },
  partnerTarget: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  partnerSkillsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  skillPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  skillPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  skillSwapBanner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  skillSwapTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  skillSwapSub: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  offerSkillBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  offerSkillBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
