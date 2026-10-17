'use client';

// The FieldGroup's context and the ids hook every text field uses. A client module of its own: createContext and
// useContext do not exist in the server React, and internal/field is also imported by server components
// (CheckboxGroup, through the fieldset).
import { createContext, useContext, useId, type ReactNode } from 'react';
import { hasContent } from './field';

/**
 * What a FieldGroup (ds#147) hands to the fields inside it: its error, which a field takes unless it passes its own
 * `error`, and the ids of its hint and message, which every field points to. Inside a group a field shows no message.
 */
export interface FieldGroupContextValue {
  invalid: boolean;
  hintId?: string;
  errorId?: string;
}

export const FieldGroupContext = createContext<FieldGroupContextValue | null>(null);

/** The ids a field's control points to, and whether it is in error. */
export function useFieldIds(id: string | undefined, hint: ReactNode, error: boolean | undefined, errorMessage: ReactNode) {
  const generated = useId();
  const group = useContext(FieldGroupContext);
  const controlId = id ?? generated;
  const invalid = Boolean((error ?? group?.invalid) || hasContent(errorMessage));
  // In a group the message is the group's, under the whole set: the field keeps only its red border.
  const errorId = !group && invalid && hasContent(errorMessage) ? `${controlId}-error` : undefined;
  const hintId = hasContent(hint) && !errorId ? `${controlId}-hint` : undefined;
  const describedBy = [hintId, errorId, group?.hintId, invalid ? group?.errorId : undefined].filter(Boolean).join(' ');
  return { controlId, hintId, errorId, invalid, describedBy: describedBy || undefined };
}
