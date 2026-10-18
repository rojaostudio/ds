'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from 'react';
import { IconButton } from './icon-button';
import { SendIcon } from './internal/icons';
import { Tooltip } from './tooltip';

export interface ComposerProps
  extends Omit<ComponentPropsWithRef<'textarea'>, 'value' | 'defaultValue' | 'onChange' | 'rows' | 'children'> {
  /** The text, controlled (Figma: `value`). Pair it with `onValueChange`. */
  value?: string;
  /** The text at first, uncontrolled. It empties after each send. */
  defaultValue?: string;
  /** Called on every change of the text. */
  onValueChange?: (value: string) => void;
  /** Called with the text, trimmed, on Enter or on the send button. Never with an empty text, nor while `sending`. */
  onSend: (text: string) => void;
  /**
   * Waiting for the send to finish (Figma: state=sending): the send button turns, the text stays in view and Enter
   * does not send again.
   */
  sending?: boolean;
  /** The conversation takes no answer now (Figma: state=disabled). */
  disabled?: boolean;
  /** The field's accessible name. Default "Mensagem". */
  label?: string;
  /** The send button's name (and its Tooltip). Default "Enviar". */
  sendLabel?: string;
  /** Lines it grows to before it scrolls. Default 4. */
  maxRows?: number;
}

/**
 * Composer — Figma [RDS] Chat/Composer (ds#178). Where a chat is written: the text and the send button in one box. It
 * grows from 1 line to `maxRows`, then scrolls. Enter sends, Shift+Enter breaks the line (and an IME composition is
 * never cut by Enter). The box takes the Textarea's tokens (textarea/*). Goes in the FloatingPanel's footer or under a
 * MessageScroller. Styles: composer.css.
 */
export function Composer({
  value,
  defaultValue = '',
  onValueChange,
  onSend,
  sending = false,
  disabled = false,
  label = 'Mensagem',
  sendLabel = 'Enviar',
  maxRows = 4,
  placeholder = 'Escreva uma mensagem',
  className,
  style,
  ref,
  onKeyDown,
  ...textarea
}: ComposerProps) {
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const field = useRef<HTMLTextAreaElement | null>(null);
  const empty = text.trim() === '';

  // Grow with the text: measure from one line up, capped at maxRows (then the field scrolls).
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    const css = getComputedStyle(el);
    const line = parseFloat(css.lineHeight) || 24;
    const padding = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
    const cap = line * Math.max(1, maxRows);
    el.style.height = 'auto';
    const content = el.scrollHeight - padding;
    el.style.height = `${Math.min(content, cap)}px`;
    el.style.overflowY = content > cap ? 'auto' : 'hidden';
  }, [text, maxRows]);

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const send = () => {
    if (empty || sending || disabled) return;
    onSend(text.trim());
    if (value === undefined) setOwn('');
  };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div
      className={['rds-composer', disabled && 'rds-composer--disabled', className].filter(Boolean).join(' ')}
      style={style}
    >
      <textarea
        {...textarea}
        ref={(el) => {
          field.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        className="rds-composer__field"
        rows={1}
        aria-label={textarea['aria-labelledby'] ? undefined : label}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => change(event.target.value)}
        onKeyDown={keyDown}
      />
      <Tooltip text={sendLabel}>
        <IconButton
          icon={<SendIcon />}
          label={sendLabel}
          tone="action"
          variant="fill"
          size="sm"
          className="rds-composer__send"
          disabled={disabled || empty}
          loading={sending}
          onClick={send}
        />
      </Tooltip>
    </div>
  );
}
