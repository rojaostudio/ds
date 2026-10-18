import { afterEach, describe, expect, it } from 'vitest';
import { SocialLogo, socialLogoNames } from './social-logo';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const fills = (svg: SVGSVGElement) => [...svg.querySelectorAll('path')].map((p) => getComputedStyle(p).fill);

describe('SocialLogo', () => {
  it('draws the Figma social/* family', () => {
    expect(socialLogoNames).toEqual([
      'anthropic', 'apple', 'claude', 'css', 'elevenlabs', 'facebook', 'figma', 'git', 'github', 'google', 'higgsfield',
      'instagram', 'leonardo', 'linkedin', 'mcp', 'messenger', 'nodejs', 'npm', 'posthog', 'resend', 'stripe',
      'supabase', 'telegram', 'threads', 'tiktok', 'vercel', 'whatsapp', 'x', 'youtube',
    ]);
  });

  it('every logo, in both colours, is a 48 frame with paths, at the size asked', async () => {
    const el = await render(
      <div>
        {socialLogoNames.map((name) => (
          <span key={name}>
            <SocialLogo name={name} size={20} />
            <SocialLogo name={name} color="mono" size={20} />
          </span>
        ))}
      </div>,
    );
    const svgs = [...el.querySelectorAll('svg')];
    expect(svgs).toHaveLength(socialLogoNames.length * 2);
    for (const svg of svgs) {
      expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
      expect(svg.getBoundingClientRect().width).toBe(20);
      expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
    }
  });

  describe.each(MODES)('%s', (mode) => {
    it('decorative and named logos pass axe', async () => {
      const el = await render(
        <p>
          <SocialLogo name="github" /> GitHub <SocialLogo name="youtube" color="mono" aria-label="YouTube" />
        </p>,
        mode,
      );
      expect(await axeViolations(el)).toEqual([]);
    });

    it('brand: the black parts are the ink of the theme; the brand colours stay raw', async () => {
      const el = await render(
        <>
          <SocialLogo name="github" />
          <SocialLogo name="stripe" />
          <SocialLogo name="tiktok" />
        </>,
        mode,
      );
      const [github, stripe, tiktok] = [...el.querySelectorAll('svg')];
      const ink = mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
      expect(fills(github)).toEqual([ink]);
      expect(fills(stripe)).toEqual(['rgb(99, 91, 255)']);
      expect(fills(tiktok)).toEqual(['rgb(255, 0, 79)', ink, 'rgb(0, 242, 234)']);
    });
  });

  it('mono takes the colour around it; tone fixes the ink whatever the theme', async () => {
    const el = await render(
      <>
        <span style={{ color: 'rgb(200, 0, 0)' }}>
          <SocialLogo name="instagram" color="mono" />
        </span>
        <SocialLogo name="x" tone="dark" />
        <SocialLogo name="facebook" color="mono" tone="dark" />
      </>,
    );
    const [instagram, x, facebook] = [...el.querySelectorAll('svg')];
    expect(new Set(fills(instagram))).toEqual(new Set(['rgb(200, 0, 0)']));
    expect(fills(x)).toEqual(['rgb(255, 255, 255)']);
    expect(fills(facebook)).toEqual(['rgb(255, 255, 255)']);
  });

  it('mono flattens the cut-outs into one shape', async () => {
    const el = await render(<SocialLogo name="facebook" color="mono" />);
    expect(el.querySelectorAll('path')).toHaveLength(1);
  });

  it('decorative by default; aria-label makes it an image with that name', async () => {
    const el = await render(
      <>
        <SocialLogo name="whatsapp" />
        <SocialLogo name="whatsapp" aria-label="WhatsApp" />
      </>,
    );
    const [plain, named] = [...el.querySelectorAll('svg')];
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    expect(plain.getAttribute('role')).toBeNull();
    expect(named.getAttribute('role')).toBe('img');
    expect(named.getAttribute('aria-hidden')).toBeNull();
    expect(named.getAttribute('aria-label')).toBe('WhatsApp');
  });

  it('two logos with gradients on one page do not share ids', async () => {
    const el = await render(
      <>
        <SocialLogo name="google" />
        <SocialLogo name="google" />
        <SocialLogo name="telegram" />
      </>,
    );
    const ids = [...el.querySelectorAll('[id]')].map((n) => n.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const ref of el.querySelectorAll('[fill^="url(#"], [mask], [filter]')) {
      for (const attr of ['fill', 'mask', 'filter']) {
        const id = ref.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1];
        if (id) expect(document.getElementById(id), `${attr} → #${id}`).not.toBeNull();
      }
    }
  });
});
