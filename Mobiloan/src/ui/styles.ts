import { StyleSheet } from 'react-native';

import { APP_THEME } from '../lib/config';

export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_THEME.mist,
  },
  scroll: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: APP_THEME.ink,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  heroTitle: {
    color: '#F8FDFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#D9E2EC',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: APP_THEME.card,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  statusCard: {
    borderWidth: 1,
  },
  statusInfo: {
    backgroundColor: '#ECFEFF',
    borderColor: '#A5F3FC',
  },
  statusWarning: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  statusTitle: {
    color: APP_THEME.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  statusText: {
    color: APP_THEME.slate,
    fontSize: 13,
    lineHeight: 19,
  },
  cardTitle: {
    color: APP_THEME.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: APP_THEME.slate,
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    backgroundColor: APP_THEME.accent,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonMuted: {
    backgroundColor: APP_THEME.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F8FDFF',
    fontWeight: '800',
    fontSize: 15,
  },
  buttonMutedText: {
    color: APP_THEME.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  buttonDangerText: {
    color: APP_THEME.danger,
    fontWeight: '800',
    fontSize: 15,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: APP_THEME.ink,
  },
  label: {
    color: APP_THEME.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: APP_THEME.card,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  statLabel: {
    color: APP_THEME.slate,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: APP_THEME.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  statSubtext: {
    color: APP_THEME.slate,
    fontSize: 11,
    lineHeight: 15,
  },
  listItem: {
    backgroundColor: APP_THEME.card,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  listItemMuted: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemTitle: {
    color: APP_THEME.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  itemText: {
    color: APP_THEME.slate,
    fontSize: 13,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: '#F8FDFF',
    fontSize: 11,
    fontWeight: '800',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  alertTitle: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  alertText: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  infoTitle: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 19,
  },
  linkText: {
    color: APP_THEME.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  heroAction: {
    backgroundColor: 'rgba(248, 253, 255, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroActionText: {
    color: '#F8FDFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statValueSmall: {
    color: APP_THEME.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    color: APP_THEME.slate,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartTrack: {
    width: '100%',
    height: 96,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartFill: {
    width: '100%',
    backgroundColor: APP_THEME.accent,
    borderRadius: 10,
  },
  chartLabel: {
    color: APP_THEME.slate,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chartValue: {
    color: APP_THEME.ink,
    fontSize: 10,
    fontWeight: '800',
  },
  activityAmount: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
  },
  segmentBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  segment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: APP_THEME.slate,
    fontSize: 12,
    fontWeight: '700',
  },
});
