import { Card, CardTitle } from '@rojaostudio/ds/components';

export function Cards({ open }: { open: () => void }) {
  return (
    <>
      <Card variant="outlined" interactive onClick={open}>
        <CardTitle>Plano Pro</CardTitle>
      </Card>
      <Card variant="flat" className="p-4">
        Texto
      </Card>
    </>
  );
}
