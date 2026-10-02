import { type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { Search as SearchIcon, X } from 'lucide-react-native';

import { useTheme } from './theme';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Callback do botão clear (X). Limpa o campo. */
  onClear?: () => void;
  /** Disparado no submit (Enter / botão de busca do teclado). */
  onSubmit?: (query: string) => void;
  /** Slot de ação persistente à direita (antes do X). Ex.: scanner de código de barras. */
  action?: {
    icon: ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
  };
};

export function Search({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  onSubmit,
  action,
  accessibilityLabel,
  ...rest
}: Props) {
  const t = useTheme();
  const hasValue = !!value;

  function handleClear() {
    onChangeText('');
    onClear?.();
  }

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: t['--surface-raised'], borderColor: t['--border-default'] },
      ]}
    >
      <SearchIcon size={18} color={t['--icon-default']} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t['--text-muted']}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        returnKeyType="search"
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
        style={[styles.input, { color: t['--text-primary'] }]}
        {...rest}
      />
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          hitSlop={8}
          onPress={action.onPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          {action.icon}
        </Pressable>
      ) : null}
      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={handleClear}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <X size={18} color={t['--icon-default']} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
});
