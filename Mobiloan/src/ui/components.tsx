import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { APP_THEME } from '../lib/config';
import { appStyles } from './styles';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface TabHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function TabHeader({ eyebrow, title, subtitle, right }: TabHeaderProps) {
  return (
    <View style={appStyles.tabHeader}>
      <View style={appStyles.rowBetween}>
        <View style={{ flex: 1, gap: 2 }}>
          {eyebrow ? <Text style={appStyles.tabEyebrow}>{eyebrow}</Text> : null}
          <Text style={appStyles.tabTitle}>{title}</Text>
          {subtitle ? <Text style={appStyles.tabSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'danger' | 'success';
}

export function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  const valueColor =
    tone === 'danger' ? '#B91C1C' : tone === 'success' ? '#047857' : APP_THEME.ink;

  return (
    <View style={appStyles.kpiCard}>
      <Text style={appStyles.kpiLabel}>{label}</Text>
      <Text
        style={[appStyles.kpiValue, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {hint ? <Text style={appStyles.kpiHint}>{hint}</Text> : null}
    </View>
  );
}

interface ActionTileProps {
  icon: IconName;
  label: string;
  hint?: string;
  onPress: () => void;
  primary?: boolean;
}

export function ActionTile({ icon, label, hint, onPress, primary }: ActionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        appStyles.actionTile,
        primary && appStyles.actionTilePrimary,
        pressed && appStyles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[appStyles.actionIconCircle, primary && appStyles.actionIconCirclePrimary]}>
        <Ionicons name={icon} size={20} color={primary ? '#F8FDFF' : APP_THEME.accent} />
      </View>
      <Text style={[appStyles.actionTileText, primary && appStyles.actionTileTextPrimary]}>
        {label}
      </Text>
      {hint ? (
        <Text style={[appStyles.actionHint, primary && appStyles.actionHintPrimary]}>{hint}</Text>
      ) : null}
    </Pressable>
  );
}

interface QuickActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
}

export function QuickAction({ icon, label, onPress, primary }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [appStyles.quickAction, pressed && appStyles.pressed]}
      onPress={onPress}
    >
      <View style={[appStyles.quickIcon, primary && appStyles.quickIconPrimary]}>
        <Ionicons name={icon} size={19} color={primary ? '#F8FDFF' : APP_THEME.accent} />
      </View>
      <Text style={appStyles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={appStyles.sectionRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={appStyles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={appStyles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={appStyles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface ProgressBarProps {
  value: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ value, color = APP_THEME.accent, trackColor }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <View style={[appStyles.progressTrack, trackColor ? { backgroundColor: trackColor } : null]}>
      <View style={[appStyles.progressFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={appStyles.segmented}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[appStyles.segmentButton, active && appStyles.segmentButtonActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[appStyles.segmentText, active && appStyles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, message }: EmptyStateProps) {
  return (
    <View style={appStyles.emptyCard}>
      <View style={appStyles.emptyIcon}>
        <Ionicons name={icon} size={22} color={APP_THEME.slate} />
      </View>
      <Text style={appStyles.emptyTitle}>{title}</Text>
      {message ? <Text style={appStyles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}
