'use client';

import type { ReactNode } from 'react';
import { Card } from './card';
import { Switch } from './switch';

export interface ToggleCardProps {
  /** The setting it turns on (the Switch's label). */
  label: string;
  /** A line under the label (the Switch's hint). */
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Submits 'on' (or '') under this name with a native form, through a hidden input. */
  name?: string;
  /** The setting's options, shown under it while it is on. */
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * ToggleCard — a composition of the Card and the Switch (Figma [RDS] Forms/Switch): a setting that, when on, opens
 * its own options below it. Styles: toggle-card.css.
 */
export function ToggleCard({ label, description, checked, onCheckedChange, name, children, disabled, className }: ToggleCardProps) {
  return (
    <Card as="div" className={['rds-toggle-card', className].filter(Boolean).join(' ')}>
      {name && <input type="hidden" name={name} value={checked ? 'on' : ''} />}
      <div className="rds-toggle-card__header">
        <Switch checked={checked} onCheckedChange={onCheckedChange} hint={description} disabled={disabled}>
          {label}
        </Switch>
      </div>
      {checked && children && <div className="rds-toggle-card__content">{children}</div>}
    </Card>
  );
}
