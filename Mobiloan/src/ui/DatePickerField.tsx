import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { APP_THEME } from '../lib/config';
import { parseDateInput, toLocalDateKey, todayDateKey } from '../lib/dates';
import { formatDate } from '../lib/format';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Texto del boton cuando no hay fecha. */
  placeholder?: string;
  disabled?: boolean;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MONTH_LABEL = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export function DatePickerField({ value, onChange, placeholder = 'Elegir fecha', disabled }: Props) {
  const selected = useMemo(() => parseDateInput(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(selected ?? new Date()),
  );

  const open = () => {
    if (disabled) {
      return;
    }
    setVisibleMonth(startOfMonth(selected ?? new Date()));
    setIsOpen(true);
  };

  const shiftMonth = (delta: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const grid = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: Array<Date | null> = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(year, month, day, 12, 0, 0, 0));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [visibleMonth]);

  const selectedKey = selected ? toLocalDateKey(selected) : null;
  const todayKey = todayDateKey();

  const pick = (date: Date) => {
    onChange(toLocalDateKey(date) as string);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Fecha: ${selected ? formatDate(selected) : placeholder}`}
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={open}
      >
        <Ionicons name="calendar-outline" size={18} color={APP_THEME.accent} />
        <Text style={[styles.fieldText, !selected && styles.fieldPlaceholder]} numberOfLines={1}>
          {selected ? formatDate(selected) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={APP_THEME.slate} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
                style={styles.navButton}
                onPress={() => shiftMonth(-1)}
              >
                <Ionicons name="chevron-back" size={18} color={APP_THEME.ink} />
              </Pressable>
              <Text style={styles.monthLabel} numberOfLines={1}>
                {MONTH_LABEL.format(visibleMonth)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
                style={styles.navButton}
                onPress={() => shiftMonth(1)}
              >
                <Ionicons name="chevron-forward" size={18} color={APP_THEME.ink} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.weekday}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((date, index) => {
                const key = date ? toLocalDateKey(date) : `blank-${index}`;
                const isSelected = date && toLocalDateKey(date) === selectedKey;
                const isToday = date && toLocalDateKey(date) === todayKey;

                return (
                  <View key={key} style={styles.cell}>
                    {date ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={formatDate(date)}
                        style={[
                          styles.dayButton,
                          isToday && styles.dayToday,
                          isSelected && styles.daySelected,
                        ]}
                        onPress={() => pick(date)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isToday && styles.dayTextToday,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                style={styles.footerButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.footerMuted}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.footerButton}
                onPress={() => pick(new Date())}
              >
                <Text style={styles.footerAccent}>Hoy</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldText: {
    flex: 1,
    color: APP_THEME.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  fieldPlaceholder: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 61, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: APP_THEME.card,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    color: APP_THEME.ink,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.accentSoft,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: APP_THEME.slate,
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayButton: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    backgroundColor: '#F1F5F9',
  },
  daySelected: {
    backgroundColor: APP_THEME.accent,
  },
  dayText: {
    color: APP_THEME.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextToday: {
    fontWeight: '800',
    color: APP_THEME.accent,
  },
  dayTextSelected: {
    color: '#F8FDFF',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    paddingTop: 4,
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  footerMuted: {
    color: APP_THEME.slate,
    fontSize: 14,
    fontWeight: '700',
  },
  footerAccent: {
    color: APP_THEME.accent,
    fontSize: 14,
    fontWeight: '800',
  },
});
