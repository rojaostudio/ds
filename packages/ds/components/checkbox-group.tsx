import { ChoiceFieldset, type ChoiceFieldsetProps } from './internal/fieldset';

export interface CheckboxGroupProps extends ChoiceFieldsetProps {
  /** Said after the legend to screen readers when `required` (a group of checkboxes has no native required). */
  requiredText?: string;
}

/**
 * CheckboxGroup — Figma [RDS] Forms/CheckboxGroup. A question and its multiple-choice options (Checkbox
 * children, Figma slot `options`) in a <fieldset>, with the group's hint and one error for the group.
 * HTML has no required for a group of checkboxes: validate on submit and pass `errorMessage`.
 * Styles: checkbox-group.css and internal/fieldset.css.
 */
export function CheckboxGroup({ requiredText = 'obrigatório', ...props }: CheckboxGroupProps) {
  return <ChoiceFieldset kind="rds-checkbox-group" requiredText={requiredText} {...props} />;
}
