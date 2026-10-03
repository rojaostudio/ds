import { Empty, Button } from '@rojaostudio/ds/components';
import { Plus, Users, SearchX } from 'lucide-react';

export function Lists({ create }: { create: () => void }) {
  return (
    <>
      <Empty icon={<Users />} title="Nenhum cliente" description="Cadastre o primeiro." action={<Button asChild><a href="/clientes/novo">Cadastrar</a></Button>} />
      <Empty icon={<SearchX />} title="Nada encontrado" />
      <Empty title="Sem pedidos" action={<Button onClick={create}>Novo pedido</Button>} />
      <Plus />
    </>
  );
}
