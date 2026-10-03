import { Alert, Button } from '@rojaostudio/ds/components';
import type { AlertTone } from '@rojaostudio/ds/components';

export function Alerts({ tone, retry, error }: { tone: AlertTone; retry: () => void; error: string }) {
  return (
    <>
      <Alert tone="danger" title="Falhou ao salvar" action={<Button tone="neutral" variant="ghost" onClick={retry}>Tentar de novo</Button>} description="Confira a conexão e tente outra vez." />
      <Alert tone={tone} title="Aviso" description={error} />
      <Alert title="Sem ícone" showIcon={false} onClose={retry} />
      <Alert tone="info" title="Detalhes" description={<>Veja <strong>aqui</strong>.</>} />
    </>
  );
}
