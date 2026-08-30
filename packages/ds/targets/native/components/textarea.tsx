import { useState } from 'react';
import {
  type NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  type TextInputContentSizeChangeEventData,
  type TextInputProps,
} from 'react-native';

import { useTheme } from './theme';

type Props = TextInputProps & {
  error?: boolean;
  disabled?: boolean;
  label?: string;
  // autoGrow: cresce com o conteúdo até maxRows; quando false usa numberOfLines fixo.
  autoGrow?: boolean;
  maxRows?: number;
};

// Tipos dos eventos derivados do próprio prop (resistente a mudanças de versão do RN).
type FocusArg = Parameters<NonNullable<TextInputProps['onFocus']>>[0];
type BlurArg = Parameters<NonNullable<TextInputProps['onBlur']>>[0];

// Estimativa de altura por linha (fontSize 16 * ~1.4) + padding vertical (14 * 2).
const LINE_HEIGHT = 22;
const VERTICAL_PADDING = 28;

// Native target do Textarea web. Multiline com label/erro via FormField (não embutir).
export function TextArea({
  style,
  onFocus,
  onBlur,
  onContentSizeChange,
  numberOfLines = 4,
  error,
  disabled,
  label,
  accessibilityLabel,
  autoGrow,
  maxRows = 10,
  ...rest
}: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const borderColor = error
    ? t['--danger']
    : focused
      ? t['--border-focus']
      : t['--border-default'];

  function handleFocus(e: FocusArg) {
    setFocused(true);
    onFocus?.(e);
  }
  function handleBlur(e: BlurArg) {
    setFocused(false);
    onBlur?.(e);
  }
  function handleContentSizeChange(
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) {
    if (autoGrow) {
      setContentHeight(e.nativeEvent.contentSize.height);
    }
    onContentSizeChange?.(e);
  }

  // maxHeight derivado de maxRows; mínimo já garantido por styles.area (minHeight).
  const maxHeight = maxRows * LINE_HEIGHT + VERTICAL_PADDING;
  const autoGrowStyle = autoGrow
    ? { height: Math.min(contentHeight ?? 0, maxHeight) || undefined, maxHeight }
    : null;

  return (
    <TextInput
      multiline
      numberOfLines={autoGrow ? undefined : numberOfLines}
      textAlignVertical="top"
      placeholderTextColor={t['--text-placeholder']}
      editable={!disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContentSizeChange={handleContentSizeChange}
      style={[
        styles.area,
        {
          borderColor,
          backgroundColor: t['--surface-default'],
          color: disabled ? t['--text-disabled'] : t['--text-primary'],
        },
        disabled && styles.disabled,
        autoGrowStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 96, borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16 },
  disabled: { opacity: 0.5 },
});
