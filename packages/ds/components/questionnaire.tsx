'use client';

import { type FormEvent, type FormHTMLAttributes, type ReactNode } from 'react';
import { Button } from './button';
import { CheckboxGroup } from './checkbox-group';
import { ChoiceCardGroup } from './choice-card';
import { AlertIcon } from './internal/icons';
import { Progress } from './progress';
import { RadioGroup } from './radio-group';

/**
 * How the person answers. single: Radio children (the RadioGroup is made here, named by the question); card:
 * ChoiceCard children (the ChoiceCardGroup); multiple: Checkbox children (the CheckboxGroup); text: an Input or a
 * Textarea child, with its own label.
 */
export type QuestionnaireAnswer = 'single' | 'card' | 'multiple' | 'text';

export interface QuestionnaireProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'title' | 'onSubmit'> {
  /** This question's number, from 1. */
  step: number;
  /** How many questions. On the last one the next button becomes "Enviar". */
  steps: number;
  /** The question (Figma: `title`). It names the form and the group of options. */
  title: string;
  /** How to answer (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  answer?: QuestionnaireAnswer;
  /** The options, or the field (Figma: slot `choices`). */
  children: ReactNode;
  /** With `single` and `card`: the chosen value, controlled or at first, and the change. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** What is missing (Figma: `showError` + `error`). Tied to the options and announced. */
  error?: ReactNode;
  /** The back button, "Voltar" (Figma: `showBack`). */
  onBack?: () => void;
  /** The skip button, "Pular", only on an optional question (Figma: `showSkip`). */
  onSkip?: () => void;
  /** The next button ("Próxima", or "Enviar" on the last question). Enter in a field also runs it. */
  onNext: () => void;
}

/**
 * Questionnaire — Figma [RDS] Chat/Questionnaire. One question at a time, inside the conversation: the assistant
 * asks and the person chooses. Progress on top ("Pergunta 2 de 4"), the question, the options, the error and the
 * actions. Styles: questionnaire.css.
 */
export function Questionnaire({
  step,
  steps,
  title,
  description,
  answer = 'single',
  children,
  value,
  defaultValue,
  onValueChange,
  error,
  onBack,
  onSkip,
  onNext,
  className,
  ...rest
}: QuestionnaireProps) {
  const errorMessage = error ? (
    <span className="rds-questionnaire__error">
      <span className="rds-questionnaire__error-icon" aria-hidden="true">
        <AlertIcon />
      </span>
      <span>{error}</span>
    </span>
  ) : undefined;
  const legend = <span className="rds-questionnaire__title">{title}</span>;
  const hint = description ? <span className="rds-questionnaire__description">{description}</span> : undefined;

  let body: ReactNode;
  if (answer === 'single') {
    body = (
      <RadioGroup
        legend={legend}
        hint={hint}
        errorMessage={errorMessage}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        {children}
      </RadioGroup>
    );
  } else if (answer === 'multiple') {
    body = (
      <CheckboxGroup legend={legend} hint={hint} errorMessage={errorMessage}>
        {children}
      </CheckboxGroup>
    );
  } else {
    // card and text: the heading is drawn here; the error is said once, in an alert under the options.
    const heading = (
      <span className="rds-questionnaire__heading">
        {legend}
        {hint}
      </span>
    );
    body = (
      <div className="rds-questionnaire__body">
        {answer === 'card' ? (
          <ChoiceCardGroup legend={heading} value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
            {children}
          </ChoiceCardGroup>
        ) : (
          <>
            <p className="rds-questionnaire__text-heading">
              {heading}
            </p>
            {children}
          </>
        )}
        {errorMessage && <p role="alert" className="rds-questionnaire__alert">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-label={title}
      {...rest}
      className={['rds-questionnaire', className].filter(Boolean).join(' ')}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onNext();
      }}
    >
      <Progress size="sm" value={step} max={steps} label={`Pergunta ${step} de ${steps}`} showValue={false} />
      {body}
      <div className="rds-questionnaire__actions">
        {onBack && (
          <Button tone="neutral" variant="ghost" onClick={onBack}>
            Voltar
          </Button>
        )}
        <span className="rds-questionnaire__spacer" />
        {onSkip && (
          <Button tone="neutral" variant="ghost" onClick={onSkip}>
            Pular
          </Button>
        )}
        <Button type="submit">{step >= steps ? 'Enviar' : 'Próxima'}</Button>
      </div>
    </form>
  );
}
