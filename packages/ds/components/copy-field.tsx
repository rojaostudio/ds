'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { announce } from './internal/announce';
import { CheckIcon, CopyIcon } from './internal/icons';

export interface CopyFieldProps {
  /** What goes to the clipboard. */
  value: string;
  /** The button's text at rest. */
  label?: string;
  /** The text for 2 s after copying; it is announced too. */
  copiedLabel?: string;
  /** Takes the container's whole width. */
  fullWidth?: boolean;
  className?: string;
}

/**
 * CopyField — a composition of the Button (Figma [RDS] Actions/Button, outline, neutral): copies `value` to the
 * clipboard and says so for 2 s ("Copiado!"), on screen and to screen readers. Used next to a QR code or a link
 * to share. Styles: copy-field.css.
 */
export function CopyField({ value, label = 'Copiar', copiedLabel = 'Copiado!', fullWidth = false, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No clipboard (no permission, insecure context): nothing to say it worked.
      return;
    }
    setCopied(true);
    announce(copiedLabel);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="outline"
      tone="neutral"
      icon={copied ? <CheckIcon /> : <CopyIcon />}
      onClick={copy}
      className={['rds-copy-field', fullWidth && 'rds-copy-field--full', className].filter(Boolean).join(' ')}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
