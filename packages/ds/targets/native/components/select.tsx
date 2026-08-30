import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { Sheet } from './sheet';
import { Text } from './text';
import { useTheme } from './theme';

// Native target do Select web. Baseado no Sheet do DS (sem picker de terceiro).
export type SelectOption = { label: string; value: string; disabled?: boolean };

type Props = {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Selecionar',
  disabled = false,
}: Props) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        accessibilityLabel={selected ? selected.label : placeholder}
        style={{
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: t['--border-default'],
          backgroundColor: t['--surface-default'],
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text variant="body" color={selected ? 'primary' : 'muted'}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={20} color={t['--text-muted']} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}
          keyboardShouldPersistTaps="handled"
        >
          {options.map((o) => {
            const sel = o.value === value;
            const optDisabled = o.disabled ?? false;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  if (optDisabled) return;
                  onChange(o.value);
                  setOpen(false);
                }}
                disabled={optDisabled}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: sel, disabled: optDisabled }}
                style={{
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: sel ? t['--surface-raised'] : 'transparent',
                  opacity: optDisabled ? 0.5 : 1,
                }}
              >
                <Text variant="body">{o.label}</Text>
                {sel ? <Check size={18} color={t['--brand-primary']} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </>
  );
}
