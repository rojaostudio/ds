// What a RadioGroup hands to its Radios: one name, the chosen value and the group's state. Not exported.
import { createContext } from 'react';

export interface RadioGroupContextValue {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  /** The first option's value: the only radio that carries the native required (one per group is enough). */
  firstValue?: string;
  disabled?: boolean;
  error?: boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
