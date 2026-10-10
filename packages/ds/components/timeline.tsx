import { useId, type HTMLAttributes, type ReactNode } from 'react';

export interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
  /** What history it is ("Histórico do pedido 1042"): it names the region. */
  'aria-label': string;
  /** The TimelineDays, the most recent first (Figma: the `items` slot). */
  children: ReactNode;
}

/**
 * Timeline — Figma [RDS] Content/Timeline. A record's history: who did what and when, grouped by day, the most recent
 * on top (audit, status changes, payments, reopenings). Each day is a list (<ol>) named by its label; each time is a
 * <time>. Not the chat's Marker, not the steps of a flow (StepProgress). Styles: timeline.css.
 */
export function Timeline({ className, children, ...rest }: TimelineProps) {
  return (
    <div role="region" {...rest} className={['rds-timeline', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export interface TimelineDayProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The day (Figma .timeline/day `label`): "Hoje", "Ontem", "06/10". */
  label: ReactNode;
  /** Its TimelineItems, the most recent first. */
  children: ReactNode;
}

/**
 * One day: its label, a heading (<h3>), and the list of what happened (Figma .timeline/day and the items after it).
 */
export function TimelineDay({ label, children, className, ...rest }: TimelineDayProps) {
  const id = useId();
  return (
    <section {...rest} className={['rds-timeline__day', className].filter(Boolean).join(' ')}>
      <h3 id={id} className="rds-timeline__day-label">
        {label}
      </h3>
      <ol aria-labelledby={id} className="rds-timeline__list">
        {children}
      </ol>
    </section>
  );
}

export interface TimelineItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
  /** Who did it, in miniature: an Avatar sm (Figma: the exposed `avatar`). Decorative: the name is in `actor`. */
  avatar?: ReactNode;
  /** Who did it (Figma: `actor`): "Ana", "Sistema". */
  actor: ReactNode;
  /** What they did (Figma: `action`): "mudou o status", "registrou um pagamento de R$ 200,00". */
  action: ReactNode;
  /** The time as shown (Figma: `time`): "14:32". */
  time: string;
  /** The same moment, machine-readable, for the <time> (ISO 8601). */
  dateTime: string;
  /** The change, when there is one (Figma: `showDiff` + `diff`): "Aberto → Em produção". */
  diff?: ReactNode;
}

/** One event (Figma .timeline/item): the avatar and the line down to the next, who, what, when and the change. */
export function TimelineItem({ avatar, actor, action, time, dateTime, diff, className, ...rest }: TimelineItemProps) {
  return (
    <li {...rest} className={['rds-timeline__item', className].filter(Boolean).join(' ')}>
      <span className="rds-timeline__rail" aria-hidden="true">
        {avatar && <span className="rds-timeline__avatar">{avatar}</span>}
        <span className="rds-timeline__line" />
      </span>
      <div className="rds-timeline__body">
        <div className="rds-timeline__head">
          <p className="rds-timeline__summary">
            <span className="rds-timeline__actor">{actor}</span> <span className="rds-timeline__action">{action}</span>
          </p>
          <time className="rds-timeline__time" dateTime={dateTime}>
            {time}
          </time>
        </div>
        {diff && <p className="rds-timeline__diff">{diff}</p>}
      </div>
    </li>
  );
}
