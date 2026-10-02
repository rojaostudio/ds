// The inside of a listbox option: icon, text and the check of the chosen one. Shared by Listbox and Combobox.
// Not exported. Styles: listbox.css.
import type { ReactNode } from 'react';
import { CheckIcon } from './icons';

export function OptionContent({ icon, selected, children }: { icon?: ReactNode; selected: boolean; children: ReactNode }) {
  return (
    <>
      {icon && (
        <span className="rds-listbox__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="rds-listbox__text">{children}</span>
      {selected && (
        <span className="rds-listbox__check" aria-hidden="true">
          <CheckIcon />
        </span>
      )}
    </>
  );
}
