import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps tabs/label/selected to text/heading, which on the rojao light theme is flare (#ff6a00, 2.9:1 on white): a
// violation of the Figma itself, as in item.browser.test.tsx. Kept out of the light matrix and pinned with it.fails.
const KNOWN_LIGHT_SELECTED = (mode: string) => (mode === 'light' ? ['.rds-tabs__tab[data-state="active"]'] : []);

function Example({ onValueChange }: { onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue="abertos" onValueChange={onValueChange}>
      <TabsList aria-label="Pedidos" trailing={<Button variant="ghost">Novo pedido</Button>}>
        <TabsTrigger value="abertos" count={4}>
          Em aberto
        </TabsTrigger>
        <TabsTrigger value="novos" dot>
          Novos
        </TabsTrigger>
        <TabsTrigger value="arquivados" count={12}>
          Arquivados
        </TabsTrigger>
        <TabsTrigger value="relatorios" soon disabled>
          Relatórios
        </TabsTrigger>
      </TabsList>
      <TabsContent value="abertos">Pedidos em aberto</TabsContent>
      <TabsContent value="novos">Pedidos novos</TabsContent>
      <TabsContent value="arquivados">Pedidos arquivados</TabsContent>
      <TabsContent value="relatorios">Relatórios</TabsContent>
    </Tabs>
  );
}

describe.each(MODES)('Tabs (%s)', (mode) => {
  it('count, dot, "em breve", disabled and the trailing slot pass axe', async () => {
    const el = await render(<Example />, mode);
    expect(await axeViolations(el, KNOWN_LIGHT_SELECTED(mode))).toEqual([]);
  });
});

describe('Tabs behaviour', () => {
  it.fails('the selected label (tabs/label/selected → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Example />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  // tabs/soon/text is text/disabled over tabs/soon/background (surface/muted): 3.6:1 at 10px in dark. A violation of the
  // Figma itself; on a disabled tab (the usual case, covered in the matrix) axe does not measure it.
  it.fails('"em breve" on a tab that still opens passes axe', async () => {
    const el = await render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Relatórios">
          <TabsTrigger value="a">Resumo</TabsTrigger>
          <TabsTrigger value="b" soon>
            Funil
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">Resumo</TabsContent>
      </Tabs>,
      'dark',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is a tablist; the open tab has aria-selected and names its panel', async () => {
    const el = await render(<Example />);
    expect(el.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Pedidos');
    const tabs = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    const panel = el.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0]!.id);
    // The trailing action is outside the tablist.
    expect(el.querySelector('[role="tablist"] .rds-button')).toBeNull();
    // The dot is not colour only.
    expect(tabs[1]!.textContent).toContain('Tem novidade');
  });

  it('the arrows, Home and End move between tabs and open them, skipping the disabled one', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Example onValueChange={onValueChange} />);
    const [abertos, novos, arquivados] = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
    abertos!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(novos);
    expect(novos!.getAttribute('aria-selected')).toBe('true');
    expect(abertos!.getAttribute('aria-selected')).toBe('false');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(arquivados);
    expect(arquivados!.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(abertos);
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(abertos);
    expect(abertos!.getAttribute('aria-selected')).toBe('true');
    expect(onValueChange).toHaveBeenCalledWith('arquivados');
    // One tab stop: only the open tab is in the tab order.
    expect(abertos!.tabIndex).toBe(0);
    expect(novos!.tabIndex).toBe(-1);
  });

  it('asChild: the tabs are links, with no next/* inside; value follows the route', async () => {
    const el = await render(
      <Tabs value="/pedidos/arquivados" activationMode="manual">
        <TabsList aria-label="Pedidos">
          <TabsTrigger value="/pedidos" asChild count={4}>
            <a href="#/pedidos">Em aberto</a>
          </TabsTrigger>
          <TabsTrigger value="/pedidos/arquivados" asChild>
            <a href="#/pedidos/arquivados">Arquivados</a>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="/pedidos/arquivados">Pedidos arquivados</TabsContent>
      </Tabs>,
      'dark',
    );
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a.rds-tabs__tab')];
    expect(links.map((a) => a.getAttribute('role'))).toEqual(['tab', 'tab']);
    expect(links.map((a) => a.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(links[0]!.getAttribute('href')).toBe('#/pedidos');
    expect(links[0]!.querySelector('.rds-tabs__count')!.textContent).toBe('4');
    // manual: the arrows move the focus without changing the selection (no navigation behind the person's back).
    links[1]!.focus();
    await act(async () => userEvent.keyboard('{ArrowLeft}'));
    expect(document.activeElement).toBe(links[0]);
    expect(links[1]!.getAttribute('aria-selected')).toBe('true');
    expect(await axeViolations(el)).toEqual([]);
  });
});
