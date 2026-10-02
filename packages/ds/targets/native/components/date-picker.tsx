import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do DatePicker web. Calendário próprio (sem dependência nativa →
// roda no Expo Go). Single date, semana começa na segunda, locale pt-BR.
export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: Date;
  max?: Date;
  placeholder?: string;
  disabled?: boolean;
}

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // seg→dom
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// rótulo por extenso para leitores de tela: "5 de Março de 2026"
function formatLong(d: Date): string {
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Grade do mês: array de células (Date ou null para padding), semana iniciando na segunda.
function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // 0 = segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePicker({ value, onChange, min, max, placeholder, disabled }: DatePickerProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const initial = value ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const minDay = min ? startOfDay(min) : null;
  const maxDay = max ? startOfDay(max) : null;

  function isDisabled(d: Date): boolean {
    const day = startOfDay(d);
    if (minDay && day < minDay) return true;
    if (maxDay && day > maxDay) return true;
    return false;
  }

  function openPicker() {
    if (disabled) return;
    const base = value ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function pick(d: Date) {
    if (isDisabled(d)) return;
    onChange(d);
    setOpen(false);
  }

  const cells = monthGrid(viewYear, viewMonth);

  return (
    <>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={value ? `Data: ${formatLong(value)}` : placeholder ?? 'Selecione uma data'}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          styles.field,
          {
            borderColor: t['--border-default'],
            backgroundColor: t['--surface-default'],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text variant="body" color={value ? 'primary' : 'muted'} style={{ flex: 1 }}>
          {value ? formatDate(value) : placeholder ?? 'Selecione uma data'}
        </Text>
        <Calendar size={20} color={t['--text-muted']} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.card, { backgroundColor: t['--surface-default'] }]}
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal
          >
            <View style={styles.header}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mês anterior" style={styles.navBtn}>
                <ChevronLeft size={22} color={t['--text-primary']} />
              </Pressable>
              <Text variant="label">
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Próximo mês" style={styles.navBtn}>
                <ChevronRight size={22} color={t['--text-primary']} />
              </Pressable>
            </View>

            <View style={styles.week}>
              {WEEKDAYS.map((w, i) => (
                <View key={i} style={styles.cell}>
                  <Text variant="caption" color="muted">
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const selected = value ? sameDay(d, value) : false;
                const off = isDisabled(d);
                return (
                  <Pressable
                    key={i}
                    onPress={() => pick(d)}
                    disabled={off}
                    accessibilityRole="button"
                    accessibilityLabel={formatLong(d)}
                    accessibilityState={{ selected, disabled: off }}
                    style={[
                      styles.cell,
                      styles.day,
                      selected ? { backgroundColor: t['--brand-primary'] } : null,
                    ]}
                  >
                    <Text
                      variant="body-sm"
                      style={{
                        color: selected
                          ? t['--brand-on-primary']
                          : off
                            ? t['--text-placeholder']
                            : t['--text-primary'],
                      }}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {value && (
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Limpar data"
                style={styles.clear}
              >
                <Text variant="body-sm" color="muted">
                  Limpar
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: 999 },
  clear: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
});
