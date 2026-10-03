import { Spinner, Badge } from '@rojaostudio/ds/components';

export function Indicators({ n }: { n: number }) {
  return (
    <>
      <Spinner />
      <Spinner size="xs" color="brand" />
      <Spinner size="xl" color="inverse" />
      <Spinner size="lg" color="current" label="Salvando…" />
      <Badge>Novo</Badge>
      <Badge variant="primary">Destaque</Badge>
      <Badge variant="neutral" size="sm">Rascunho</Badge>
      <Badge variant="success">Pago</Badge>
      <Badge variant="active" size="sm">Ativo</Badge>
      <Badge variant="error">Falhou</Badge>
      <Badge variant="count" count={n} />
    </>
  );
}
