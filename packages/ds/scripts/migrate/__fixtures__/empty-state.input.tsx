import { EmptyState } from '@rojaostudio/ds/components';
import { Plus } from 'lucide-react';

export function Lists({ create }: { create: () => void }) {
  return (
    <>
      <EmptyState icon="customer" title="Nenhum cliente" description="Cadastre o primeiro." cta={{ label: 'Cadastrar', href: '/clientes/novo' }} />
      <EmptyState icon="search" size="compact" title="Nada encontrado" />
      <EmptyState title="Sem pedidos" cta={{ label: 'Novo pedido', onClick: create }} />
      <Plus />
    </>
  );
}
