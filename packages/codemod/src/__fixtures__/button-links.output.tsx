import Link from 'next/link';
import { Button } from '@rojaostudio/ds/components';

export function Links({ id, extra }: { id: string; extra: string }) {
  return (
    <nav>
      <Button asChild variant="outline"><Link href="/novo">
        Novo
      </Link></Button>
      <Button asChild tone="neutral" variant="ghost" size="sm"><a href={`/item/${id}`} target="_blank">
        Abrir
      </a></Button>
      <Button asChild tone="danger" className="mt-4 w-full"><Link href="/sair">
        Sair
      </Link></Button>
      <Button asChild variant="ghost" className={extra}><a href="/ajuda">Ajuda</a></Button>
      <Button asChild><Link href="/">Início</Link></Button>
    </nav>
  );
}

export function More() {
  return (
    <p>
      <Button variant="ghost" asChild>
        <Link href="/planos">Planos</Link>
      </Button>
      <Button variant="ghost" tone="neutral" size="sm" asChild><a href="/termos">Termos</a></Button>
    </p>
  );
}
