import Link from 'next/link';
import { Button, Alert } from '@rojaostudio/ds/components';

export function Notices({ upgrade }: { upgrade: () => void }) {
  return (
    <>
      <Alert tone="warning" announce="status" title="Limite perto" description="Você usou 90%." action={<Button asChild tone="neutral" variant="ghost"><Link href="/planos">Ver planos</Link></Button>} />
      <Alert tone="danger" announce="alert" title="Pagamento recusado" action={<Button tone="neutral" variant="ghost" onClick={upgrade}>Atualizar</Button>} />
    </>
  );
}
