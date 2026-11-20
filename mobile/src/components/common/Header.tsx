import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';

interface HeaderProps {
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
      <View style={styles.leftRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={onProfilePress} style={styles.avatarWrapper}>
          <Image
            source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
            style={[styles.avatar, { borderColor: colors.primary }]}
          />
          <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />
        </TouchableOpacity>
        <View style={styles.greetingCol}>
          <Text style={[styles.greetingSub, { color: colors.textMuted }]}>{greeting}</Text>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user?.fullName?.split(' ')[0] || 'Scholar'}
          </Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {onSearchPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSearchPress}
            style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Search size={18} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Bell size={18} color={colors.text} />
          <View style={[styles.badgeIndicator, { backgroundColor: colors.accent }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.sm + 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  greetingCol: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
