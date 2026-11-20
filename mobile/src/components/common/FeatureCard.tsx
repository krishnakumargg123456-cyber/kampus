import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

interface FeatureCardProps {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  icon: React.ReactNode;
  badge?: string;
  subFeatureCount?: number;
  onPress: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  imageUrl,
  icon,
  badge,
  subFeatureCount,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        Shadows.card,
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.overlay} />
        <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
        {badge && (
          <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
          {subtitle}
        </Text>

        {subFeatureCount !== undefined && (
          <View style={styles.footerRow}>
            <View style={[styles.subFeaturePill, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.subFeatureText, { color: colors.primary }]}>
                {subFeatureCount} Academic Tools
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  iconBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgePill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    padding: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subFeaturePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  subFeatureText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
