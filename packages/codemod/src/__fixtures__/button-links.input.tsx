import Link from 'next/link';
import { Button, buttonVariants } from '@rojaostudio/ds/components';

export function Links({ id, extra }: { id: string; extra: string }) {
  return (
    <nav>
      <Link href="/novo" className={buttonVariants({ variant: 'outline' })}>
        Novo
      </Link>
      <a href={`/item/${id}`} className={buttonVariants({ variant: 'ghost', color: 'secondary', size: 'sm' })} target="_blank">
        Abrir
      </a>
      <Link href="/sair" className={buttonVariants({ color: 'danger', fullWidth: true, className: 'mt-4' })}>
        Sair
      </Link>
      <a href="/ajuda" className={buttonVariants({ variant: 'link', className: extra })}>Ajuda</a>
      <Link className={buttonVariants()} href="/">Início</Link>
    </nav>
  );
}

export function More() {
  return (
    <p>
      <Button variant="link">
        <Link href="/planos">Planos</Link>
      </Button>
      <Button variant="link" color="secondary" size="sm"><a href="/termos">Termos</a></Button>
    </p>
  );
}
