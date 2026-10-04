'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { useOnScreenKeyboard } from './use-on-screen-keyboard';

export type BottomBarPlacement = 'docked' | 'floating';

export interface BottomBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * docked (the container's width, against the foot, square corners) or floating (from lg 1024 up: off the foot by
   * bottom-bar/floating/margin, at most bottom-bar/floating/max-width, centred, bottom-bar/floating/radius and the
   * elevation/overlay shadow). Below 1024 floating is exactly docked (Figma: `placement`).
   */
  placement?: BottomBarPlacement;
  /**
   * The leading slot, on the left: one ~44 control, never running text. Present (even `null` or `false` while its
   * control is hidden), the slot is there and reserves bottom-bar/leading/min-width, so what follows does not jump
   * when the control comes and goes; left out (`undefined`), there is no slot. Whoever fills it says its own changes.
   */
  leading?: ReactNode;
  children: ReactNode;
}

/**
 * BottomBar — Figma [RDS] Actions/.bottom-bar, private: the shell at the foot of the screen under the FormActions and
 * the SavingBar. Not exported from the package. It owns the colour (bottom-bar/background, the brand's primary), the
 * height (64 plus env(safe-area-inset-bottom) compact, 68 expanded), the padding and gap, the place (sticky at the
 * bottom of the scrolling container), the placement, the leading slot, the Button tokens in the bar's colours and the
 * on-screen keyboard (compact: it slides away while a field is being typed in). Whoever builds on it puts the
 * actions. Styles: bottom-bar.css.
 */
export function BottomBar({ placement = 'docked', leading, className, children, ...rest }: BottomBarProps) {
  const keyboard = useOnScreenKeyboard();
  return (
    <div
      {...rest}
      className={['rds-bottom-bar', `rds-bottom-bar--${placement}`, keyboard && 'rds-bottom-bar--keyboard', className]
        .filter(Boolean)
        .join(' ')}
    >
      {leading !== undefined && <div className="rds-bottom-bar__leading">{leading}</div>}
      {children}
    </div>
  );
}
