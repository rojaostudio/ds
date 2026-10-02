// One polite live region for the whole page, in body: components announce a short status through
// it (a Button that starts loading) without adding elements next to themselves. Not exported.
let region: HTMLElement | null = null;

export function announce(message: string) {
  if (typeof document === 'undefined') return;
  if (!region || !region.isConnected) {
    region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.className = 'rds-visually-hidden';
    region.dataset.rdsAnnouncer = '';
    document.body.append(region);
  }
  // Clear first, so the same message said twice is announced twice.
  region.textContent = '';
  const target = region;
  setTimeout(() => {
    target.textContent = message;
  }, 50);
}
