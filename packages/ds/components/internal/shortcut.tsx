// The visible keys of a shortcut, for Button, Input and Combobox `shortcut` (ds#153). Not exported from the package.
import { Fragment } from 'react';
import { Kbd, KbdGroup } from '../kbd';

/** aria-keyshortcuts names → what the key says. The rest is shown as written ("F2", "K", "/"). */
const NAMES: Record<string, string> = {
  Control: 'Ctrl',
  Meta: '⌘',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/**
 * One key (a Kbd) or a combination (a KbdGroup with "+" between the keys), from the aria-keyshortcuts syntax
 * ("F2", "Control+Enter", "/"). Decorative: the control carries aria-keyshortcuts, so a screen reader hears it once.
 */
export function ShortcutKeys({ shortcut, className }: { shortcut: string; className: string }) {
  const keys = (shortcut.split(' ')[0] ?? shortcut).split(/\+(?!$)/).map((key) => NAMES[key] ?? key);
  return (
    <span className={className} aria-hidden="true">
      {keys.length === 1 ? (
        <Kbd>{keys[0]}</Kbd>
      ) : (
        <KbdGroup>
          {keys.map((key, i) => (
            <Fragment key={i}>
              {i > 0 && '+'}
              <Kbd>{key}</Kbd>
            </Fragment>
          ))}
        </KbdGroup>
      )}
    </span>
  );
}
