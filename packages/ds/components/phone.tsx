import type { HTMLAttributes, ReactNode } from 'react';
import { LockIcon } from './internal/icons';

export type PhonePlatform = 'ios' | 'android';

export interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The screen (Figma: slot `screen`): the browser's useful area, 390 × 700 on ios and 412 × 795 on android (taller
   * without the browser). It scrolls when the content is taller.
   */
  children?: ReactNode;
  /** The browser's bars (Figma: `browser`). Off, it is a native app: only the status bar and the system bar. */
  browser?: boolean;
  /** The address in the browser bar (Figma: `url`). */
  url?: string;
  /** ios: an iPhone (390 × 844) with Safari, the address at the bottom; android: 412 × 915 with Chrome, at the top. */
  platform?: PhonePlatform;
  /** The time in the status bar. */
  time?: string;
}

/**
 * Phone — Figma [RDS] External/Phone. A MOCKUP for flows, specs and showrooms: the phone with the browser, to show a
 * screen the way it looks on the device. The bars are decorative (hidden from screen readers); the screen is live.
 * Styles: phone.css.
 */
export function Phone({ children, browser = true, url = 'rojao.studio', platform = 'ios', time = '9:41', className, ...rest }: PhoneProps) {
  const address = (
    <div className="rds-phone__address">
      <LockIcon />
      <span>{url}</span>
    </div>
  );
  return (
    <div {...rest} className={['rds-phone', `rds-phone--${platform}`, className].filter(Boolean).join(' ')}>
      <div className="rds-phone__device">
        <div className="rds-phone__status" aria-hidden="true">
          <span className="rds-phone__time">{time}</span>
          {platform === 'ios' ? <span className="rds-phone__island" /> : <span className="rds-phone__camera" />}
          <span className="rds-phone__indicators">
            <span className="rds-phone__signal" />
            <span className="rds-phone__battery" />
          </span>
        </div>
        {browser && platform === 'android' && (
          <div className="rds-phone__browser rds-phone__browser--top" aria-hidden="true">
            {address}
            <span className="rds-phone__tabs">1</span>
            <span className="rds-phone__menu" />
          </div>
        )}
        <div className="rds-phone__screen">{children}</div>
        {browser && platform === 'ios' && (
          <div className="rds-phone__browser rds-phone__browser--bottom" aria-hidden="true">
            {address}
          </div>
        )}
        <div className="rds-phone__system" aria-hidden="true">
          <span className="rds-phone__home" />
        </div>
      </div>
    </div>
  );
}
