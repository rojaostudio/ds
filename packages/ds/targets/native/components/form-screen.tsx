import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './button';
import { useTheme } from './theme';

// Barra de salvar sticky no rodapé. Native target do SavingBar web. Padrão único de
// salvar do app (decisão de produto: salvar explícito, não auto-save).
export function SavingBar({
  label = 'Salvar',
  onSave,
  onDiscard,
  discardLabel = 'Descartar',
  message,
  loading,
  disabled,
  visible = true,
}: {
  label?: string;
  onSave: () => void;
  onDiscard?: () => void;
  discardLabel?: string;
  message?: string;
  loading?: boolean;
  disabled?: boolean;
  visible?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  // Sem mudanças não salvas: não renderiza (paridade com web `visible`).
  if (!visible) return null;

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: t['--border-subtle'],
        backgroundColor: t['--surface-default'],
        paddingTop: 16,
        paddingHorizontal: 16,
        // Respeita o home indicator do iPhone; soma 16 de respiro quando não há inset.
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
        gap: 8,
      }}
    >
      {message ? (
        <Text
          style={{
            color: t['--text-muted'],
            fontSize: 13,
          }}
        >
          {message}
        </Text>
      ) : null}
      <Button
        label={label}
        variant="primary"
        fullWidth
        onPress={onSave}
        loading={loading}
        disabled={disabled}
      />
      {onDiscard ? (
        <Button
          label={discardLabel}
          variant="secondary"
          fullWidth
          onPress={onDiscard}
          disabled={loading}
        />
      ) : null}
    </View>
  );
}

// Scaffold de tela de formulário: resolve o teclado cobrindo o campo + scroll +
// barra sticky. Toda tela de form do app usa isto.
export function FormScreen({ children, saveBar }: { children: ReactNode; saveBar?: ReactNode }) {
  const t = useTheme();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t['--surface-page'] }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {saveBar}
    </KeyboardAvoidingView>
  );
}
