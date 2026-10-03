import { toast } from '@rojaostudio/ds/components';

export async function save(run: () => Promise<{ ok: boolean; error?: string }>) {
  const res = await run();
  if (!res.ok) toast({ title: res.error ?? 'Erro', tone: 'danger' });
  else toast({ title: 'Salvo', tone: 'success', description: 'Tudo certo.', duration: 3000 });
  toast({ title: 'Sincronizando' });
  toast({ title: 'Atenção', tone: 'warning' });
  toast({ title: 'Dica', tone: 'info' });
  toast.dismiss();
  toast({ title: 'Já na 2.0', tone: 'success' });
}
