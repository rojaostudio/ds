'use client';

import type { ReactNode } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from './internal/icons';

type Heading = 'h2' | 'h3' | 'h4';

type AccordionBase = {
  /** The AccordionItems, in order (Figma: the `items` slot). */
  children: ReactNode;
  className?: string;
};

export type AccordionProps = AccordionBase &
  (
    | {
        /** single (default): one open at a time, and it can close. multiple: when the person compares sections. */
        type?: 'single';
        /** The item open at first (its `value`). */
        defaultValue?: string;
        value?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        type: 'multiple';
        defaultValue?: string[];
        value?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );

/**
 * Accordion — Figma [RDS] Content/Accordion (Radix Accordion). Questions or sections that open and close, one under
 * the other. Keyboard: Tab between the triggers, Enter or Space opens, arrows move between them, Home and End jump
 * to the first and the last. It is also the Collapsible: a single section that opens is an Accordion with one item.
 * Styles: accordion.css.
 */
export function Accordion({ className, children, ...props }: AccordionProps) {
  const classes = ['rds-accordion', className].filter(Boolean).join(' ');
  if (props.type === 'multiple') {
    return (
      <AccordionPrimitive.Root {...props} type="multiple" className={classes}>
        {children}
      </AccordionPrimitive.Root>
    );
  }
  return (
    <AccordionPrimitive.Root {...props} type="single" collapsible className={classes}>
      {children}
    </AccordionPrimitive.Root>
  );
}

export interface AccordionItemProps {
  /** A unique id for this item, used by `defaultValue` and `value`. */
  value: string;
  /** What is inside (Figma: `title`), as a question or a subject. Never a vague "more information". */
  title: ReactNode;
  /** The heading level that fits the page's heading order. */
  titleAs?: Heading;
  /** The answer (Figma: `content`). */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** One item (Figma: .accordion/item): a heading with a button, and a region that opens. */
export function AccordionItem({ value, title, titleAs = 'h3', children, disabled, className }: AccordionItemProps) {
  const Title = titleAs;
  return (
    <AccordionPrimitive.Item
      value={value}
      disabled={disabled}
      className={['rds-accordion__item', className].filter(Boolean).join(' ')}
    >
      <AccordionPrimitive.Header asChild>
        <Title className="rds-accordion__heading">
          <AccordionPrimitive.Trigger className="rds-accordion__trigger">
            <span className="rds-accordion__title">{title}</span>
            <span className="rds-accordion__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </AccordionPrimitive.Trigger>
        </Title>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="rds-accordion__content">
        <div className="rds-accordion__body">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
