import { afterEach, describe, expect, it } from 'vitest';
import { act, type ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const PATH: BreadcrumbItem[] = [
  { label: 'Início', href: '#/' },
  { label: 'Produtos', href: '#/produtos' },
  { label: 'Mesa de jantar' },
];

const LONG: BreadcrumbItem[] = [
  { label: 'Início', href: '#/' },
  { label: 'Loja', href: '#/loja' },
  { label: 'Produtos', href: '#/produtos' },
  { label: 'Móveis', href: '#/produtos/moveis' },
  { label: 'Mesa de jantar' },
];

describe.each(MODES)('Breadcrumb (%s)', (mode) => {
  it('neutral (default), and inverse over colors/primary, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <Breadcrumb items={PATH} />
        <Breadcrumb items={LONG} aria-label="Caminho longo" />
        <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 8 }}>
          <Breadcrumb items={PATH} tone="inverse" aria-label="Caminho sobre a marca" />
        </div>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Breadcrumb behaviour', () => {
  it('the current step (breadcrumb/label/current → text/heading, navy) passes axe on the rojao light theme', async () => {
    const el = await render(<Breadcrumb items={PATH} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a named nav with an ordered list; the last step is the current page, without a link', async () => {
    const el = await render(<Breadcrumb items={PATH} />);
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Caminho');
    const steps = [...nav.querySelectorAll('ol > li')];
    expect(steps).toHaveLength(3);
    const current = steps[2]!.querySelector('[aria-current]')!;
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
    expect(el.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(steps[0]!.querySelector('a')!.getAttribute('href')).toBe('#/');
    // The arrows are decoration.
    expect(steps[0]!.querySelector('.rds-breadcrumb__separator')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a long path hides the middle behind "…"; the button shows it all and moves the focus there', async () => {
    const el = await render(<Breadcrumb items={LONG} />);
    expect(el.querySelectorAll('ol > li')).toHaveLength(4);
    const more = el.querySelector<HTMLButtonElement>('button')!;
    expect(more.getAttribute('aria-label')).toBe('Mostrar o caminho completo');
    await act(async () => more.click());
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(el.querySelectorAll('ol > li')).toHaveLength(5);
    expect(document.activeElement!.textContent).toBe('Loja');
  });

  it('linkAs takes a framework link', async () => {
    const Link = ({ href, className, children }: { href: string; className?: string; children: ReactNode }) => (
      <a href={href} className={className} data-router="">
        {children}
      </a>
    );
    const el = await render(<Breadcrumb items={PATH} linkAs={Link} />);
    expect(el.querySelectorAll('a[data-router]')).toHaveLength(2);
  });
});
