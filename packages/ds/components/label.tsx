/**
 * Label — rótulo de form, ligado ao controle via htmlFor.
 *
 * Uso:
 *   <Label htmlFor="email">E-mail</Label>
 *   <Label htmlFor="email" required>E-mail</Label>
 *   <Label htmlFor="bio" optional>Bio</Label>
 *   <Label htmlFor="x" tooltip="Aparece no recibo">Nome fantasia</Label>
 *
 * O Input/Select/Textarea já renderizam Label internamente quando passa `label`.
 * Use este component standalone quando precisar customizar layout ou escrever
 * forms sem usar os controls do DS.
 */

import { HelpCircle } from 'lucide-react';
import type { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Mostra `*` vermelho indicando obrigatório. */
  required?: boolean;
  /** Mostra `(opcional)` em cinza. */
  optional?: boolean;
  /** Tooltip helper — renderiza ícone "?" com title nativo. */
  tooltip?:  string;
  size?:     'sm' | 'md';
  children:  ReactNode;
}

const SIZE_CLASS: Record<NonNullable<LabelProps['size']>, string> = {
  sm: 'text-caption',
  md: 'text-label',
};

export function Label({
  required,
  optional,
  tooltip,
  size = 'md',
  className = '',
  children,
  ...rest
}: LabelProps) {
  return (
    <label
      className={[
        'inline-flex items-center gap-1.5 font-medium text-fg-primary leading-none',
        SIZE_CLASS[size],
        className,
      ].join(' ')}
      {...rest}
    >
      <span>{children}</span>
      {required && (
        <span className="text-danger" aria-label="obrigatório">*</span>
      )}
      {optional && !required && (
        <span className="text-fg-muted font-normal">(opcional)</span>
      )}
      {tooltip && (
        <span title={tooltip} className="inline-flex text-fg-muted cursor-help" aria-label={tooltip}>
          <HelpCircle size={13} />
        </span>
      )}
    </label>
  );
}
