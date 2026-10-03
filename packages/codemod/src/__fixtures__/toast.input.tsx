import { toast } from '@rojaostudio/ds/components';

export async function save(run: () => Promise<{ ok: boolean; error?: string }>) {
  const res = await run();
  if (!res.ok) toast.error(res.error ?? 'Erro');
  else toast.success('Salvo', { description: 'Tudo certo.', duration: 3000 });
  toast('Sincronizando');
  toast('Atenção', { variant: 'warning' });
  toast.info('Dica');
  toast.dismiss();
  toast({ title: 'Já na 2.0', tone: 'success' });
}
