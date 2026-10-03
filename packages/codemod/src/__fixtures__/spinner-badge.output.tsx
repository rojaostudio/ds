import { Spinner, Badge, Status } from '@rojaostudio/ds/components';

export function Indicators({ n }: { n: number }) {
  return (
    <>
      <Spinner />
      <Spinner size="sm" />
      <Spinner size="lg" tone="inverse" />
      <Spinner label="Salvando…" />
      <Badge variant="soft">Novo</Badge>
      <Badge tone="neutral" variant="fill">Destaque</Badge>
      <Badge variant="soft">Rascunho</Badge>
      <Status tone="success" variant="soft">Pago</Status>
      <Status tone="success" size="sm">Ativo</Status>
      <Status tone="danger">Falhou</Status>
      <Badge value={n} />
    </>
  );
}
