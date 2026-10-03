import Link from 'next/link';
import { Button, buttonVariants } from '@rojaostudio/ds/components';
import type { ButtonVariant } from '@rojaostudio/ds/components';
import { ArrowRight, Plus } from 'lucide-react';

export function Toolbar({ kind, props }: { kind: ButtonVariant; props: { onClick: () => void } }) {
  return (
    <div>
      <Link href="/novo" className={buttonVariants({ variant: 'outline' })}>
        Novo
      </Link>
      <Button variant="tonal">Tonal</Button>
      <Button variant="link" color="secondary">Ver mais</Button>
      <Button variant={kind}>Dinâmico</Button>
      <Button iconLeft={<Plus />} iconRight={<ArrowRight />}>Adicionar</Button>
      <Button {...props}>Espalhado</Button>
    </div>
  );
}
