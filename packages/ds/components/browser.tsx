import type { HTMLAttributes, ReactNode } from 'react';
import { LockIcon } from './internal/icons';

export interface BrowserProps extends HTMLAttributes<HTMLDivElement> {
  /** The page (Figma: slot `screen`): the useful area, 1278 × 746 at full size. It scrolls when taller. */
  children?: ReactNode;
  /** The address in the bar (Figma: `url`). */
  url?: string;
}

/**
 * Browser — Figma [RDS] External/Browser. A MOCKUP for flows, specs and showrooms: a desktop browser window,
 * minimal in the Safari way (the window buttons, back and forward, the address in the centre). Up to 1280 wide; it
 * narrows with its container and keeps the page's proportion. The toolbar is decorative; the page is live.
 * Styles: browser.css.
 */
export function Browser({ children, url = 'rojao.studio', className, ...rest }: BrowserProps) {
  return (
    <div {...rest} className={['rds-browser', className].filter(Boolean).join(' ')}>
      <div className="rds-browser__toolbar" aria-hidden="true">
        <span className="rds-browser__controls">
          <span />
          <span />
          <span />
        </span>
        <span className="rds-browser__navigation">
          <span>‹</span>
          <span>›</span>
        </span>
        <span className="rds-browser__center">
          <span className="rds-browser__address">
            <LockIcon />
            <span>{url}</span>
          </span>
        </span>
        <span className="rds-browser__actions">+</span>
      </div>
      <div className="rds-browser__screen">{children}</div>
    </div>
  );
}
