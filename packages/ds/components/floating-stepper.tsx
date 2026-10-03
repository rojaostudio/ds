'use client';

/**
 * floating-stepper — the 1.x and 2.0-next name of the Stepper, kept so `@rojaostudio/ds/components/floating-stepper`
 * and `FloatingStepper` still work in 2.0. The codemod (`npx @rojaostudio/ds-codemod`) renames both.
 */
import { Stepper } from './stepper';
import type { StepperProps, StepperStep } from './stepper';

/** @deprecated Renamed to `Stepper` (`@rojaostudio/ds/components/stepper`) in 2.0. Same props. */
export const FloatingStepper = Stepper;
/** @deprecated Renamed to `StepperProps` in 2.0. */
export type FloatingStepperProps = StepperProps;
/** @deprecated Renamed to `StepperStep` in 2.0. */
export type FloatingStepperStep = StepperStep;
