import { Alert } from '@rojaostudio/ds/components';
import type { AlertVariant } from '@rojaostudio/ds/components';

export function Alerts({ tone, retry, error }: { tone: AlertVariant; retry: () => void; error: string }) {
  return (
    <>
      <Alert variant="danger" title="Falhou ao salvar" action={{ label: 'Tentar de novo', onClick: retry }}>
        Confira a conexão e tente outra vez.
      </Alert>
      <Alert variant={tone} title="Aviso">{error}</Alert>
      <Alert title="Sem ícone" hideIcon onClose={retry} />
      <Alert variant="info" title="Detalhes">
        Veja <strong>aqui</strong>.
      </Alert>
    </>
  );
}
