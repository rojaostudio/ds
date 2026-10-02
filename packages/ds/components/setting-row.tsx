import type { ReactNode } from 'react';
import { Item } from './item';

/**
 * SettingRow — deprecated: a thin wrapper over the Item (Figma [RDS] Content/Item), kept because SettingsList is
 * documented as its container and the products still compose it. New code uses Item (`title`, `description`,
 * `media`, `action`).
 *
 * label → title (a <label> when `htmlFor` is given), icon → media, control → action. controlWidth='full' puts the
 * control under the row; 'fill' and `align` no longer change anything.
 */
export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** Optional icon before the label. */
  icon?: ReactNode;
  /** The control's id: the label becomes a <label for> so screen readers tie them together. */
  htmlFor?: string;
  /** Only 'full' still has an effect: the control goes under the row, across its width. */
  controlWidth?: 'auto' | 'fill' | 'full';
  /** Kept for compatibility; it no longer changes anything. */
  align?: 'center' | 'start';
  control: ReactNode;
  className?: string;
}

/** @deprecated Use Item. */
export function SettingRow({ label, description, icon, htmlFor, controlWidth = 'auto', control, className }: SettingRowProps) {
  const title = htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label;
  if (controlWidth === 'full') {
    return (
      <div className={className}>
        <Item title={title} description={description} media={icon} />
        <div>{control}</div>
      </div>
    );
  }
  return <Item title={title} description={description} media={icon} action={control} className={className} />;
}
