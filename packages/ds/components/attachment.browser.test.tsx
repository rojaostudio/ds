import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { Attachment, type AttachmentOrientation, type AttachmentStatus } from './attachment';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const STATUSES: AttachmentStatus[] = ['idle', 'uploading', 'processing', 'error', 'done'];
const ORIENTATIONS: AttachmentOrientation[] = ['horizontal', 'vertical'];

// [RDS] maps attachment/title to text/heading, which on the rojao light theme is flare (2.9:1 on white): a violation
// of the Figma itself. Kept out of the light matrix and pinned with it.fails below, as in accordion.browser.test.tsx.
const KNOWN_LIGHT_TITLE = (mode: string) => (mode === 'light' ? ['.rds-attachment__title'] : []);

describe.each(MODES)('Attachment (%s)', (mode) => {
  it('every status × orientation, with the action, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ORIENTATIONS.flatMap((orientation) =>
          STATUSES.map((status) => (
            <Attachment
              key={`${orientation}-${status}`}
              title={`comprovante-${orientation}-${status}.pdf`}
              description={status === 'error' ? 'Não enviou. Tente de novo.' : 'PDF · 240 KB'}
              status={status}
              orientation={orientation}
              progress={40}
              onRemove={() => {}}
              onRetry={() => {}}
            />
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_TITLE(mode))).toEqual([]);
  });
});

describe('Attachment behaviour', () => {
  it.fails('the title (attachment/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Attachment title="comprovante.pdf" description="PDF · 240 KB" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('says each status in the same polite live region: uploading, processing, error, done', async () => {
    let setStatus: (status: AttachmentStatus) => void = () => {};
    function Upload() {
      const [status, set] = useState<AttachmentStatus>('idle');
      setStatus = set;
      return <Attachment title="comprovante.pdf" description="PDF · 240 KB" status={status} progress={40} />;
    }
    const el = await render(<Upload />);
    const region = el.querySelector('[role="status"]')!;
    expect(region.textContent).toBe('');
    const said: string[] = [];
    for (const status of ['uploading', 'processing', 'error', 'done'] as const) {
      await act(async () => setStatus(status));
      // The same element, so a screen reader hears the change.
      expect(el.querySelector('.rds-attachment > [role="status"]')).toBe(region);
      said.push(region.textContent!);
    }
    expect(said).toEqual(['Enviando comprovante.pdf', 'Processando comprovante.pdf', 'Não deu para enviar comprovante.pdf', 'comprovante.pdf enviado']);
  });

  it('uploading shows the bar with the value; uploading and processing are busy', async () => {
    const el = await render(
      <div>
        <Attachment title="a.pdf" status="uploading" progress={40} />
        <Attachment title="b.pdf" status="processing" />
        <Attachment title="c.pdf" status="done" />
      </div>,
    );
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-label')).toBe('Enviando a.pdf');
    const [a, b, c] = el.querySelectorAll('.rds-attachment');
    expect(a.getAttribute('aria-busy')).toBe('true');
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(c.hasAttribute('aria-busy')).toBe(false);
    // The media is decorative: only the live region speaks.
    expect(b.querySelector('.rds-attachment__media')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('the action removes, or retries in error, named after the file', async () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    const el = await render(
      <div>
        <Attachment title="a.pdf" onRemove={onRemove} onRetry={onRetry} />
        <Attachment title="b.pdf" status="error" onRemove={onRemove} onRetry={onRetry} />
        <Attachment title="c.pdf" />
      </div>,
    );
    const buttons = [...el.querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Remover a.pdf', 'Enviar b.pdf de novo']);
    await act(async () => buttons[0].click());
    await act(async () => buttons[1].click());
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('measures 320 wide horizontal and 176 vertical, with a 40 and a 112 media', async () => {
    const el = await render(
      <div>
        <Attachment title="a.pdf" />
        <Attachment title="b.png" orientation="vertical" />
      </div>,
    );
    const [h, v] = el.querySelectorAll<HTMLElement>('.rds-attachment');
    expect(h.getBoundingClientRect().width).toBe(320);
    expect(v.getBoundingClientRect().width).toBe(176);
    expect(h.querySelector('.rds-attachment__media')!.getBoundingClientRect().height).toBe(40);
    expect(v.querySelector('.rds-attachment__media')!.getBoundingClientRect().height).toBe(112);
  });
});
