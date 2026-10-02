import { toast } from '@rojaostudio/ds/components/toaster';
import type { ToastOptions } from '@rojaostudio/ds/components/toaster';

export async function upload(file: Blob, send: (f: Blob) => Promise<string>, opts: ToastOptions) {
  await toast.promise(send(file), {
    loading: 'Enviando…',
    success: 'Enviado',
    error: 'Falhou',
  });
  const id = toast.loading('Processando');
  toast('Feito', opts);
  toast.dismiss(id);
}
