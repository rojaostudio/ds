import type { ReactNode } from 'react';
import { PricingPlan } from './pricing';

/** @deprecated Use PricingPlanProps. */
export interface PricingCardProps {
  name: string;
  /** Price already formatted by the caller ("R$49,90", "Grátis"). */
  price: string;
  period?: string;
  description?: string;
  features: string[];
  recommended?: boolean;
  /** Default "Recomendado". */
  recommendedLabel?: string;
  /** Ignored: the Figma [RDS] plan has one badge only, the recommended one. */
  badge?: string;
  cta: ReactNode;
  className?: string;
}

/**
 * @deprecated Use PricingPlan (Figma [RDS] Blocks/.pricing/plan), inside a Pricing. A thin wrapper over it: every
 * prop passes through except `badge`, which the Figma does not have.
 */
export function PricingCard({ badge: _badge, ...props }: PricingCardProps) {
  return <PricingPlan {...props} />;
}
