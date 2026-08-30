import { AlertCircle } from 'lucide-react-native';
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Molécula KEYSTONE do form kit. Embrulha QUALQUER controle (Input, Select, Switch,
// CurrencyInput…) com label + erro + hint. Espaçamento padrão vive aqui — telas não
// repetem. Label sempre --text-primary (nunca muted: baixa visão). Erro com ícone +
// texto, não só cor (WCAG 1.4.1). Required marker é símbolo, não depende de cor.
//
// O FormField INJETA estado no controle filho (cloneElement): `error` (pinta a borda)
// e `accessibilityLabel` (associa label↔campo pro leitor de tela). Os átomos aceitam
// essas props — então `<FormField error label><Input/></FormField>` pinta a borda E
// nomeia o campo, sem o consumidor repetir nada no controle.
type Props = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, hint, error, required, children }: Props) {
  const t = useTheme();
  const a11yLabel = label ? (required ? `${label}, obrigatório` : label) : undefined;

  const field =
    isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          // só injeta se o controle não trouxe o seu próprio
          error: (children as ReactElement<Record<string, unknown>>).props.error ?? (error ? true : undefined),
          accessibilityLabel:
            (children as ReactElement<Record<string, unknown>>).props.accessibilityLabel ?? a11yLabel,
        })
      : children;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="label" style={{ flexShrink: 1 }}>
            {label}
          </Text>
          {required ? (
            <Text variant="label" color="danger" accessibilityElementsHidden importantForAccessibility="no">
              *
            </Text>
          ) : null}
        </View>
      ) : null}

      {field}

      {error ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <AlertCircle size={14} color={t['--danger-text']} style={{ marginTop: 2 }} />
          <Text variant="caption" color="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
