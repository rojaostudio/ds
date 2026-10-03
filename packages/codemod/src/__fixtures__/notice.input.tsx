import Link from 'next/link';
import { Notice } from '@rojaostudio/ds/components';

export function Notices({ upgrade }: { upgrade: () => void }) {
  return (
    <>
      <Notice severity="warning" intent="commercial" title="Limite perto" description="Você usou 90%." cta={{ label: 'Ver planos', href: '/planos' }} linkAs={Link} />
      <Notice severity="critical" title="Pagamento recusado" cta={{ label: 'Atualizar', onClick: upgrade }} />
    </>
  );
}
